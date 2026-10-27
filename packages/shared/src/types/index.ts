export type ProviderType = 'gmail' | 'yandex' | 'imap';

export type SmartFeedCategory = 'human' | 'service' | 'receipt' | 'action';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export type AttachmentCategory = 'pdf' | 'archive' | 'document' | 'image' | 'audio' | 'other';

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  thumbnailUrl?: string;
  isInline: boolean;
  category: AttachmentCategory;
}

export interface Contact {
  id: string;
  displayName: string;
  avatarUrl?: string;
  primaryEmail: string;
  linkedEmails: {
    email: string;
    label: string; // e.g. "Work (Google Workspace)" or "Personal (Yandex)"
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

export interface CleanedContent {
  cleanBody: string;
  isolatedGreeting?: string;
  collapsedQuote?: string;
  signature?: string;
  hasCollapsibleContent: boolean;
  originalLength: number;
  cleanedLength: number;
  cleanedRatio: number;
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
  status: MessageStatus;
  
  // Cleaned presentation fields
  cleanBody: string;
  greeting?: string;
  collapsedQuote?: string;
  signature?: string;
  rawBody?: string;

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

export interface PrivacyPreferences {
  stripCorporateFooters: boolean;
  collapseQuotes: boolean;
  blockTrackingPixels: boolean;
  zeroKnowledgeServerCache: boolean;
  unifiedCrossSubjectThreads: boolean;
}

export interface TelemetryEvent {
  eventName: string;
  timestamp: number;
  anonymizedUserId: string; // HMAC-SHA256
  durationMs?: number;
  metadata?: Record<string, string | number | boolean>;
}
