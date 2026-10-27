import test from 'node:test';
import assert from 'node:assert';
import { declutterEmailContent, classifySmartCategory, htmlToCleanText } from './cleaner.js';

test('htmlToCleanText strips tags, tracking pixels, and decodes entities', () => {
  const html = `
    <div>
      <img src="https://tracker.com/pixel.gif" width="1" height="1" />
      <p>Привет! Вот &laquo;документ&raquo; &amp; детали.</p>
      <br/>
      <script>alert('xss');</script>
    </div>
  `;
  const clean = htmlToCleanText(html);
  assert.ok(!clean.includes('pixel.gif'), 'Tracking pixel should be removed');
  assert.ok(!clean.includes('alert'), 'Scripts should be removed');
  assert.ok(clean.includes('Привет! Вот'), 'Text should be preserved');
  assert.ok(clean.includes('&'), 'Entities should be decoded');
});

test('declutterEmailContent strips greeting, quote, and signature', () => {
  const rawEmail = `
Добрый день, уважаемые коллеги!

Мы финализировали схему синхронизации для хакатона. Посмотрите прикрепленный PDF со слайдами.

С уважением,
Алёна Романова
Lead Product Designer, DesignLab
Тел: +7 (999) 000-00-00

On Mon, Oct 26, 2026 at 10:15 AM Дмитрий wrote:
> Привет! Когда будут готовы финальные слайды?
> Ждем схему для бэкенда.
  `;

  const result = declutterEmailContent(rawEmail);

  // Body should contain the meat of the message
  assert.ok(result.cleanBody.includes('Мы финализировали схему синхронизации для хакатона'));
  // Corporate greeting isolated
  assert.ok(result.isolatedGreeting?.includes('Добрый день'));
  assert.ok(!result.cleanBody.includes('Добрый день'));
  // Quote collapsed
  assert.ok(result.collapsedQuote?.includes('On Mon, Oct 26, 2026'));
  assert.ok(!result.cleanBody.includes('On Mon, Oct 26, 2026'));
  // Signature stripped
  assert.ok(result.signature?.includes('С уважением'));
  assert.ok(!result.cleanBody.includes('С уважением'));
  // Metrics calculated
  assert.ok(result.cleanedRatio > 0.4, 'Should clean at least 40% of corporate noise');
});

test('classifySmartCategory accurately segments categories', () => {
  // Receipt
  const cat1 = classifySmartCategory('billing@cloud.yandex.ru', 'Электронный чек по операции #9821', 'Оплата подписки облачных серверов');
  assert.strictEqual(cat1, 'receipt');

  // Service
  const cat2 = classifySmartCategory('notifications@github.com', '[vibery] CI/CD Pipeline succeeded', 'Build #140 deployed to staging');
  assert.strictEqual(cat2, 'service');

  // Action
  const cat3 = classifySmartCategory('mikhail@startup.io', 'Срочно: дедлайн по контракту', 'К какому числу сможем согласовать правки?');
  assert.strictEqual(cat3, 'action');

  // Human
  const cat4 = classifySmartCategory('alyona@designlab.io', 'Презентация на завтра', 'Я подготовила слайды архитектуры, чекни вложения.');
  assert.strictEqual(cat4, 'human');
});
