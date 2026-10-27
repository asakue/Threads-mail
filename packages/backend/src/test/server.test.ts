import test from 'node:test';
import assert from 'node:assert';
import { tokenSecurity } from '../security/crypto.js';
import { buildServer } from '../server.js';

test('TokenSecurityEngine encrypts and decrypts with AEAD validation', () => {
  const secretRefreshToken = '1//04_AbCdEf1234567890-GoogleOAuthRefreshToken';
  const encrypted = tokenSecurity.encryptToken(secretRefreshToken);

  assert.ok(encrypted.ciphertext, 'Ciphertext should be present');
  assert.ok(encrypted.iv, 'IV should be present');
  assert.ok(encrypted.authTag, 'Auth tag should be present');
  assert.strictEqual(encrypted.keyVersion, 1);

  const decrypted = tokenSecurity.decryptToken(encrypted);
  assert.strictEqual(decrypted, secretRefreshToken, 'Decrypted token must match original');

  // Verify tampering fails
  const tampered = { ...encrypted, ciphertext: Buffer.from('tampered').toString('base64') };
  assert.throws(() => {
    tokenSecurity.decryptToken(tampered);
  }, /Unsupported state or unable to authenticate data|bad auth tag/i);
});

test('Fastify server endpoints function correctly', async () => {
  const app = await buildServer();

  // 1. Health
  const resHealth = await app.inject({ method: 'GET', url: '/health' });
  assert.strictEqual(resHealth.statusCode, 200);
  const healthJson = JSON.parse(resHealth.body);
  assert.strictEqual(healthJson.status, 'ok');

  // 2. Conversations
  const resConvs = await app.inject({ method: 'GET', url: '/api/conversations' });
  assert.strictEqual(resConvs.statusCode, 200);
  const convsJson = JSON.parse(resConvs.body);
  assert.ok(convsJson.conversations.length >= 5, 'Should return seeded conversations');

  // 3. Messages for Alyona
  const resMsgs = await app.inject({ method: 'GET', url: '/api/conversations/conv-alyona/messages' });
  assert.strictEqual(resMsgs.statusCode, 200);
  const msgsJson = JSON.parse(resMsgs.body);
  assert.strictEqual(msgsJson.messages.length, 3, 'Alyona conversation should have 3 messages');

  // 4. Send a message
  const resSend = await app.inject({
    method: 'POST',
    url: '/api/conversations/conv-alyona/messages',
    payload: { text: 'Добрый день! Проверил макеты, выглядит супер.' },
  });
  assert.strictEqual(resSend.statusCode, 200);
  const sendJson = JSON.parse(resSend.body);
  assert.strictEqual(sendJson.success, true);
  assert.strictEqual(sendJson.message.cleanBody, 'Проверил макеты, выглядит супер.');

  // 5. Swipe archive action
  const resArchive = await app.inject({
    method: 'POST',
    url: '/api/conversations/conv-aeroflot/archive',
  });
  assert.strictEqual(resArchive.statusCode, 200);
  const archiveJson = JSON.parse(resArchive.body);
  assert.strictEqual(archiveJson.isArchived, true);

  // 6. Contact dossier
  const resContact = await app.inject({ method: 'GET', url: '/api/contacts/cnt-alyona' });
  assert.strictEqual(resContact.statusCode, 200);
  const contactJson = JSON.parse(resContact.body);
  assert.strictEqual(contactJson.contact.displayName, 'Алёна Романова');
  assert.strictEqual(contactJson.contact.linkedEmails.length, 2, 'Should have 2 linked email aliases');
  assert.ok(contactJson.sharedAttachments.length >= 1, 'Should include shared PDF');

  // 7. Telemetry stats
  const resStats = await app.inject({ method: 'GET', url: '/api/telemetry/stats' });
  assert.strictEqual(resStats.statusCode, 200);
  const statsJson = JSON.parse(resStats.body);
  assert.ok(statsJson.telemetry.totalEventsLogged > 0);

  await app.close();
});
