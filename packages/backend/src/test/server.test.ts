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

  // 2. Connect account
  const resAcc = await app.inject({
    method: 'POST',
    url: '/api/accounts',
    payload: { email: 'developer@mycorp.com', provider: 'gmail' },
  });
  assert.strictEqual(resAcc.statusCode, 200);
  const accJson = JSON.parse(resAcc.body);
  assert.strictEqual(accJson.success, true);
  assert.strictEqual(accJson.account.email, 'developer@mycorp.com');

  // 3. Create a new conversation via Compose
  const resCreateConv = await app.inject({
    method: 'POST',
    url: '/api/conversations',
    payload: {
      recipient: 'colleague@partner.com',
      recipientName: 'Партнер',
      subject: 'Сотрудничество по API',
      body: 'Приветствую! Высылаю документацию по интеграции.',
    },
  });
  assert.strictEqual(resCreateConv.statusCode, 200);
  const createJson = JSON.parse(resCreateConv.body);
  assert.strictEqual(createJson.success, true);
  assert.ok(createJson.conversation.id);
  const convId = createJson.conversation.id;
  const contactId = createJson.conversation.contactId;

  // 4. Retrieve conversations list
  const resConvs = await app.inject({ method: 'GET', url: '/api/conversations' });
  assert.strictEqual(resConvs.statusCode, 200);
  const convsJson = JSON.parse(resConvs.body);
  assert.strictEqual(convsJson.conversations.length, 1);
  assert.strictEqual(convsJson.conversations[0].id, convId);

  // 5. Send a reply in conversation
  const resSend = await app.inject({
    method: 'POST',
    url: `/api/conversations/${convId}/messages`,
    payload: { text: 'Уточняю: доступ открыт в тестовом контуре.' },
  });
  assert.strictEqual(resSend.statusCode, 200);
  const sendJson = JSON.parse(resSend.body);
  assert.strictEqual(sendJson.success, true);
  assert.strictEqual(sendJson.message.cleanBody, 'Уточняю: доступ открыт в тестовом контуре.');

  // 6. Messages list
  const resMsgs = await app.inject({ method: 'GET', url: `/api/conversations/${convId}/messages` });
  assert.strictEqual(resMsgs.statusCode, 200);
  const msgsJson = JSON.parse(resMsgs.body);
  assert.strictEqual(msgsJson.messages.length, 2);

  // 7. Swipe archive action
  const resArchive = await app.inject({
    method: 'POST',
    url: `/api/conversations/${convId}/archive`,
  });
  assert.strictEqual(resArchive.statusCode, 200);
  const archiveJson = JSON.parse(resArchive.body);
  assert.strictEqual(archiveJson.isArchived, true);

  // 8. Contact dossier
  const resContact = await app.inject({ method: 'GET', url: `/api/contacts/${contactId}` });
  assert.strictEqual(resContact.statusCode, 200);
  const contactJson = JSON.parse(resContact.body);
  assert.strictEqual(contactJson.contact.primaryEmail, 'colleague@partner.com');

  // 9. Telemetry stats
  const resStats = await app.inject({ method: 'GET', url: '/api/telemetry/stats' });
  assert.strictEqual(resStats.statusCode, 200);
  const statsJson = JSON.parse(resStats.body);
  assert.ok(statsJson.telemetry.totalEventsLogged > 0);

  await app.close();
});
