import React, { useState, useEffect } from 'react';
import { ThreadList } from './components/ThreadList';
import { ThreadView } from './components/ThreadView';
import { SettingsModal } from './components/SettingsModal';
import { ComposeModal } from './components/ComposeModal';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  archiveConversation,
  markAsRead,
  fetchAccounts,
  fetchTelemetry,
  createConversation,
} from './api';
import { Conversation, Message, AccountSyncStatus, TelemetryStats } from './types';

export const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [accounts, setAccounts] = useState<AccountSyncStatus[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryStats | null>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Collapsible sidebar state (persisted)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('threads_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('threads_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Responsive mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    loadData();
    const interval = setInterval(loadTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [convs, accs] = await Promise.all([
      fetchConversations(),
      fetchAccounts(),
    ]);
    setConversations(convs);
    setAccounts(accs);

    // Default select first conversation on desktop if none selected
    if (convs.length > 0 && !activeConversationId && window.innerWidth >= 768) {
      selectConversation(convs[0]);
    }

    loadTelemetry();
  };

  const loadTelemetry = async () => {
    const stats = await fetchTelemetry();
    if (stats) setTelemetry(stats);
  };

  const selectConversation = async (conv: Conversation) => {
    setActiveConversationId(conv.id);
    const msgs = await fetchMessages(conv.id);
    setMessages(msgs);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversation) return;

    const userEmail = accounts[0]?.email || 'user@threads.local';

    // Optimistic message append
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversation.id,
      providerMessageId: `<out-${Date.now()}@threads.local>`,
      provider: activeConversation.providerBadge === 'yandex' ? 'yandex' : 'gmail',
      sender: { name: 'Вы', email: userEmail },
      recipients: [activeConversation.contact.primaryEmail],
      subject: activeConversation.subjectContext,
      timestamp: Date.now(),
      isOutgoing: true,
      status: 'sent',
      cleanBody: text,
      attachments: [],
    };
    setMessages((prev) => [...prev, tempMsg]);

    const sent = await sendMessage(activeConversation.id, text);
    if (sent) {
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? sent : m)));
    }

    // Refresh conversation snippet
    const updatedConvs = await fetchConversations();
    setConversations(updatedConvs);
    loadTelemetry();
  };

  const handleArchiveConversation = async (convId: string) => {
    await archiveConversation(convId);
    const updated = conversations.filter((c) => c.id !== convId);
    setConversations(updated);

    if (activeConversationId === convId) {
      if (updated.length > 0 && !isMobile) {
        selectConversation(updated[0]);
      } else {
        setActiveConversationId(null);
        setMessages([]);
      }
    }
    loadTelemetry();
  };

  const handleMarkAsRead = async (convId: string) => {
    await markAsRead(convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );
    loadTelemetry();
  };

  const handleSendNewMessage = async (recipient: string, subject: string, body: string) => {
    const existing = conversations.find(
      (c) => c.contact.primaryEmail.toLowerCase() === recipient.toLowerCase()
    );
    if (existing) {
      selectConversation(existing);
      handleSendMessage(body);
    } else {
      const created = await createConversation(recipient, subject, body);
      if (created) {
        setConversations((prev) => [created.conversation, ...prev]);
        setActiveConversationId(created.conversation.id);
        setMessages([created.message]);
        loadTelemetry();
      }
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0C] text-[#EDEDED] font-sans antialiased selection:bg-white selection:text-black">
      {/* Mobile Single Screen flow */}
      {isMobile ? (
        activeConversation ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <ThreadView
              conversation={activeConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              onArchiveConversation={handleArchiveConversation}
              onMarkAsRead={handleMarkAsRead}
              onBack={() => setActiveConversationId(null)}
              isMobile={true}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
            <ThreadList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={(conv) => selectConversation(conv)}
              onOpenCompose={() => setIsComposeOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isMobile={true}
            />
          </div>
        )
      ) : (
        /* Desktop Clean 2-Column Flow */
        <>
          {/* Screen 1: Thread List (Collapsible: 68px vs 340px) */}
          <div
            className={`${
              isSidebarCollapsed ? 'w-[68px]' : 'w-[340px]'
            } flex-shrink-0 flex flex-col h-full transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width] overflow-hidden`}
          >
            <ThreadList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={(conv) => selectConversation(conv)}
              onOpenCompose={() => setIsComposeOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebar}
              isMobile={false}
            />
          </div>

          {/* Screen 2: Thread View (flex-1) */}
          <div className="flex-1 flex flex-col h-full min-w-0">
            <ThreadView
              conversation={activeConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              onArchiveConversation={handleArchiveConversation}
              onMarkAsRead={handleMarkAsRead}
              isMobile={false}
            />
          </div>
        </>
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        accounts={accounts}
        telemetry={telemetry}
        onAccountsUpdated={loadData}
      />

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSendNewMessage={handleSendNewMessage}
      />
    </div>
  );
};
