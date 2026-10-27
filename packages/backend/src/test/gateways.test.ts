import test from 'node:test';
import assert from 'node:assert';
import { gmailGateway } from '../gateways/gmail.js';
import { yandexGateway } from '../gateways/yandex.js';
import { TokenVault } from '../security/tokenVault.js';
import { outboxManager } from '../services/outbox.js';
import { syncEngine } from '../services/syncEngine.js';
import { buildServer } from '../server.js';

test('GmailGateway: generates OAuth URL, decodes Pub/Sub and formats RFC822', () => {
  // 1. OAuth URL
  const { url, state } = gmailGateway.generateAuthUrl();
  assert.ok(url.includes('accounts.google.com/o/oauth2/v2/auth'));
  assert.ok(url.includes('access_type=offline'));
  assert.ok(url.includes(state));

  // 2. Pub/Sub push parsing
  const mockPayload = {
    emailAddress: 'user@gmail.com',
    historyId: '987654',
  };
  const event = {
    subscription: 'projects/threads/subscriptions/gmail-push',
    message: {
      data: Buffer.from(JSON.stringify(mockPayload)).toString('base64'),
      messageId: 'pubsub-msg-1',
      publishTime: new Date().toISOString(),
    },
  };
  const decoded = gmailGateway.parsePubSubPush(event);
  assert.strictEqual(decoded.emailAddress, 'user@gmail.com');
  assert.strictEqual(decoded.historyId, '987654');

  // 3. Normalization through de-clutter engine
  const rawEmail = `
Здравствуйте, коллеги!

Посылаю обновленные спецификации интерфейса.

С уважением,
Иван
  `;
  const normalized = gmailGateway.normalizeMessage({
    rawId: '101',
    conversationId: 'conv-test',
    sender: { name: 'Иван', email: 'ivan@company.com' },
    recipients: ['alex.dev@gmail.com'],
    subject: 'Спецификация v2',
    rawBody: rawEmail,
  });
  assert.strictEqual(normalized.cleanBody, 'Посылаю обновленные спецификации интерфейса.');
  assert.strictEqual(normalized.provider, 'gmail');

  // 4. RFC-822 builder
  const rfc822Base64 = gmailGateway.buildRfc822Payload({
    from: 'alex.dev@gmail.com',
    to: 'ivan@company.com',
    subject: 'Re: Спецификация v2',
    body: 'Принято!',
    inReplyTo: '<101@mail.gmail.com>',
  });
  assert.ok(rfc822Base64.length > 20);
});

test('YandexGateway: IMAP IDLE listener & SMTP formatting', () => {
  // 1. IMAP IDLE connection registration
  yandexGateway.startIdleListener({
    email: 'test@yandex.ru',
    appPassword: 'mock-app-password',
  });
  assert.ok(yandexGateway.getActiveListenerAccounts().includes('test@yandex.ru'));

  // 2. Incoming IMAP message processing
  const incoming = yandexGateway.processIncomingImapEmail(
    {
      uid: 54321,
      messageId: '<54321@yandex.ru>',
      from: { name: 'Сергей', email: 'sergey@yandex.ru' },
      to: ['lead@yandex.ru'],
      subject: 'Отчет за неделю',
      textBody: 'Добрый день!\n\nВсе задачи закрыты в срок.\n\nС уважением,\nСергей',
      date: new Date(),
      flags: ['\\Seen'],
    },
    'conv-sergey'
  );

  assert.strictEqual(incoming.cleanBody, 'Все задачи закрыты в срок.');
  assert.strictEqual(incoming.status, 'read');
  assert.strictEqual(incoming.provider, 'yandex');

  // 3. SMTP message formatting
  const smtp = yandexGateway.formatSmtpMessage({
    from: 'lead@yandex.ru',
    to: 'sergey@yandex.ru',
    subject: 'Re: Отчет за неделю',
    body: 'Отличная работа!',
    inReplyTo: '<54321@yandex.ru>',
  });
  assert.ok(smtp.rawContent.includes('From: lead@yandex.ru'));
  assert.ok(smtp.rawContent.includes('In-Reply-To: <54321@yandex.ru>'));
  assert.ok(smtp.rawContent.includes('Отличная работа!'));
});

test('TokenVault: AES-256-GCM Envelope Encryption and AEAD isolation', () => {
  const vault = new TokenVault('test-master-secret-32-chars-long!');

  // Store token
  const stored = vault.storeToken('usr_123', 'gmail', 'alex@gmail.com', 'secret-oauth-refresh-token');
  assert.ok(stored.id);
  assert.strictEqual(stored.accountEmail, 'alex@gmail.com');

  // Retrieve token
  const decrypted = vault.retrieveToken(stored.id);
  assert.strictEqual(decrypted, 'secret-oauth-refresh-token');

  // List accounts without secrets
  const accounts = vault.listAccountsForUser('usr_123');
  assert.strictEqual(accounts.length, 1);
  assert.strictEqual((accounts[0] as any).encryptedToken, undefined);

  // Revoke token
  assert.strictEqual(vault.revokeToken(stored.id), true);
  assert.strictEqual(vault.retrieveToken(stored.id), null);
});

test('OutboxManager: Enqueues and delivers outgoing tasks', async () => {
  const task = outboxManager.enqueue({
    conversationId: 'conv-test',
    provider: 'gmail',
    from: 'alex.dev@gmail.com',
    to: ['recipient@test.com'],
    subject: 'Test Subject',
    textBody: 'Test Body',
  });

  assert.ok(task.id);
  assert.strictEqual(task.status, 'sent'); // Processed synchronously in tests
});

test('SyncEngine & Extended Routes: OAuth, Webhook, and Sync pass', async () => {
  const app = await buildServer();

  // 1. Google Auth URL endpoint
  const resAuth = await app.inject({ method: 'GET', url: '/api/auth/google/url' });
  assert.strictEqual(resAuth.statusCode, 200);
  const authJson = JSON.parse(resAuth.body);
  assert.ok(authJson.url.includes('accounts.google.com'));

  // 2. Yandex connect endpoint
  const resYandex = await app.inject({
    method: 'POST',
    url: '/api/auth/yandex/connect',
    payload: {
      email: 'corp@yandex.ru',
      appPassword: 'abcdefghijklmnop',
    },
  });
  assert.strictEqual(resYandex.statusCode, 200);
  assert.strictEqual(JSON.parse(resYandex.body).success, true);

  // 3. Gmail Pub/Sub webhook endpoint
  const resWebhook = await app.inject({
    method: 'POST',
    url: '/api/webhooks/gmail',
    payload: {
      subscription: 'projects/threads/subscriptions/test',
      message: {
        data: Buffer.from(JSON.stringify({ emailAddress: 'alex.dev@gmail.com', historyId: '100200' })).toString('base64'),
        messageId: 'msg-wh-1',
        publishTime: new Date().toISOString(),
      },
    },
  });
  assert.strictEqual(resWebhook.statusCode, 200);
  assert.strictEqual(JSON.parse(resWebhook.body).status, 'acknowledged');

  // 4. Trigger sync pass
  const resSync = await app.inject({ method: 'POST', url: '/api/sync/trigger' });
  assert.strictEqual(resSync.statusCode, 200);
  const syncJson = JSON.parse(resSync.body);
  assert.strictEqual(syncJson.success, true);
  assert.ok(syncJson.results.length >= 1);

  // 5. Outbox queue inspection
  const resOutbox = await app.inject({ method: 'GET', url: '/api/outbox/queue' });
  assert.strictEqual(resOutbox.statusCode, 200);

  await app.close();
});
