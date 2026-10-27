import test from 'node:test';
import assert from 'node:assert';
import {
  sanitizeHeader,
  sanitizeFilename,
  sanitizeUrl,
  scrubPiiMetadata,
} from '../security/sanitizer.js';
import { tokenVault } from '../security/tokenVault.js';
import { sessionManager } from '../security/session.js';
import { telemetry } from '../analytics/telemetry.js';
import { htmlToCleanText } from '@vibery/shared';
import { buildServer } from '../server.js';

test('CRLF Injection Sanitizer strips CRLF, null bytes, and control characters (CWE-93)', () => {
  const maliciousHeader = 'alice@example.com\r\nBcc: victim@target.com\nSubject: Injected';
  const clean = sanitizeHeader(maliciousHeader);
  
  assert.strictEqual(clean.includes('\r'), false, 'Must not contain carriage return');
  assert.strictEqual(clean.includes('\n'), false, 'Must not contain newline');
  assert.strictEqual(clean.includes('\0'), false, 'Must not contain null byte');
  assert.strictEqual(clean, 'alice@example.comBcc: victim@target.comSubject: Injected');
});

test('Path Traversal Sanitizer removes directory traversal and illegal characters (CWE-22)', () => {
  const traversal1 = '../../../etc/passwd';
  assert.strictEqual(sanitizeFilename(traversal1), 'passwd');

  const traversal2 = '..\\..\\windows\\system32\\cmd.exe';
  assert.strictEqual(sanitizeFilename(traversal2), 'cmd.exe');

  const nullByteInjection = 'invoice.pdf\0.exe';
  const cleanNull = sanitizeFilename(nullByteInjection);
  assert.strictEqual(cleanNull.includes('\0'), false);
  assert.strictEqual(cleanNull, 'invoice.pdf_.exe');

  const hidden = '.bashrc';
  assert.strictEqual(sanitizeFilename(hidden), 'file_bashrc');
});

test('URL Sanitizer permits safe schemes and blocks javascript/data/vbscript (CWE-79)', () => {
  assert.strictEqual(sanitizeUrl('https://example.com/doc.pdf'), 'https://example.com/doc.pdf');
  assert.strictEqual(sanitizeUrl('http://127.0.0.1:3000'), 'http://127.0.0.1:3000/');
  assert.strictEqual(sanitizeUrl('mailto:contact@example.com'), 'mailto:contact@example.com');
  assert.strictEqual(sanitizeUrl('/relative/path/file.pdf'), '/relative/path/file.pdf');

  // Blocked dangerous protocols
  assert.strictEqual(sanitizeUrl('javascript:alert(1)'), '');
  assert.strictEqual(sanitizeUrl('JAVASCRIPT:alert(document.cookie)'), '');
  assert.strictEqual(sanitizeUrl('data:text/html,<script>alert(1)</script>'), '');
  assert.strictEqual(sanitizeUrl('vbscript:msgbox(1)'), '');
});

test('Telemetry Zero-PII Scrubber redacts emails and drops sensitive keys (CWE-359)', () => {
  const rawMetadata = {
    userEmail: 'ceo.secret@corp.ru',
    clientIp: '127.0.0.1',
    password: 'SuperSecretPassword123!',
    authToken: 'ghp_abcdef1234567890',
    subject: 'Срочный перевод средств',
    bodyText: 'Привет, переведи миллион на карту',
    safeMetric: 42,
    featureEnabled: true,
  };

  const scrubbed = scrubPiiMetadata(rawMetadata);

  // Prohibited keys must be stripped
  assert.strictEqual('password' in scrubbed, false);
  assert.strictEqual('authToken' in scrubbed, false);
  assert.strictEqual('subject' in scrubbed, false);
  assert.strictEqual('bodyText' in scrubbed, false);

  // Email pattern in allowed keys must be masked
  assert.strictEqual(String(scrubbed.userEmail).includes('ceo.secret@corp.ru'), false);
  assert.ok(String(scrubbed.userEmail).startsWith('[REDACTED_EMAIL_'));

  // Safe primitives must remain
  assert.strictEqual(scrubbed.safeMetric, 42);
  assert.strictEqual(scrubbed.featureEnabled, true);
});

test('TokenVault securely validates parameters and binds AEAD context (CWE-798)', () => {
  const userId = 'user_test_99';
  const provider = 'gmail';
  const accountEmail = 'alex.dev@gmail.com';
  const rawSecret = 'oauth-refresh-token-secret-xyz';

  // Store
  const stored = tokenVault.storeToken(userId, provider, accountEmail, rawSecret);
  assert.ok(stored.id, 'Stored credential ID should be generated');

  // Retrieve
  const retrieved = tokenVault.retrieveToken(stored.id);
  assert.strictEqual(retrieved, rawSecret);

  // Unknown ID returns null
  assert.strictEqual(tokenVault.retrieveToken('unknown_id_123'), null);

  // Input validation
  assert.throws(() => {
    tokenVault.storeToken('', provider, accountEmail, rawSecret);
  }, /Invalid userId/);
});

test('SessionManager generates unguessable tokens and verifies expiration', () => {
  const token = sessionManager.issueSessionToken();
  assert.strictEqual(token.length, 64, 'Token must be 32 bytes hex');
  assert.strictEqual(sessionManager.validateSessionToken(token), true);

  assert.strictEqual(sessionManager.validateSessionToken('invalid-token-abc'), false);
  assert.strictEqual(sessionManager.validateSessionToken(null), false);

  sessionManager.revokeSessionToken(token);
  assert.strictEqual(sessionManager.validateSessionToken(token), false);
});

test('htmlToCleanText neutralizes SVG onload and XSS injections (CWE-79)', () => {
  const xssInput1 = '<p>Привет!</p><svg onload="alert(document.domain)"><circle r="10"/></svg>';
  const clean1 = htmlToCleanText(xssInput1);
  assert.strictEqual(clean1.includes('onload'), false);
  assert.strictEqual(clean1.includes('<svg'), false);
  assert.strictEqual(clean1.includes('alert'), false);
  assert.strictEqual(clean1.trim(), 'Привет!');

  const xssInput2 = '<img src=x onerror=alert(1)>Текст сообщения';
  const clean2 = htmlToCleanText(xssInput2);
  assert.strictEqual(clean2.includes('onerror'), false);
  assert.strictEqual(clean2.includes('<img'), false);
  assert.strictEqual(clean2.includes('alert'), false);
  assert.strictEqual(clean2.trim(), 'Текст сообщения');

  const xssInput3 = '<script>alert("hacked")</script>Проверка';
  const clean3 = htmlToCleanText(xssInput3);
  assert.strictEqual(clean3.includes('<script>'), false);
  assert.strictEqual(clean3.includes('hacked'), false);
  assert.strictEqual(clean3.trim(), 'Проверка');
});

test('Server security boundaries: webhook secret enforcement and CORS', async () => {
  process.env.THREADS_WEBHOOK_SECRET = 'super-secret-pubsub-token';
  process.env.REQUIRE_STRICT_AUTH = 'true';
  const app = await buildServer();

  // 1. Webhook without secret should be rejected with 401
  const resUnauth = await app.inject({
    method: 'POST',
    url: '/api/webhooks/gmail',
    payload: { message: { data: Buffer.from('test').toString('base64'), messageId: '123' } },
  });
  assert.strictEqual(resUnauth.statusCode, 401, 'Unauthorized webhook must return 401');

  // 2. Webhook with correct secret header should proceed to body check
  const resAuth = await app.inject({
    method: 'POST',
    url: '/api/webhooks/gmail',
    headers: {
      'x-webhook-secret': 'super-secret-pubsub-token',
    },
    payload: {
      message: {
        data: Buffer.from(JSON.stringify({ emailAddress: 'user@gmail.com', historyId: '1001' })).toString('base64'),
        messageId: '123',
      },
    },
  });
  assert.strictEqual(resAuth.statusCode, 200);

  // 3. CORS check: untrusted origin rejection
  const resCorsBlocked = await app.inject({
    method: 'GET',
    url: '/api/conversations',
    headers: {
      origin: 'http://malicious-attacker.com',
    },
  });
  assert.strictEqual(resCorsBlocked.statusCode, 500, 'Untrusted origin should be blocked by CORS');

  // 4. Session token issuance (public auth route)
  const resSession = await app.inject({
    method: 'GET',
    url: '/api/auth/session',
  });
  assert.strictEqual(resSession.statusCode, 200);
  const sessionJson = JSON.parse(resSession.body);
  assert.ok(sessionJson.token, 'Should return active session token');

  // 5. Protected route WITHOUT session token must return 401
  const resNoSession = await app.inject({
    method: 'GET',
    url: '/api/conversations',
  });
  assert.strictEqual(resNoSession.statusCode, 401, 'Protected route without session token must be rejected');

  // 6. Protected route WITH valid session token returns 200
  const resProtected = await app.inject({
    method: 'GET',
    url: '/api/conversations',
    headers: {
      'x-threads-session-token': sessionJson.token,
    },
  });
  assert.strictEqual(resProtected.statusCode, 200);

  // Clean up env
  delete process.env.THREADS_WEBHOOK_SECRET;
  delete process.env.REQUIRE_STRICT_AUTH;
  await app.close();
});
