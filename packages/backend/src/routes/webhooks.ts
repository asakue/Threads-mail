import { FastifyPluginAsync } from 'fastify';
import { gmailGateway, GmailWebhookEvent } from '../gateways/gmail.js';
import { syncEngine } from '../services/syncEngine.js';

export const webhookRoutes: FastifyPluginAsync = async (server) => {
  // Google Cloud Pub/Sub webhook endpoint
  server.post('/api/webhooks/gmail', async (request, reply) => {
    const configuredSecret = process.env.THREADS_WEBHOOK_SECRET || process.env.GMAIL_WEBHOOK_SECRET;
    const providedSecret = (request.headers['x-webhook-secret'] as string) || (request.query as { token?: string })?.token;

    if (configuredSecret) {
      if (!providedSecret || providedSecret !== configuredSecret) {
        server.log.warn(`[Webhook] Unauthorized webhook access attempt from ${request.ip}`);
        return reply.code(401).send({ error: 'Unauthorized: invalid or missing webhook secret' });
      }
    }

    const event = request.body as GmailWebhookEvent;
    if (!event || !event.message) {
      return reply.code(400).send({ error: 'Invalid Pub/Sub event' });
    }

    try {
      const decoded = gmailGateway.parsePubSubPush(event);
      server.log.info(`[Webhook] Gmail PubSub notification received for ${decoded.emailAddress}, historyId: ${decoded.historyId}`);

      // In production, syncEngine fetches new history deltas using historyId
      // Acknowledge receipt to Google Pub/Sub with 200/204
      return reply.code(200).send({
        status: 'acknowledged',
        emailAddress: decoded.emailAddress,
        historyId: decoded.historyId,
      });
    } catch (err: any) {
      server.log.error(`[Webhook] Failed to parse PubSub event: ${err.message}`);
      // 400 will cause Google PubSub to retry with exponential backoff
      return reply.code(400).send({ error: err.message });
    }
  });
};
