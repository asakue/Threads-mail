import { FastifyReply } from 'fastify';

export interface RealtimeClient {
  id: string;
  reply: FastifyReply;
  connectedAt: number;
}

/**
 * RealtimeHub manages persistent Server-Sent Events (SSE) connections
 * to push instantaneous message deltas and read status updates to clients.
 */
export class RealtimeHub {
  private clients: Map<string, RealtimeClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  public static readonly MAX_CONCURRENT_CLIENTS = 100;

  /**
   * Registers a new SSE client
   */
  public registerClient(id: string, reply: FastifyReply): boolean {
    if (this.clients.size >= RealtimeHub.MAX_CONCURRENT_CLIENTS) {
      reply.code(429).send({ error: 'Connection limit exceeded' });
      return false;
    }

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on Nginx/reverse proxies
    reply.raw.flushHeaders?.();

    const client: RealtimeClient = {
      id,
      reply,
      connectedAt: Date.now(),
    };

    this.clients.set(id, client);

    // Initial greeting handshake event
    this.sendEventToClient(client, 'connected', {
      clientId: id,
      serverTime: Date.now(),
    });

    const cleanup = () => {
      this.clients.delete(id);
    };

    reply.raw.once('close', cleanup);
    reply.raw.once('error', cleanup);
    return true;
  }

  /**
   * Broadcasts an event to all connected clients
   */
  public broadcast(eventName: string, data: any): void {
    const payload = JSON.stringify(data);
    const message = `event: ${eventName}\ndata: ${payload}\n\n`;

    for (const [id, client] of this.clients.entries()) {
      try {
        client.reply.raw.write(message);
      } catch (err) {
        console.warn(`[RealtimeHub] Failed to write to client ${id}, removing`, err);
        this.clients.delete(id);
      }
    }
  }

  /**
   * Sends an event to a single client
   */
  private sendEventToClient(client: RealtimeClient, eventName: string, data: any): void {
    try {
      const payload = JSON.stringify(data);
      client.reply.raw.write(`event: ${eventName}\ndata: ${payload}\n\n`);
    } catch (err) {
      this.clients.delete(client.id);
    }
  }

  /**
   * Sends periodic keep-alive pings to keep connections open through proxies
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [id, client] of this.clients.entries()) {
        try {
          client.reply.raw.write(`: keep-alive ${Date.now()}\n\n`);
        } catch {
          this.clients.delete(id);
        }
      }
    }, 25000);
    this.heartbeatInterval.unref();
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }

  public stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const realtimeHub = new RealtimeHub();
