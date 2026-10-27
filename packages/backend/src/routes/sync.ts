import { FastifyPluginAsync } from 'fastify';
import { syncEngine } from '../services/syncEngine.js';
import { emailStore } from '../services/store.js';

export const syncRoutes: FastifyPluginAsync = async (server) => {
  // Trigger manual delta synchronization across all connected accounts
  server.post('/api/sync/trigger', async () => {
    const results = await syncEngine.triggerSyncAll();
    return {
      success: true,
      results,
    };
  });

  // Get current sync status of connected accounts
  server.get('/api/sync/status', async () => {
    const accounts = emailStore.getAccounts();
    return {
      accounts,
      syncedAt: Date.now(),
    };
  });
};
