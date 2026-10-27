import {
  Contact,
  Conversation,
  Message,
  AccountSyncStatus,
  declutterEmailContent,
  classifySmartCategory,
} from '@vibery/shared';

export class InMemoryEmailStore {
  private contacts: Map<string, Contact> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private accounts: Map<string, AccountSyncStatus> = new Map();

  constructor() {
    // Zero hardcoded mock contacts or placeholder messages.
    // Clean initial state: populated exclusively via real mail accounts, incoming sync, or user actions.
  }

  public getConversations(categoryFilter?: string, includeArchived = false): Conversation[] {
    let list = Array.from(this.conversations.values());
    if (!includeArchived) {
      list = list.filter((c) => !c.isArchived);
    }
    if (categoryFilter && categoryFilter !== 'all') {
      list = list.filter((c) => c.category === categoryFilter);
    }
    return list.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
  }

  public getConversationById(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  public getMessagesForConversation(convId: string): Message[] {
    return this.messages.get(convId) || [];
  }

  public getContactById(contactId: string): Contact | undefined {
    return this.contacts.get(contactId);
  }

  public getAccounts(): AccountSyncStatus[] {
    return Array.from(this.accounts.values());
  }

  public addAccount(account: AccountSyncStatus): void {
    this.accounts.set(account.id, account);
  }

  public removeAccount(id: string): boolean {
    return this.accounts.delete(id);
  }

  public toggleArchive(convId: string): boolean {
    const conv = this.conversations.get(convId);
    if (conv) {
      conv.isArchived = !conv.isArchived;
      return conv.isArchived;
    }
    return false;
  }

  public markAsRead(convId: string): void {
    const conv = this.conversations.get(convId);
    if (conv) {
      conv.unreadCount = 0;
    }
  }

  public createConversationWithContact(contact: Contact, conversation: Conversation): void {
    this.contacts.set(contact.id, contact);
    this.conversations.set(conversation.id, conversation);
    if (!this.messages.has(conversation.id)) {
      this.messages.set(conversation.id, []);
    }
  }

  public appendRawMessage(convId: string, message: Message): void {
    const list = this.messages.get(convId) || [];
    list.push(message);
    this.messages.set(convId, list);
  }

  public startNewConversation(params: {
    recipient: string;
    recipientName?: string;
    subject: string;
    body: string;
    senderEmail?: string;
  }): { conversation: Conversation; message: Message } {
    const { recipient, subject, body, senderEmail } = params;
    const recipientClean = recipient.trim().toLowerCase();
    const primaryAccount = Array.from(this.accounts.values())[0];
    const fromEmail = senderEmail || primaryAccount?.email || 'user@threads.local';

    // Find or create contact
    let contact = Array.from(this.contacts.values()).find(
      (c) => c.primaryEmail.toLowerCase() === recipientClean
    );

    if (!contact) {
      const contactId = `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const namePart = params.recipientName || recipientClean.split('@')[0];
      const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      contact = {
        id: contactId,
        displayName,
        primaryEmail: recipientClean,
        linkedEmails: [
          {
            email: recipientClean,
            label: 'Основной',
            isPrimary: true,
            provider: recipientClean.includes('yandex') ? 'yandex' : 'gmail',
          },
        ],
        isService: false,
        category: 'human',
        totalMessagesExchanged: 1,
        firstContactDate: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }),
      };
      this.contacts.set(contact.id, contact);
    }

    const convId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const clean = declutterEmailContent(body);
    const category = classifySmartCategory(recipientClean, subject || '', clean.cleanBody || '');
    const now = Date.now();

    const conversation: Conversation = {
      id: convId,
      contactId: contact.id,
      contact,
      subjectContext: subject || 'Без темы',
      lastMessageSnippet: clean.cleanBody.substring(0, 90),
      lastMessageTimestamp: now,
      unreadCount: 0,
      isArchived: false,
      category,
      providerBadge: recipientClean.includes('yandex') ? 'yandex' : 'gmail',
      totalMessages: 1,
    };

    const msgId = `msg-${now}-${Math.random().toString(36).substring(2, 6)}`;
    const message: Message = {
      id: msgId,
      conversationId: convId,
      providerMessageId: `<${msgId}@threads.local>`,
      provider: recipientClean.includes('yandex') ? 'yandex' : 'gmail',
      sender: { name: 'Вы', email: fromEmail },
      recipients: [recipientClean],
      subject: conversation.subjectContext,
      timestamp: now,
      isOutgoing: true,
      status: 'sent',
      cleanBody: clean.cleanBody,
      greeting: clean.isolatedGreeting,
      signature: clean.signature,
      attachments: [],
    };

    this.conversations.set(conversation.id, conversation);
    this.messages.set(conversation.id, [message]);

    return { conversation, message };
  }

  public addMessage(convId: string, text: string, isOutgoing = true, senderEmail?: string): Message | undefined {
    const conv = this.conversations.get(convId);
    if (!conv) return undefined;

    const primaryAccount = Array.from(this.accounts.values())[0];
    const fromEmail = senderEmail || primaryAccount?.email || 'user@threads.local';

    const clean = declutterEmailContent(text);
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newMsg: Message = {
      id: msgId,
      conversationId: convId,
      providerMessageId: `<${msgId}@threads.local>`,
      provider: conv.contact.primaryEmail.includes('yandex') ? 'yandex' : 'gmail',
      sender: isOutgoing
        ? { name: 'Вы', email: fromEmail }
        : { name: conv.contact.displayName, email: conv.contact.primaryEmail, avatarUrl: conv.contact.avatarUrl },
      recipients: [isOutgoing ? conv.contact.primaryEmail : fromEmail],
      subject: conv.subjectContext,
      timestamp: Date.now(),
      isOutgoing,
      status: 'sent',
      cleanBody: clean.cleanBody,
      greeting: clean.isolatedGreeting,
      signature: clean.signature,
      attachments: [],
    };

    const list = this.messages.get(convId) || [];
    list.push(newMsg);
    this.messages.set(convId, list);

    conv.lastMessageSnippet = clean.cleanBody.substring(0, 80);
    conv.lastMessageTimestamp = newMsg.timestamp;
    conv.totalMessages += 1;
    if (!isOutgoing) conv.unreadCount += 1;

    return newMsg;
  }

  public clearAll(): void {
    this.contacts.clear();
    this.conversations.clear();
    this.messages.clear();
    this.accounts.clear();
  }
}

export const emailStore = new InMemoryEmailStore();
