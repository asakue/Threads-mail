import { Conversation, Message, Contact, AccountSyncStatus, TelemetryStats } from './types';

const API_BASE = (typeof window !== 'undefined' && (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5173')))
  ? 'http://127.0.0.1:3001/api'
  : '/api';

let cachedSessionToken: string | null = null;

async function getSessionToken(): Promise<string> {
  if (cachedSessionToken) return cachedSessionToken;
  try {
    const res = await fetch(`${API_BASE}/auth/session`);
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        cachedSessionToken = data.token;
        return cachedSessionToken;
      }
    }
  } catch (err) {
    console.warn('[Auth] Failed to acquire session token, using dev fallback', err);
  }
  return 'threads-dev-session-token-2026';
}

async function secureFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getSessionToken();
  const headers = new Headers(init.headers || {});
  if (!headers.has('x-threads-session-token')) {
    headers.set('x-threads-session-token', token);
  }
  return fetch(url, { ...init, headers });
}

export async function fetchConversations(category = 'all'): Promise<Conversation[]> {
  try {
    const res = await secureFetch(`${API_BASE}/conversations?category=${category}`);
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
    const res = await secureFetch(`${API_BASE}/conversations/${conversationId}/messages`);
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
    const res = await secureFetch(`${API_BASE}/conversations/${conversationId}/messages`, {
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
    const res = await secureFetch(`${API_BASE}/conversations/${conversationId}/archive`, {
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
    await secureFetch(`${API_BASE}/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  } catch (err) {
    console.error('Failed to mark read', err);
  }
}

export async function fetchContact(contactId: string): Promise<{ contact: Contact; sharedAttachments: any[] } | null> {
  try {
    const res = await secureFetch(`${API_BASE}/contacts/${contactId}`);
    if (!res.ok) throw new Error('Contact fetch failed');
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch contact', err);
    return null;
  }
}

export async function fetchAccounts(): Promise<AccountSyncStatus[]> {
  try {
    const res = await secureFetch(`${API_BASE}/accounts`);
    const data = await res.json();
    return data.accounts;
  } catch (err) {
    console.error('Failed to fetch accounts', err);
    return [];
  }
}

export async function createConversation(
  recipient: string,
  subject: string,
  body: string
): Promise<{ conversation: Conversation; message: Message } | null> {
  try {
    const res = await secureFetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient, subject, body }),
    });
    if (!res.ok) throw new Error('Create conversation failed');
    const data = await res.json();
    return { conversation: data.conversation, message: data.message };
  } catch (err) {
    console.error('Failed to create conversation', err);
    return null;
  }
}

export interface AddAccountResult {
  success: boolean;
  account?: AccountSyncStatus;
  error?: string;
}

export async function addAccount(
  email: string,
  provider?: 'gmail' | 'yandex' | 'imap',
  password?: string,
  imapHost?: string
): Promise<AddAccountResult> {
  try {
    const res = await secureFetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, provider, password, imapHost }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || `Ошибка подключения (${res.status})` };
    }
    return { success: true, account: data.account };
  } catch (err: any) {
    console.error('Failed to add account', err);
    return {
      success: false,
      error: 'Не удалось связаться с бэкендом (порт 3001). Запустите сервер: npm run server',
    };
  }
}

export async function deleteAccount(id: string): Promise<boolean> {
  try {
    const res = await secureFetch(`${API_BASE}/accounts/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete account', err);
    return false;
  }
}

export async function fetchCategories(): Promise<Record<string, number>> {
  try {
    const res = await secureFetch(`${API_BASE}/categories`);
    const data = await res.json();
    return data.counts;
  } catch (err) {
    console.error('Failed to fetch categories', err);
    return { all: 0, human: 0, service: 0, receipt: 0, action: 0 };
  }
}

export async function fetchTelemetry(): Promise<TelemetryStats | null> {
  try {
    const res = await secureFetch(`${API_BASE}/telemetry/stats`);
    const data = await res.json();
    return data.telemetry;
  } catch (err) {
    console.error('Failed to fetch telemetry', err);
    return null;
  }
}
