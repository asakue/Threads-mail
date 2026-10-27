import { CleanedContent, SmartFeedCategory } from '../types/index.js';

export interface CleanOptions {
  preserveGreeting?: boolean;
  stripDisclaimers?: boolean;
  collapseQuotes?: boolean;
}

/**
 * Regex patterns for bureaucratic corporate greetings (Russian & English).
 */
const GREETING_PATTERNS = [
  /^(Уважаемый(?:ая)?\s+[А-Яа-яЁёA-Za-z\s]+[,!]?)/i,
  /^(Добрый\s+(?:день|вечер|утро)(?:,?\s+[А-Яа-яЁёA-Za-z\s]+)?[,!.]?)/i,
  /^(Здравствуйте(?:,?\s+[А-Яа-яЁёA-Za-z\s]+)?[,!.]?)/i,
  /^(Привет(?:ствую)?(?:,?\s+[А-Яа-яЁёA-Za-z\s]+)?[,!.]?)/i,
  /^(Доброго\s+времени\s+суток[,!]?)/i,
  /^(Dear\s+[A-Za-z\s]+[,!]?)/i,
  /^(Hello(?:\s+[A-Za-z\s]+)?[,!.]?)/i,
  /^(Hi(?:\s+[A-Za-z\s]+)?[,!.]?)/i,
  /^(Good\s+(?:morning|afternoon|evening)[,!.]?)/i,
];

/**
 * Regex patterns for reply quote separators (Russian, English, Mail.ru, Yandex, Outlook).
 */
const QUOTE_SEPARATORS = [
  /\n\s*(?:On\s+.+wrote:?)/i,
  /\n\s*(?:\d{1,2}\s+[а-яА-ЯёЁ]+\s+\d{4}\s+г\.,?\s+\d{1,2}:\d{2},?\s+.+написал(?:\(а\))?:?)/i,
  /\n\s*(?:В\s+ответ\s+на\s+ваше\s+письмо\s+от.+)/i,
  /\n\s*(?:-----Original Message-----)/i,
  /\n\s*(?:----- Исходное сообщение -----)/i,
  /\n\s*(?:-------- Forwarded message --------)/i,
  /\n\s*(?:-------- Пересылаемое сообщение --------)/i,
  /\n\s*(?:От:\s*.+\s*\nКому:\s*.+\s*\nТема:\s*.+)/i,
  /\n\s*(?:From:\s*.+\s*\nTo:\s*.+\s*\nSubject:\s*.+)/i,
];

/**
 * Regex patterns for corporate signatures & footers.
 */
const SIGNATURE_PATTERNS = [
  /\n\s*(?:С\s+уважением,?|Best\s+regards,?|Sincerely,?|Kind\s+regards,?|С\s+наилучшими\s+пожеланиями,?)[\s\S]*$/i,
  /\n\s*(?:Отправлено\s+из\s+мобильной\s+почты|Отправлено\s+с\s+iPhone|Sent\s+from\s+my\s+iPhone|Sent\s+from\s+my\s+Galaxy)[\s\S]*$/i,
];

/**
 * Regex patterns for automated legal disclaimers.
 */
const DISCLAIMER_PATTERNS = [
  /\n\s*(?:Данное\s+сообщение\s+(?:и\s+любые\s+приложения|содержит|является)[\s\S]*конфиденциальн[\s\S]*)$/i,
  /\n\s*(?:This\s+email\s+and\s+any\s+attachments\s+are\s+confidential[\s\S]*)$/i,
  /\n\s*(?:Please\s+consider\s+the\s+environment\s+before\s+printing[\s\S]*)$/i,
];

/**
 * Strips HTML tags and normalizes whitespace while protecting line breaks and preventing XSS.
 */
export function htmlToCleanText(html: string): string {
  if (!html) return '';

  let text = html;

  // 1. Defang dangerous URI schemes
  text = text.replace(/javascript\s*:/gi, 'blocked-javascript:');
  text = text.replace(/vbscript\s*:/gi, 'blocked-vbscript:');

  // 2. Remove invisible tracking pixels: <img ... width="1" height="1" ...>
  text = text.replace(/<img[^>]+(?:width\s*=\s*["']?1["']?|height\s*=\s*["']?1["']?)[^>]*>/gi, '');

  // 3. Remove script, style, svg, iframe, object, embed tags with contents (recursive for nested tags)
  const dangerousTags = ['script', 'style', 'svg', 'iframe', 'object', 'embed'];
  for (const tag of dangerousTags) {
    const tagRegex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    while (tagRegex.test(text)) {
      text = text.replace(tagRegex, '');
    }
  }

  // 4. Remove unclosed dangerous tags like <svg ...>, <img ... onerror=...>, etc.
  text = text.replace(/<\/?(?:script|style|svg|iframe|object|embed)\b[^>]*>/gi, '');

  // 5. Replace br and p closures with newlines
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');

  // 6. Strip all other HTML tags recursively until no markup remains
  let prevText = '';
  while (prevText !== text) {
    prevText = text;
    text = text.replace(/<[^>]+>/g, '');
  }

  // 7. Strip inline event handler remnants (e.g. onload=..., onerror=...)
  text = text.replace(/\bon[a-z]+\s*=\s*["'][^"']*["']/gi, '');

  // 8. Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 9. Normalize excessive vertical spaces (more than 2 newlines -> 2 newlines)
  text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

/**
 * Transforms a raw email body into a clean messenger bubble format.
 */
export function declutterEmailContent(
  rawBody: string,
  options: CleanOptions = {}
): CleanedContent {
  const originalLength = rawBody ? rawBody.length : 0;
  if (!rawBody || !rawBody.trim()) {
    return {
      cleanBody: '',
      hasCollapsibleContent: false,
      originalLength: 0,
      cleanedLength: 0,
      cleanedRatio: 0,
    };
  }

  // 1. Convert HTML if present
  let processed = rawBody.includes('<') && rawBody.includes('>')
    ? htmlToCleanText(rawBody)
    : rawBody.replace(/\r\n/g, '\n').trim();

  let isolatedGreeting: string | undefined;
  let collapsedQuote: string | undefined;
  let signature: string | undefined;

  // 2. Extract and strip quote history (quoted replies)
  if (options.collapseQuotes !== false) {
    // Check known separators
    for (const sep of QUOTE_SEPARATORS) {
      const match = processed.search(sep);
      if (match !== -1) {
        collapsedQuote = processed.substring(match).trim();
        processed = processed.substring(0, match).trim();
        break;
      }
    }

    // Check RFC 3676 '>' lines at bottom of message
    const lines = processed.split('\n');
    let quoteStartIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith('>')) {
        quoteStartIndex = i;
      } else if (lines[i].trim() !== '') {
        break;
      }
    }

    if (quoteStartIndex !== -1) {
      const mainLines = lines.slice(0, quoteStartIndex);
      const quoteLines = lines.slice(quoteStartIndex);
      const extractedQuote = quoteLines.join('\n').trim();
      collapsedQuote = collapsedQuote
        ? `${collapsedQuote}\n\n${extractedQuote}`
        : extractedQuote;
      processed = mainLines.join('\n').trim();
    }
  }

  // 3. Strip legal disclaimers
  if (options.stripDisclaimers !== false) {
    for (const pattern of DISCLAIMER_PATTERNS) {
      const match = processed.search(pattern);
      if (match !== -1) {
        processed = processed.substring(0, match).trim();
      }
    }
  }

  // 4. Extract and strip signatures
  for (const pattern of SIGNATURE_PATTERNS) {
    const match = processed.search(pattern);
    if (match !== -1) {
      signature = processed.substring(match).trim();
      processed = processed.substring(0, match).trim();
      break;
    }
  }

  // 5. Extract greeting if at the very beginning
  if (!options.preserveGreeting) {
    for (const pattern of GREETING_PATTERNS) {
      const match = processed.match(pattern);
      if (match && match.index === 0) {
        isolatedGreeting = match[0].trim();
        processed = processed.substring(match[0].length).trim();
        // Remove leading comma, dot or newline if leftover
        processed = processed.replace(/^[,!\.\s\n]+/, '').trim();
        break;
      }
    }
  }

  const cleanedLength = processed.length;
  const cleanedRatio = originalLength > 0
    ? Math.max(0, Math.min(1, 1 - cleanedLength / originalLength))
    : 0;

  return {
    cleanBody: processed,
    isolatedGreeting,
    collapsedQuote,
    signature,
    hasCollapsibleContent: Boolean(collapsedQuote || signature || isolatedGreeting),
    originalLength,
    cleanedLength,
    cleanedRatio: Math.round(cleanedRatio * 100) / 100,
  };
}

/**
 * Intelligent categorization of an email into one of 4 smart feeds:
 * - human: 1-on-1 human communication
 * - service: GitHub, Figma, Notion, automated transactional bots
 * - receipt: Invoices, bank alerts, receipts, payments
 * - action: Deadlines, questions, action items
 */
export function classifySmartCategory(
  senderEmail: string,
  subject: string,
  cleanBody: string
): SmartFeedCategory {
  const combined = `${senderEmail} ${subject} ${cleanBody}`.toLowerCase();

  // 1. Receipts / Finance (use word boundaries so 'чек' does not match 'чекни')
  const receiptWords = [
    'чек', 'электронный чек', 'квитанция', 'оплата', 'счет на оплату',
    'инвойс', 'подписка', 'банк', 'receipt', 'invoice', 'payment confirmed',
    'billing', 'order confirmation', 'yandex cloud', 'т-банк', 'сбер'
  ];
  for (const word of receiptWords) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Zа-яА-ЯёЁ0-9])${escaped}(?:$|[^a-zA-Zа-яА-ЯёЁ0-9])`, 'i');
    if (regex.test(combined)) {
      return 'receipt';
    }
  }

  // 2. Services / Notifications / Bots
  const serviceSenders = [
    'no-reply', 'noreply', 'notifications@', 'alert', 'bot@',
    'github.com', 'figma.com', 'notion.so', 'jira', 'sentry.io',
    'telegram.org', 'slack.com', 'atlassian.net', 'gitlab.com'
  ];
  if (serviceSenders.some(s => senderEmail.toLowerCase().includes(s))) {
    return 'service';
  }

  // 3. Action Required (questions, deadlines, urgent confirmations)
  const actionKeywords = [
    'дедлайн', 'deadline', 'к какому числу', 'срочно', 'прошу согласовать',
    'прошу подтвердить', 'action required', 'please review', 'urgent',
    'требуется ответ', 'жду ответа'
  ];
  const containsQuestion = cleanBody.includes('?') || subject.includes('?');
  if (actionKeywords.some(k => combined.includes(k)) || (containsQuestion && cleanBody.length < 300)) {
    return 'action';
  }

  // 4. Default: Human direct message
  return 'human';
}
