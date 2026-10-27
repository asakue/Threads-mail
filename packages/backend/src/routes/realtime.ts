import { FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';
import { realtimeHub } from '../services/realtimeHub.js';

export const realtimeRoutes: FastifyPluginAsync = async (server) => {
  // Server-Sent Events stream for mobile & desktop clients
  server.get('/api/realtime/stream', async (request, reply) => {
    const rawClientId = (request.query as { clientId?: string })?.clientId;
    const clientId = (rawClientId && /^[a-zA-Z0-9_-]{1,64}$/.test(rawClientId))
      ? rawClientId
      : `client_${crypto.randomBytes(6).toString('hex')}`;

    const registered = realtimeHub.registerClient(clientId, reply);
    if (!registered) {
      return;
    }

    // Resolve promise on socket close to prevent unresolved Promise leaks in V8 heap
    return new Promise<void>((resolve) => {
      request.raw.once('close', () => {
        resolve();
      });
    });
  });
};
