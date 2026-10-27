import { FastifyPluginAsync } from 'fastify';
import { outboxManager } from '../services/outbox.js';

export const outboxRoutes: FastifyPluginAsync = async (server) => {
  // Get all tasks in outbox queue
  server.get('/api/outbox/queue', async (request) => {
    const status = (request.query as any)?.status;
    const tasks = outboxManager.listTasks(status);
    return {
      tasks,
      totalCount: tasks.length,
    };
  });
};
