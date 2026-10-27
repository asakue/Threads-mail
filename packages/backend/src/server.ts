import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { emailStore } from './services/store.js';
import { telemetry } from './analytics/telemetry.js';

export async function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // 1. Security Headers
  await server.register(helmet, {
    contentSecurityPolicy: false, // Allows flexible UI dev while enforcing anti-clickjacking
    crossOriginEmbedderPolicy: false,
  });

  // 2. CORS
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // 3. Rate Limiting (100 req/min per IP)
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Health check
  server.get('/health', async () => {
    return {
      status: 'ok',
      service: 'vibery-backend',
      timestamp: Date.now(),
      version: '1.0.0',
    };
  });

  // 4. API Endpoints

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
    const newMsg = emailStore.addMessage(id, body.text.trim(), true);
    if (!newMsg) {
      return reply.code(404).send({ error: 'Conversation not found' });
    }

    // Telemetry tracking
    telemetry.track({
      eventName: 'compose_send',
      timestamp: Date.now(),
      anonymizedUserId: telemetry.anonymizeIdentity('team.vibery@gmail.com'),
      durationMs: Date.now() - start,
    });

    return {
      success: true,
      message: newMsg,
    };
  });

  // Swipe Action: Toggle archive
  server.post('/api/conversations/:id/archive', async (request, reply) => {
    const { id } = request.params as { id: string };
    const start = Date.now();
    const isArchived = emailStore.toggleArchive(id);

    telemetry.track({
      eventName: 'chat_swipe_action',
      timestamp: Date.now(),
      anonymizedUserId: telemetry.anonymizeIdentity('team.vibery@gmail.com'),
      durationMs: Date.now() - start,
      metadata: { action: isArchived ? 'archive' : 'unarchive' },
    });

    return {
      success: true,
      conversationId: id,
      isArchived,
    };
  });

  // Swipe Action: Mark as read
  server.post('/api/conversations/:id/read', async (request) => {
    const { id } = request.params as { id: string };
    const start = Date.now();
    emailStore.markAsRead(id);

    telemetry.track({
      eventName: 'chat_swipe_action',
      timestamp: Date.now(),
      anonymizedUserId: telemetry.anonymizeIdentity('team.vibery@gmail.com'),
      durationMs: Date.now() - start,
      metadata: { action: 'read' },
    });

    return {
      success: true,
      conversationId: id,
      unreadCount: 0,
    };
  });

  // Get Contact dossier
  server.get('/api/contacts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const contact = emailStore.getContactById(id);
    if (!contact) {
      return reply.code(404).send({ error: 'Contact not found' });
    }

    // Aggregate shared attachments across all conversations for this contact
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

  // Connected mail accounts status (Gmail, Yandex)
  server.get('/api/accounts', async () => {
    const accounts = emailStore.getAccounts();
    return {
      accounts,
      allSynced: accounts.every((a) => a.status === 'synced'),
    };
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
    console.log(`[Vibery Backend] Server listening at ${address}`);
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
