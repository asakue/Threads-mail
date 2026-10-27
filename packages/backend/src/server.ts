import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { emailStore } from './services/store.js';
import { telemetry } from './analytics/telemetry.js';
import { realtimeHub } from './services/realtimeHub.js';
import { outboxManager } from './services/outbox.js';
import { sessionManager } from './security/session.js';
import { authRoutes } from './routes/auth.js';
import { webhookRoutes } from './routes/webhooks.js';
import { realtimeRoutes } from './routes/realtime.js';
import { syncRoutes } from './routes/sync.js';
import { outboxRoutes } from './routes/outbox.js';

export async function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // 1. Security Headers with Content-Security-Policy (CSP)
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow UI component inline styles
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:5173', 'http://127.0.0.1:5173'],
        frameAncestors: ["'none'"], // Anti-clickjacking (CWE-1021)
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  // 2. Strict CORS Allowlist (CWE-942 prevention)
  const ALLOWED_ORIGINS = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost',
    'capacitor://localhost',
  ]);

  await server.register(cors, {
    origin: (origin, cb) => {
      // Allow non-browser clients (native mobile, Electron desktop, curl, node:test)
      if (!origin) {
        return cb(null, true);
      }
      if (ALLOWED_ORIGINS.has(origin) || origin.startsWith('threads://') || origin.startsWith('app://')) {
        return cb(null, true);
      }
      cb(new Error('Blocked by CORS policy: Origin not allowed'), false);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // 3. Rate Limiting (120 req/min per IP)
  await server.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
  });

  // 4. Session Authentication Guard for protected API routes (CWE-306 prevention)
  server.addHook('preHandler', async (request, reply) => {
    const rawUrl = request.raw.url || '';
    const path = rawUrl.split('?')[0];

    // Public endpoints: health, auth, webhooks
    if (
      path === '/health' ||
      path.startsWith('/api/auth') ||
      path.startsWith('/api/webhooks')
    ) {
      return;
    }

    if (!path.startsWith('/api')) {
      return;
    }

    const token =
      (request.headers['x-threads-session-token'] as string) ||
      (request.headers['authorization']?.startsWith('Bearer ')
        ? request.headers['authorization'].slice(7)
        : undefined);

    // In test/dev environment, allow omitting token unless strict authentication check is active
    const isTestMode = process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;
    if (isTestMode && !process.env.REQUIRE_STRICT_AUTH && !token) {
      return;
    }

    if (!sessionManager.validateSessionToken(token)) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid X-Threads-Session-Token',
      });
    }
  });

  // Health check
  server.get('/health', async () => {
    return {
      status: 'ok',
      service: 'threads-backend',
      timestamp: Date.now(),
      version: '1.0.0',
    };
  });

  // 4. Register Modular Gateway & Service Routes
  await server.register(authRoutes);
  await server.register(webhookRoutes);
  await server.register(realtimeRoutes);
  await server.register(syncRoutes);
  await server.register(outboxRoutes);

  // 5. Core API Endpoints

  // Get conversations feed
  server.get('/api/conversations', async (request) => {
    const query = request.query as { category?: string; archived?: string };
    const includeArchived = query.archived === 'true';
    const conversations = emailStore.getConversations(query.category, includeArchived);
    return {
      conversations,
      totalCount: conversations.length,
    };
  });

  // Create / start new conversation (Compose)
  server.post('/api/conversations', async (request, reply) => {
    const body = request.body as {
      recipient: string;
      subject?: string;
      body: string;
      recipientName?: string;
    };
    if (!body || !body.recipient || !body.recipient.trim()) {
      return reply.code(400).send({ error: 'Recipient email is required' });
    }
    if (!body.body || !body.body.trim()) {
      return reply.code(400).send({ error: 'Message body is required' });
    }

    const start = Date.now();
    const primaryAccount = emailStore.getAccounts()[0];
    const senderEmail = primaryAccount?.email || 'user@threads.local';

    const { conversation, message } = emailStore.startNewConversation({
      recipient: body.recipient.trim(),
      recipientName: body.recipientName?.trim(),
      subject: body.subject?.trim() || 'Без темы',
      body: body.body.trim(),
      senderEmail,
    });

    outboxManager.enqueue({
      conversationId: conversation.id,
      provider: message.provider,
      from: senderEmail,
      to: [conversation.contact.primaryEmail],
      subject: conversation.subjectContext,
      textBody: message.cleanBody,
    });

    realtimeHub.broadcast('conversation_created', {
      conversation,
      message,
    });

    telemetry.track({
      eventName: 'compose_new_conversation',
      timestamp: Date.now(),
      anonymizedUserId: telemetry.anonymizeIdentity(senderEmail),
      durationMs: Date.now() - start,
    });

    return {
      success: true,
      conversation,
      message,
    };
  });

  // Get conversation by ID
  server.get('/api/conversations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const conversation = emailStore.getConversationById(id);
    if (!conversation) {
      return reply.code(404).send({ error: 'Conversation not found' });
    }
    return { conversation };
  });

  // Get messages for a conversation
  server.get('/api/conversations/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string };
    const conversation = emailStore.getConversationById(id);
    if (!conversation) {
      return reply.code(404).send({ error: 'Conversation not found' });
    }
    const messages = emailStore.getMessagesForConversation(id);
    return {
      conversation,
      messages,
      totalCount: messages.length,
    };
  });

  // Send message in conversation (Composer)
  server.post('/api/conversations/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { text: string };
    if (!body || !body.text || !body.text.trim()) {
      return reply.code(400).send({ error: 'Message text is required' });
    }

    const start = Date.now();
    const primaryAccount = emailStore.getAccounts()[0];
    const senderEmail = primaryAccount?.email || 'user@threads.local';

    const newMsg = emailStore.addMessage(id, body.text.trim(), true, senderEmail);
    if (!newMsg) {
      return reply.code(404).send({ error: 'Conversation not found' });
    }

    const conv = emailStore.getConversationById(id);

    // Enqueue message into Outbox pattern queue for delivery
    outboxManager.enqueue({
      conversationId: id,
      provider: newMsg.provider,
      from: senderEmail,
      to: [conv?.contact.primaryEmail || 'unknown@domain.com'],
      subject: conv?.subjectContext || 'Без темы',
      textBody: newMsg.cleanBody,
    });

    // Broadcast live event to clients
    realtimeHub.broadcast('message_sent', {
      conversationId: id,
      message: newMsg,
    });

    // Telemetry tracking
    telemetry.track({
      eventName: 'compose_send',
      timestamp: Date.now(),
      anonymizedUserId: telemetry.anonymizeIdentity(senderEmail),
      durationMs: Date.now() - start,
    });

    return {
      success: true,
      message: newMsg,
    };
  });

  // Action: Toggle archive
  server.post('/api/conversations/:id/archive', async (request, reply) => {
    const { id } = request.params as { id: string };
    const start = Date.now();
    const isArchived = emailStore.toggleArchive(id);

    realtimeHub.broadcast('conversation_archived', {
      conversationId: id,
      isArchived,
    });

    telemetry.track({
      eventName: 'chat_swipe_action',
      timestamp: Date.now(),
      anonymizedUserId: telemetry.anonymizeIdentity('alex.dev@gmail.com'),
      durationMs: Date.now() - start,
      metadata: { action: isArchived ? 'archive' : 'unarchive' },
    });

    return {
      success: true,
      conversationId: id,
      isArchived,
    };
  });

  // Action: Mark as read
  server.post('/api/conversations/:id/read', async (request) => {
    const { id } = request.params as { id: string };
    const start = Date.now();
    emailStore.markAsRead(id);

    realtimeHub.broadcast('conversation_read', {
      conversationId: id,
      unreadCount: 0,
    });

    telemetry.track({
      eventName: 'chat_swipe_action',
      timestamp: Date.now(),
      anonymizedUserId: telemetry.anonymizeIdentity('alex.dev@gmail.com'),
      durationMs: Date.now() - start,
      metadata: { action: 'read' },
    });

    return {
      success: true,
      conversationId: id,
      unreadCount: 0,
    };
  });

  // Get Contact dossier & attachments
  server.get('/api/contacts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const contact = emailStore.getContactById(id);
    if (!contact) {
      return reply.code(404).send({ error: 'Contact not found' });
    }

    const allConvs = emailStore.getConversations('all', true).filter((c) => c.contactId === id);
    const sharedAttachments: any[] = [];
    allConvs.forEach((c) => {
      const msgs = emailStore.getMessagesForConversation(c.id);
      msgs.forEach((m) => {
        if (m.attachments && m.attachments.length > 0) {
          sharedAttachments.push(...m.attachments);
        }
      });
    });

    return {
      contact,
      sharedAttachments,
      totalConversations: allConvs.length,
    };
  });

  // Connected mail accounts status
  server.get('/api/accounts', async () => {
    const accounts = emailStore.getAccounts();
    return {
      accounts,
      allSynced: accounts.every((a) => a.status === 'synced'),
    };
  });

  // Connect new mail account
  server.post('/api/accounts', async (request, reply) => {
    const body = request.body as {
      email: string;
      provider?: 'gmail' | 'yandex' | 'imap';
    };
    if (!body || !body.email || !body.email.includes('@')) {
      return reply.code(400).send({ error: 'Valid email address is required' });
    }

    const email = body.email.trim().toLowerCase();
    const provider = body.provider || (email.includes('yandex') ? 'yandex' : 'gmail');
    const newAccount = {
      id: `acc-${Date.now()}`,
      email,
      provider,
      isConnected: true,
      status: 'synced' as const,
      lastSyncedTimestamp: Date.now(),
      latencyMs: 12,
      totalMessagesIndexed: 0,
    };

    emailStore.addAccount(newAccount);

    realtimeHub.broadcast('account_connected', { account: newAccount });

    return {
      success: true,
      account: newAccount,
    };
  });

  // Disconnect mail account
  server.delete('/api/accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = emailStore.removeAccount(id);
    if (!deleted) {
      return reply.code(404).send({ error: 'Account not found' });
    }
    return { success: true, id };
  });

  // Categories summary counts
  server.get('/api/categories', async () => {
    const all = emailStore.getConversations('all', false);
    const counts = {
      all: all.length,
      human: all.filter((c) => c.category === 'human').length,
      service: all.filter((c) => c.category === 'service').length,
      receipt: all.filter((c) => c.category === 'receipt').length,
      action: all.filter((c) => c.category === 'action').length,
    };
    return { counts };
  });

  // Telemetry stats
  server.get('/api/telemetry/stats', async () => {
    return {
      telemetry: telemetry.getSummary(),
    };
  });

  // Ingest client telemetry event
  server.post('/api/telemetry/event', async (request) => {
    const event = request.body as any;
    if (event && event.eventName) {
      telemetry.track({
        eventName: event.eventName,
        timestamp: event.timestamp || Date.now(),
        anonymizedUserId: telemetry.anonymizeIdentity(event.userId || 'anonymous'),
        durationMs: event.durationMs,
        metadata: event.metadata,
      });
    }
    return { recorded: true };
  });

  return server;
}

export async function startServer() {
  const port = Number(process.env.PORT) || 3001;
  const server = await buildServer();
  try {
    const address = await server.listen({ port, host: '0.0.0.0' });
    console.log(`[Threads Backend] Server listening at ${address}`);
    return server;
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('dist/server.js');
if (isDirectRun) {
  startServer();
}
