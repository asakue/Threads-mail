export type ProviderType = 'gmail' | 'yandex' | 'imap';

export type SmartFeedCategory = 'human' | 'service' | 'receipt' | 'action';

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  thumbnailUrl?: string;
  isInline: boolean;
  category: 'pdf' | 'archive' | 'document' | 'image' | 'other';
}

export interface Contact {
  id: string;
  displayName: string;
  avatarUrl?: string;
  primaryEmail: string;
  linkedEmails: {
    email: string;
    label: string;
    isPrimary: boolean;
    provider: ProviderType;
  }[];
  isService: boolean;
  serviceBrandColor?: string;
  serviceIconName?: string;
  category: SmartFeedCategory;
  organization?: string;
  role?: string;
  totalMessagesExchanged: number;
  firstContactDate: string;
  avgResponseTimeMinutes?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  providerMessageId: string;
  provider: ProviderType;
  sender: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  recipients: string[];
  subject: string;
  timestamp: number;
  isOutgoing: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  cleanBody: string;
  greeting?: string;
  collapsedQuote?: string;
  signature?: string;
  attachments: Attachment[];
  quickReplies?: string[];
}

export interface Conversation {
  id: string;
  contactId: string;
  contact: Contact;
  subjectContext: string;
  lastMessageSnippet: string;
  lastMessageTimestamp: number;
  unreadCount: number;
  isArchived: boolean;
  category: SmartFeedCategory;
  providerBadge: 'gmail' | 'yandex' | 'unified';
  totalMessages: number;
}

export interface AccountSyncStatus {
  id: string;
  email: string;
  provider: ProviderType;
  isConnected: boolean;
  status: 'synced' | 'syncing' | 'error' | 'disconnected';
  lastSyncedTimestamp: number;
  latencyMs: number;
  totalMessagesIndexed: number;
}

export interface TelemetryStats {
  totalEventsLogged: number;
  syncLatency: {
    count: number;
    minMs: number;
    maxMs: number;
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
  };
  gestureActionCounts: Record<string, number>;
  averageCleanRatio: number;
  categorizationBreakdown: Record<string, number>;
}
