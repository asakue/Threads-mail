import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';
import { declutterEmailContent, Message, classifySmartCategory } from '@vibery/shared';
import { sanitizeHeader } from '../security/sanitizer.js';

export interface YandexAccountConfig {
  email: string;
  appPassword?: string;
  oauthToken?: string;
}

export interface RawImapEmail {
  uid: number;
  messageId: string;
  from: { name: string; email: string };
  to: string[];
  subject: string;
  textBody: string;
  date: Date;
  flags: string[];
}

/**
 * YandexGateway manages IMAP IDLE real-time event listeners and SMTP mail dispatch
 * for Yandex.Mail accounts.
 */
export class YandexGateway extends EventEmitter {
  private activeIdleConnections: Map<string, { isAlive: boolean; lastKeepAlive: number }> = new Map();

  constructor() {
    super();
  }

  /**
   * Registers an IMAP IDLE connection for an account.
   * In production, connects via TLS socket to imap.yandex.ru:993 and issues the IDLE command.
   */
  public startIdleListener(config: YandexAccountConfig): void {
    const key = config.email.toLowerCase();
    if (this.activeIdleConnections.has(key)) {
      return;
    }

    this.activeIdleConnections.set(key, {
      isAlive: true,
      lastKeepAlive: Date.now(),
    });

    console.log(`[YandexGateway] IMAP IDLE listener activated for ${config.email}`);
  }

  /**
   * Stops an active IMAP IDLE connection
   */
  public stopIdleListener(email: string): void {
    const key = email.toLowerCase();
    this.activeIdleConnections.delete(key);
    console.log(`[YandexGateway] IMAP IDLE listener stopped for ${email}`);
  }

  /**
   * Ingests an incoming raw email received from IMAP
   */
  public processIncomingImapEmail(email: RawImapEmail, conversationId: string): Message {
    const cleanResult = declutterEmailContent(email.textBody);
    const category = classifySmartCategory(email.from.email, email.subject, cleanResult.cleanBody);

    const message: Message = {
      id: `msg-ya-${email.uid}`,
      conversationId,
      providerMessageId: email.messageId || `<${email.uid}@yandex.ru>`,
      provider: 'yandex',
      sender: email.from,
      recipients: email.to,
      subject: email.subject,
      timestamp: email.date.getTime(),
      isOutgoing: false,
      status: email.flags.includes('\\Seen') ? 'read' : 'delivered',
      cleanBody: cleanResult.cleanBody,
      greeting: cleanResult.isolatedGreeting,
      signature: cleanResult.signature,
      collapsedQuote: cleanResult.collapsedQuote,
      attachments: [],
    };

    // Emit real-time event for sync workers
    this.emit('new_message', { account: email.to[0], message });
    return message;
  }

  /**
   * Formats and prepares an RFC-822 message string ready for Yandex SMTP (smtp.yandex.ru:465)
   */
  public formatSmtpMessage(params: {
    from: string;
    to: string;
    subject: string;
    body: string;
    inReplyTo?: string;
    references?: string;
  }): { messageId: string; rawContent: string } {
    const cleanFrom = sanitizeHeader(params.from);
    const cleanTo = sanitizeHeader(params.to);
    const cleanSubject = sanitizeHeader(params.subject);
    const cleanInReplyTo = params.inReplyTo ? sanitizeHeader(params.inReplyTo) : undefined;
    const cleanReferences = params.references ? sanitizeHeader(params.references) : undefined;

    const messageId = `<${Date.now()}.${crypto.randomBytes(6).toString('hex')}@threads.local>`;
    const lines = [
      `From: ${cleanFrom}`,
      `To: ${cleanTo}`,
      `Subject: =?UTF-8?B?${Buffer.from(cleanSubject).toString('base64')}?=`,
      `Message-ID: ${messageId}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8; format=flowed`,
      `Content-Transfer-Encoding: 8bit`,
    ];

    if (cleanInReplyTo) {
      lines.push(`In-Reply-To: ${cleanInReplyTo}`);
    }
    if (cleanReferences) {
      lines.push(`References: ${cleanReferences}`);
    }

    lines.push('', params.body);

    return {
      messageId,
      rawContent: lines.join('\r\n'),
    };
  }

  /**
   * Returns list of currently active IDLE listeners
   */
  public getActiveListenerAccounts(): string[] {
    return Array.from(this.activeIdleConnections.keys());
  }
}

export const yandexGateway = new YandexGateway();
