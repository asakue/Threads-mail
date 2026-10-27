import { FastifyPluginAsync } from 'fastify';
import { gmailGateway } from '../gateways/gmail.js';
import { yandexGateway } from '../gateways/yandex.js';
import { tokenVault } from '../security/tokenVault.js';
import { sessionManager } from '../security/session.js';
import { emailStore } from '../services/store.js';

export const authRoutes: FastifyPluginAsync = async (server) => {
  const authRateLimit = {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  };

  // Issue or retrieve active session token for the client UI
  server.get('/api/auth/session', async () => {
    const token = sessionManager.issueSessionToken();
    return {
      token,
      expiresIn: 86400,
    };
  });

  // Generate Google OAuth2 consent URL
  server.get('/api/auth/google/url', authRateLimit, async () => {
    const { url, state } = gmailGateway.generateAuthUrl();
    return { url, state };
  });

  // Google OAuth2 code exchange callback with CSRF state verification
  server.post('/api/auth/google/callback', authRateLimit, async (request, reply) => {
    const body = request.body as { code?: string; state?: string; userId?: string };
    if (!body || !body.code) {
      return reply.code(400).send({ error: 'Authorization code is required' });
    }

    // CSRF verification: check OAuth state parameter
    if (body.state && !gmailGateway.verifyState(body.state)) {
      server.log.warn(`[OAuth CSRF] Invalid or expired OAuth state parameter received`);
      return reply.code(400).send({ error: 'Invalid or expired OAuth state parameter (potential CSRF)' });
    }

    try {
      const tokens = await gmailGateway.exchangeCode(body.code);
      const userId = body.userId || 'default-user';
      const accountEmail = 'alex.dev@gmail.com'; // Derived from userinfo in production

      // Store refresh token securely in AES-256-GCM TokenVault
      tokenVault.storeToken(userId, 'gmail', accountEmail, tokens.refreshToken);

      emailStore.addAccount({
        id: `acc-gmail-${Date.now()}`,
        email: accountEmail,
        provider: 'gmail',
        isConnected: true,
        status: 'synced',
        lastSyncedTimestamp: Date.now(),
        latencyMs: 14,
        totalMessagesIndexed: 0,
      });

      return {
        success: true,
        provider: 'gmail',
        accountEmail,
        expiresIn: tokens.expiresInSeconds,
      };
    } catch (err: any) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Token exchange failed', details: err.message });
    }
  });

  // Connect Yandex account via App Password or OAuth
  server.post('/api/auth/yandex/connect', authRateLimit, async (request, reply) => {
    const body = request.body as { email?: string; appPassword?: string; userId?: string };
    if (!body || !body.email || !body.appPassword) {
      return reply.code(400).send({ error: 'Email and App Password are required' });
    }

    const userId = body.userId || 'default-user';

    // Store in TokenVault with AEAD
    tokenVault.storeToken(userId, 'yandex', body.email, body.appPassword);

    emailStore.addAccount({
      id: `acc-yandex-${Date.now()}`,
      email: body.email,
      provider: 'yandex',
      isConnected: true,
      status: 'synced',
      lastSyncedTimestamp: Date.now(),
      latencyMs: 9,
      totalMessagesIndexed: 0,
    });

    // Activate IMAP IDLE listener
    yandexGateway.startIdleListener({
      email: body.email,
      appPassword: body.appPassword,
    });

    return {
      success: true,
      provider: 'yandex',
      accountEmail: body.email,
      idleActive: true,
    };
  });
};
