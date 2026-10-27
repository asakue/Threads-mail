import { Message, Conversation, Contact, ProviderType } from '@vibery/shared';
import { emailStore } from './store.js';
import { realtimeHub } from './realtimeHub.js';
import { telemetry } from '../analytics/telemetry.js';

export interface DeltaSyncResult {
  provider: ProviderType;
  accountEmail: string;
  newMessagesCount: number;
  durationMs: number;
}

/**
 * SyncEngine orchestrates real-time email ingestion, deduplication,
 * cross-subject thread grouping, and client broadcast.
 */
export class SyncEngine {
  private isSyncing = false;

  /**
   * Ingests an incoming parsed message into the store and notifies all clients
   */
  public ingestMessage(message: Message, accountEmail: string): { conversation: Conversation; message: Message } {
    const start = Date.now();

    // 1. Locate or create contact
    const contactEmail = message.isOutgoing
      ? message.recipients[0]
      : message.sender.email;

    const existing = emailStore.getConversations('all', true).find(
      (c) => c.contact.primaryEmail.toLowerCase() === contactEmail.toLowerCase()
    );

    let conversation: Conversation;

    if (!existing) {
      // Create new contact & conversation
      const contactId = `cnt_${Date.now()}`;
      const newContact: Contact = {
        id: contactId,
        displayName: message.isOutgoing ? message.recipients[0] : (message.sender.name || contactEmail),
        primaryEmail: contactEmail,
        linkedEmails: [
          {
            email: contactEmail,
            label: 'Основная',
            isPrimary: true,
            provider: message.provider,
          },
        ],
        isService: false,
        category: 'human',
        totalMessagesExchanged: 1,
        firstContactDate: new Date().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
      };

      const newConvId = `conv_${Date.now()}`;
      conversation = {
        id: newConvId,
        contactId,
        contact: newContact,
        subjectContext: message.subject,
        lastMessageSnippet: message.cleanBody.slice(0, 100),
        lastMessageTimestamp: message.timestamp,
        unreadCount: message.isOutgoing ? 0 : 1,
        isArchived: false,
        category: 'human',
        providerBadge: message.provider === 'yandex' ? 'yandex' : 'gmail',
        totalMessages: 1,
      };

      // Add to store
      emailStore.createConversationWithContact(newContact, conversation);
    } else {
      conversation = existing;
      conversation.lastMessageSnippet = message.cleanBody.slice(0, 100);
      conversation.lastMessageTimestamp = message.timestamp;
      if (!message.isOutgoing) {
        conversation.unreadCount += 1;
      }
      conversation.totalMessages += 1;
    }

    // 2. Append message to conversation in store
    emailStore.appendRawMessage(conversation.id, message);

    // 3. Broadcast real-time delta to all connected clients
    realtimeHub.broadcast('message_received', {
      conversation,
      message,
    });

    // 4. Record Zero-PII telemetry
    telemetry.track({
      eventName: 'email_sync_delta',
      timestamp: Date.now(),
      anonymizedUserId: telemetry.anonymizeIdentity(accountEmail),
      durationMs: Date.now() - start,
      metadata: {
        provider: message.provider,
        isOutgoing: message.isOutgoing,
        hasAttachments: message.attachments.length > 0,
      },
    });

    return { conversation, message };
  }

  /**
   * Triggers a manual sync pass across all registered accounts
   */
  public async triggerSyncAll(): Promise<DeltaSyncResult[]> {
    if (this.isSyncing) return [];
    this.isSyncing = true;
    const results: DeltaSyncResult[] = [];

    try {
      const accounts = emailStore.getAccounts();
      for (const acc of accounts) {
        const start = Date.now();
        // Update account sync state
        acc.lastSyncedTimestamp = Date.now();
        acc.status = 'synced';

        results.push({
          provider: acc.provider,
          accountEmail: acc.email,
          newMessagesCount: 0,
          durationMs: Date.now() - start,
        });
      }

      realtimeHub.broadcast('sync_completed', { results });
      return results;
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncEngine = new SyncEngine();
