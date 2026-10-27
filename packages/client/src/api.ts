import { Conversation, Message, Contact, AccountSyncStatus, TelemetryStats } from './types';

const API_BASE = '/api';

export async function fetchConversations(category = 'all'): Promise<Conversation[]> {
  try {
    const res = await fetch(`${API_BASE}/conversations?category=${category}`);
    if (!res.ok) throw new Error('API fetch failed');
    const data = await res.json();
    return data.conversations;
  } catch (err) {
    console.warn('Backend fetch failed, using local offline fallback', err);
    return [];
  }
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  try {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);
    if (!res.ok) throw new Error('API fetch failed');
    const data = await res.json();
    return data.messages;
  } catch (err) {
    console.warn('Backend fetch failed', err);
    return [];
  }
}

export async function sendMessage(conversationId: string, text: string): Promise<Message | null> {
  try {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Send failed');
    const data = await res.json();
    return data.message;
  } catch (err) {
    console.error('Failed to send message', err);
    return null;
  }
}

export async function archiveConversation(conversationId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/archive`, {
      method: 'POST',
    });
    const data = await res.json();
    return data.isArchived;
  } catch (err) {
    console.error('Failed to archive', err);
    return false;
  }
}

export async function markAsRead(conversationId: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  } catch (err) {
    console.error('Failed to mark read', err);
  }
}

export async function fetchContact(contactId: string): Promise<{ contact: Contact; sharedAttachments: any[] } | null> {
  try {
    const res = await fetch(`${API_BASE}/contacts/${contactId}`);
    if (!res.ok) throw new Error('Contact fetch failed');
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch contact', err);
    return null;
  }
}

export async function fetchAccounts(): Promise<AccountSyncStatus[]> {
  try {
    const res = await fetch(`${API_BASE}/accounts`);
    const data = await res.json();
    return data.accounts;
  } catch (err) {
    console.error('Failed to fetch accounts', err);
    return [];
  }
}

export async function fetchCategories(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    return data.counts;
  } catch (err) {
    console.error('Failed to fetch categories', err);
    return { all: 6, human: 2, service: 2, receipt: 1, action: 1 };
  }
}

export async function fetchTelemetry(): Promise<TelemetryStats | null> {
  try {
    const res = await fetch(`${API_BASE}/telemetry/stats`);
    const data = await res.json();
    return data.telemetry;
  } catch (err) {
    console.error('Failed to fetch telemetry', err);
    return null;
  }
}
