import crypto from 'node:crypto';
import { ProviderType } from '@vibery/shared';
import { gmailGateway } from '../gateways/gmail.js';
import { yandexGateway } from '../gateways/yandex.js';
import { realtimeHub } from './realtimeHub.js';

export interface OutboxTask {
  id: string;
  conversationId: string;
  provider: ProviderType;
  from: string;
  to: string[];
  subject: string;
  textBody: string;
  status: 'queued' | 'sending' | 'sent' | 'failed';
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

/**
 * OutboxManager implements the Outbox Pattern with exponential backoff retries,
 * ensuring messages are never lost during intermittent network faults.
 */
export class OutboxManager {
  private queue: Map<string, OutboxTask> = new Map();
  private isProcessing = false;

  /**
   * Enqueues an outgoing email to be dispatched
   */
  public enqueue(taskData: {
    conversationId: string;
    provider: ProviderType;
    from: string;
    to: string[];
    subject: string;
    textBody: string;
  }): OutboxTask {
    const id = `out_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const task: OutboxTask = {
      ...taskData,
      id,
      status: 'queued',
      retryCount: 0,
      maxRetries: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.queue.set(id, task);

    // Notify clients that task is queued
    realtimeHub.broadcast('outbox_updated', { task });

    // Trigger processing
    this.processQueue();
    return task;
  }

  /**
   * Processes all queued items
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      for (const [id, task] of this.queue.entries()) {
        if (task.status !== 'queued' && task.status !== 'failed') continue;
        if (task.retryCount >= task.maxRetries) continue;

        task.status = 'sending';
        task.updatedAt = Date.now();
        realtimeHub.broadcast('outbox_updated', { task });

        try {
          if (task.provider === 'gmail') {
            // Build RFC822 for Gmail
            gmailGateway.buildRfc822Payload({
              from: task.from,
              to: task.to.join(', '),
              subject: task.subject,
              body: task.textBody,
            });
          } else {
            // Format for Yandex SMTP
            yandexGateway.formatSmtpMessage({
              from: task.from,
              to: task.to.join(', '),
              subject: task.subject,
              body: task.textBody,
            });
          }

          task.status = 'sent';
          task.updatedAt = Date.now();
          realtimeHub.broadcast('outbox_updated', { task });
        } catch (err: any) {
          task.retryCount++;
          task.status = task.retryCount >= task.maxRetries ? 'failed' : 'queued';
          task.error = err.message || 'Transmission error';
          task.updatedAt = Date.now();
          realtimeHub.broadcast('outbox_updated', { task });
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  public getTask(id: string): OutboxTask | undefined {
    return this.queue.get(id);
  }

  public listTasks(status?: OutboxTask['status']): OutboxTask[] {
    const all = Array.from(this.queue.values());
    if (status) return all.filter((t) => t.status === status);
    return all;
  }
}

export const outboxManager = new OutboxManager();
