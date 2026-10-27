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
    this.seedInitialData();
  }

  private seedInitialData(): void {
    // 1. Accounts
    this.accounts.set('acc-gmail', {
      id: 'acc-gmail',
      email: 'team.vibery@gmail.com',
      provider: 'gmail',
      isConnected: true,
      status: 'synced',
      lastSyncedTimestamp: Date.now() - 1000 * 60 * 2,
      latencyMs: 14,
      totalMessagesIndexed: 1420,
    });

    this.accounts.set('acc-yandex', {
      id: 'acc-yandex',
      email: 'lead@yandex.ru',
      provider: 'yandex',
      isConnected: true,
      status: 'synced',
      lastSyncedTimestamp: Date.now() - 1000 * 60 * 4,
      latencyMs: 9,
      totalMessagesIndexed: 890,
    });

    // 2. Contacts
    const contactAlyona: Contact = {
      id: 'cnt-alyona',
      displayName: 'Алёна Романова',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces',
      primaryEmail: 'alyona@designlab.io',
      linkedEmails: [
        {
          email: 'alyona@designlab.io',
          label: 'Корпоративная (Google Workspace)',
          isPrimary: true,
          provider: 'gmail',
        },
        {
          email: 'romanova.design@yandex.ru',
          label: 'Личная почта (Яндекс)',
          isPrimary: false,
          provider: 'yandex',
        },
      ],
      isService: false,
      category: 'human',
      organization: 'DesignLab Inc.',
      role: 'Lead Product Designer',
      totalMessagesExchanged: 48,
      firstContactDate: '14 авг 2025',
      avgResponseTimeMinutes: 18,
    };

    const contactGithub: Contact = {
      id: 'cnt-github',
      displayName: 'GitHub Enterprise',
      primaryEmail: 'notifications@github.com',
      linkedEmails: [
        {
          email: 'notifications@github.com',
          label: 'CI/CD Bot',
          isPrimary: true,
          provider: 'yandex',
        },
      ],
      isService: true,
      serviceBrandColor: '#24292e',
      serviceIconName: 'github-logo',
      category: 'service',
      organization: 'GitHub Inc.',
      totalMessagesExchanged: 140,
      firstContactDate: '01 янв 2024',
    };

    const contactTbank: Contact = {
      id: 'cnt-tbank',
      displayName: 'Т-Банк Бизнес',
      primaryEmail: 'noreply@tbank.ru',
      linkedEmails: [
        {
          email: 'noreply@tbank.ru',
          label: 'Бухгалтерия & Чеки',
          isPrimary: true,
          provider: 'gmail',
        },
      ],
      isService: true,
      serviceBrandColor: '#FFDD2D',
      serviceIconName: 'receipt',
      category: 'receipt',
      organization: 'Т-Банк',
      totalMessagesExchanged: 32,
      firstContactDate: '10 мар 2025',
    };

    const contactDmitriy: Contact = {
      id: 'cnt-dmitriy',
      displayName: 'Дмитрий (ML Lead)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces',
      primaryEmail: 'dmitriy.ml@yandex.ru',
      linkedEmails: [
        {
          email: 'dmitriy.ml@yandex.ru',
          label: 'Яндекс Почта',
          isPrimary: true,
          provider: 'yandex',
        },
      ],
      isService: false,
      category: 'human',
      organization: 'Vibery Core',
      role: 'ML Lead',
      totalMessagesExchanged: 29,
      firstContactDate: '05 окт 2026',
      avgResponseTimeMinutes: 12,
    };

    const contactAeroflot: Contact = {
      id: 'cnt-aeroflot',
      displayName: 'Аэрофлот',
      primaryEmail: 'tickets@aeroflot.ru',
      linkedEmails: [
        {
          email: 'tickets@aeroflot.ru',
          label: 'Авиабилеты',
          isPrimary: true,
          provider: 'gmail',
        },
      ],
      isService: true,
      serviceBrandColor: '#0055A5',
      serviceIconName: 'airplane-tilt',
      category: 'service',
      organization: 'Аэрофлот',
      totalMessagesExchanged: 8,
      firstContactDate: '19 окт 2026',
    };

    const contactMikhail: Contact = {
      id: 'cnt-mikhail',
      displayName: 'Михаил (Архитектор)',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces',
      primaryEmail: 'mikhail@contract.io',
      linkedEmails: [
        {
          email: 'mikhail@contract.io',
          label: 'Партнерский контракт',
          isPrimary: true,
          provider: 'gmail',
        },
      ],
      isService: false,
      category: 'action',
      organization: 'SLA Partners',
      role: 'Chief Architect',
      totalMessagesExchanged: 15,
      firstContactDate: '20 окт 2026',
      avgResponseTimeMinutes: 45,
    };

    [contactAlyona, contactGithub, contactTbank, contactDmitriy, contactAeroflot, contactMikhail].forEach((c) => {
      this.contacts.set(c.id, c);
    });

    // 3. Messages for Alyona
    const alyonaRaw1 = `
Уважаемые коллеги!

Привет, команда! Собрали итоговый пайплайн для презентации перед жюри. Очистили интерфейс от лишнего визуального мусора.

С уважением,
Алёна Романова
    `;
    const clean1 = declutterEmailContent(alyonaRaw1);

    const alyonaMsg1: Message = {
      id: 'msg-al-1',
      conversationId: 'conv-alyona',
      providerMessageId: '<al-01@designlab.io>',
      provider: 'gmail',
      sender: {
        name: 'Алёна Романова',
        email: 'alyona@designlab.io',
        avatarUrl: contactAlyona.avatarUrl,
      },
      recipients: ['team.vibery@gmail.com'],
      subject: 'Re: Финальный питч хакатона 2026 // Архитектура',
      timestamp: Date.now() - 1000 * 60 * 95, // 10:14
      isOutgoing: false,
      status: 'read',
      cleanBody: clean1.cleanBody,
      greeting: clean1.isolatedGreeting,
      signature: clean1.signature,
      attachments: [],
    };

    const alyonaMsg2: Message = {
      id: 'msg-al-2',
      conversationId: 'conv-alyona',
      providerMessageId: '<out-01@vibery.team>',
      provider: 'gmail',
      sender: {
        name: 'Вы',
        email: 'team.vibery@gmail.com',
      },
      recipients: ['alyona@designlab.io'],
      subject: 'Re: Финальный питч хакатона 2026 // Архитектура',
      timestamp: Date.now() - 1000 * 60 * 85, // 10:20
      isOutgoing: true,
      status: 'read',
      cleanBody: 'Отлично! Главное покажите, что мы не заменяем ящики, а даем слой мессенджера поверх существующих серверов.',
      attachments: [],
    };

    const alyonaRaw3 = `
Добрый день!

Прикрепила готовую спецификацию и схему потоков в PDF. Исходники в Figma тоже обновили:

С уважением,
Алёна
    `;
    const clean3 = declutterEmailContent(alyonaRaw3);

    const alyonaMsg3: Message = {
      id: 'msg-al-3',
      conversationId: 'conv-alyona',
      providerMessageId: '<al-02@designlab.io>',
      provider: 'gmail',
      sender: {
        name: 'Алёна Романова',
        email: 'alyona@designlab.io',
        avatarUrl: contactAlyona.avatarUrl,
      },
      recipients: ['team.vibery@gmail.com'],
      subject: 'Re: Финальный питч хакатона 2026 // Архитектура',
      timestamp: Date.now() - 1000 * 60 * 15, // 10:42
      isOutgoing: false,
      status: 'read',
      cleanBody: clean3.cleanBody,
      greeting: clean3.isolatedGreeting,
      signature: clean3.signature,
      attachments: [
        {
          id: 'att-pitch-pdf',
          filename: 'Pitch_Deck_Vibery.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 4404019, // 4.2 MB
          downloadUrl: '/attachments/Pitch_Deck_Vibery.pdf',
          isInline: false,
          category: 'pdf',
        },
      ],
      quickReplies: ['👍 Принято, смотрю', '📁 Сохранить в проект'],
    };

    this.messages.set('conv-alyona', [alyonaMsg1, alyonaMsg2, alyonaMsg3]);

    // 4. Messages for GitHub
    const githubMsg: Message = {
      id: 'msg-gh-1',
      conversationId: 'conv-github',
      providerMessageId: '<gh-ci-140@github.com>',
      provider: 'yandex',
      sender: {
        name: 'GitHub Enterprise',
        email: 'notifications@github.com',
      },
      recipients: ['lead@yandex.ru'],
      subject: '[vibery/hackathon-app] CI/CD Pipeline succeeded',
      timestamp: Date.now() - 1000 * 60 * 60 * 24, // Yesterday
      isOutgoing: false,
      status: 'read',
      cleanBody: 'Build #140 deployed to staging server in 38s. All 48 unit and integration tests passed.',
      attachments: [],
    };
    this.messages.set('conv-github', [githubMsg]);

    // 5. Messages for T-Bank
    const tbankMsg: Message = {
      id: 'msg-tb-1',
      conversationId: 'conv-tbank',
      providerMessageId: '<receipt-9821@tbank.ru>',
      provider: 'gmail',
      sender: {
        name: 'Т-Банк Бизнес',
        email: 'noreply@tbank.ru',
      },
      recipients: ['team.vibery@gmail.com'],
      subject: 'Электронный чек по операции #9821',
      timestamp: Date.now() - 1000 * 60 * 60 * 72, // 24 Oct
      isOutgoing: false,
      status: 'read',
      cleanBody: 'Оплата подписки облачных серверов Yandex Cloud. Сумма операции: 14 290 ₽.',
      attachments: [
        {
          id: 'att-receipt-pdf',
          filename: 'Check_9821_YandexCloud.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 122880,
          downloadUrl: '/attachments/Check_9821.pdf',
          isInline: false,
          category: 'pdf',
        },
      ],
    };
    this.messages.set('conv-tbank', [tbankMsg]);

    // 6. Messages for Dmitriy
    const dmitriyMsg: Message = {
      id: 'msg-dm-1',
      conversationId: 'conv-dmitriy',
      providerMessageId: '<dm-onnx@yandex.ru>',
      provider: 'yandex',
      sender: {
        name: 'Дмитрий (ML Lead)',
        email: 'dmitriy.ml@yandex.ru',
        avatarUrl: contactDmitriy.avatarUrl,
      },
      recipients: ['lead@yandex.ru'],
      subject: 'Веса модели обучены',
      timestamp: Date.now() - 1000 * 60 * 60 * 96, // 23 Oct
      isOutgoing: false,
      status: 'read',
      cleanBody: 'Модель сжата до 40MB, работает локально в ONNX. Срезка цитат занимает менее 2мс на письмо.',
      attachments: [],
    };
    this.messages.set('conv-dmitriy', [dmitriyMsg]);

    // 7. Messages for Aeroflot
    const aeroMsg: Message = {
      id: 'msg-ae-1',
      conversationId: 'conv-aeroflot',
      providerMessageId: '<su-1142@aeroflot.ru>',
      provider: 'gmail',
      sender: {
        name: 'Аэрофлот',
        email: 'tickets@aeroflot.ru',
      },
      recipients: ['team.vibery@gmail.com'],
      subject: 'Маршрутная квитанция на рейс SU-1142',
      timestamp: Date.now() - 1000 * 60 * 60 * 180, // 19 Oct
      isOutgoing: false,
      status: 'read',
      cleanBody: 'Электронный посадочный талон прикреплен. Вылет из терминала B в 14:30.',
      attachments: [
        {
          id: 'att-boarding-pass',
          filename: 'Boarding_Pass_SU1142.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 345000,
          downloadUrl: '/attachments/Boarding_Pass.pdf',
          isInline: false,
          category: 'pdf',
        },
      ],
    };
    this.messages.set('conv-aeroflot', [aeroMsg]);

    // 8. Messages for Mikhail
    const mikhailMsg: Message = {
      id: 'msg-mi-1',
      conversationId: 'conv-mikhail',
      providerMessageId: '<mi-sla@contract.io>',
      provider: 'gmail',
      sender: {
        name: 'Михаил (Архитектор)',
        email: 'mikhail@contract.io',
        avatarUrl: contactMikhail.avatarUrl,
      },
      recipients: ['team.vibery@gmail.com'],
      subject: 'Срочно: дедлайн по контракту',
      timestamp: Date.now() - 1000 * 60 * 45,
      isOutgoing: false,
      status: 'read',
      cleanBody: 'К какому числу сможем согласовать правки по SLA? Ждем вашего подтверждения до вечера.',
      attachments: [],
      quickReplies: ['Сегодня до 18:00', 'Завтра утром'],
    };
    this.messages.set('conv-mikhail', [mikhailMsg]);

    // Conversations mapping
    const convAlyona: Conversation = {
      id: 'conv-alyona',
      contactId: contactAlyona.id,
      contact: contactAlyona,
      subjectContext: 'Re: Финальный питч хакатона 2026 // Архитектура',
      lastMessageSnippet: 'Прикрепила готовую спецификацию и схему потоков в PDF...',
      lastMessageTimestamp: alyonaMsg3.timestamp,
      unreadCount: 0,
      isArchived: false,
      category: 'human',
      providerBadge: 'gmail',
      totalMessages: 3,
    };

    const convGithub: Conversation = {
      id: 'conv-github',
      contactId: contactGithub.id,
      contact: contactGithub,
      subjectContext: '[vibery/hackathon-app] CI/CD Pipeline succeeded',
      lastMessageSnippet: 'Build #140 deployed to staging server in 38s',
      lastMessageTimestamp: githubMsg.timestamp,
      unreadCount: 0,
      isArchived: false,
      category: 'service',
      providerBadge: 'yandex',
      totalMessages: 1,
    };

    const convTbank: Conversation = {
      id: 'conv-tbank',
      contactId: contactTbank.id,
      contact: contactTbank,
      subjectContext: 'Электронный чек по операции #9821',
      lastMessageSnippet: 'Оплата подписки облачных серверов Yandex Cloud',
      lastMessageTimestamp: tbankMsg.timestamp,
      unreadCount: 0,
      isArchived: false,
      category: 'receipt',
      providerBadge: 'gmail',
      totalMessages: 1,
    };

    const convDmitriy: Conversation = {
      id: 'conv-dmitriy',
      contactId: contactDmitriy.id,
      contact: contactDmitriy,
      subjectContext: 'Веса модели обучены',
      lastMessageSnippet: 'Модель сжата до 40MB, работает локально в ONNX',
      lastMessageTimestamp: dmitriyMsg.timestamp,
      unreadCount: 0,
      isArchived: false,
      category: 'human',
      providerBadge: 'yandex',
      totalMessages: 1,
    };

    const convAeroflot: Conversation = {
      id: 'conv-aeroflot',
      contactId: contactAeroflot.id,
      contact: contactAeroflot,
      subjectContext: 'Маршрутная квитанция на рейс SU-1142',
      lastMessageSnippet: 'Электронный посадочный талон прикреплен',
      lastMessageTimestamp: aeroMsg.timestamp,
      unreadCount: 0,
      isArchived: false,
      category: 'service',
      providerBadge: 'gmail',
      totalMessages: 1,
    };

    const convMikhail: Conversation = {
      id: 'conv-mikhail',
      contactId: contactMikhail.id,
      contact: contactMikhail,
      subjectContext: 'Срочно: дедлайн по контракту',
      lastMessageSnippet: 'К какому числу сможем согласовать правки по SLA?',
      lastMessageTimestamp: mikhailMsg.timestamp,
      unreadCount: 1,
      isArchived: false,
      category: 'action',
      providerBadge: 'gmail',
      totalMessages: 1,
    };

    [convAlyona, convGithub, convTbank, convDmitriy, convAeroflot, convMikhail].forEach((c) => {
      this.conversations.set(c.id, c);
    });
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

  public addMessage(convId: string, text: string, isOutgoing = true): Message | undefined {
    const conv = this.conversations.get(convId);
    if (!conv) return undefined;

    const clean = declutterEmailContent(text);
    const msgId = `msg-${Date.now()}`;
    const newMsg: Message = {
      id: msgId,
      conversationId: convId,
      providerMessageId: `<${msgId}@vibery.client>`,
      provider: conv.contact.primaryEmail.includes('yandex') ? 'yandex' : 'gmail',
      sender: isOutgoing
        ? { name: 'Вы', email: 'team.vibery@gmail.com' }
        : { name: conv.contact.displayName, email: conv.contact.primaryEmail, avatarUrl: conv.contact.avatarUrl },
      recipients: [isOutgoing ? conv.contact.primaryEmail : 'team.vibery@gmail.com'],
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
}

export const emailStore = new InMemoryEmailStore();
