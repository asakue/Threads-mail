import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DeviceShell } from './components/DeviceShell';
import { DesktopLayout } from './components/DesktopLayout';
import { InboxScreen } from './screens/InboxScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ContactScreen } from './screens/ContactScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DesignSystemScreen } from './screens/DesignSystemScreen';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  archiveConversation,
  markAsRead,
  fetchAccounts,
  fetchCategories,
  fetchContact,
  fetchTelemetry,
} from './api';
import { Conversation, Message, Contact, AccountSyncStatus, TelemetryStats } from './types';

export const App: React.FC = () => {
  // Mode: 'desktop' (Superhuman 3-pane layout) vs 'mobile' (phone shell view)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'desktop' : 'mobile';
  });

  const [currentScreen, setCurrentScreen] = useState<'inbox' | 'dialog' | 'contact' | 'categories' | 'settings' | 'design'>('inbox');
  const [isDeviceMode, setIsDeviceMode] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [sharedAttachments, setSharedAttachments] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<AccountSyncStatus[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [telemetry, setTelemetry] = useState<TelemetryStats | null>(null);

  // Initial Data Load
  useEffect(() => {
    loadData();
    const interval = setInterval(loadTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [convs, accs, cats] = await Promise.all([
      fetchConversations(selectedCategory),
      fetchAccounts(),
      fetchCategories(),
    ]);
    setConversations(convs);
    setAccounts(accs);
    setCategoryCounts(cats);

    if (convs.length > 0 && !activeConversation) {
      setActiveConversation(convs[0]);
      const [msgs, contactData] = await Promise.all([
        fetchMessages(convs[0].id),
        fetchContact(convs[0].contactId),
      ]);
      setMessages(msgs);
      if (contactData) {
        setActiveContact(contactData.contact);
        setSharedAttachments(contactData.sharedAttachments);
      } else {
        setActiveContact(convs[0].contact);
      }
    }

    loadTelemetry();
  };

  const loadTelemetry = async () => {
    const stats = await fetchTelemetry();
    if (stats) setTelemetry(stats);
  };

  const handleSelectCategory = async (cat: string) => {
    setSelectedCategory(cat);
    const convs = await fetchConversations(cat);
    setConversations(convs);
    if (convs.length > 0) {
      handleSelectConversation(convs[0]);
    }
    setCurrentScreen('inbox');
  };

  const handleSelectConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    const [msgs, contactData] = await Promise.all([
      fetchMessages(conv.id),
      fetchContact(conv.contactId),
    ]);
    setMessages(msgs);
    if (contactData) {
      setActiveContact(contactData.contact);
      setSharedAttachments(contactData.sharedAttachments);
    } else {
      setActiveContact(conv.contact);
    }
    setCurrentScreen('dialog');
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversation) return;

    // Optimistic message append
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversation.id,
      providerMessageId: `<out-${Date.now()}@vibery.client>`,
      provider: activeConversation.providerBadge === 'yandex' ? 'yandex' : 'gmail',
      sender: { name: 'Вы', email: 'team.vibery@gmail.com' },
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
    const updatedConvs = await fetchConversations(selectedCategory);
    setConversations(updatedConvs);
    loadTelemetry();
  };

  const handleArchiveConversation = async (convId: string) => {
    await archiveConversation(convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversation?.id === convId) {
      const remaining = conversations.filter((c) => c.id !== convId);
      if (remaining.length > 0) {
        handleSelectConversation(remaining[0]);
      } else {
        setActiveConversation(null);
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

  const handleOpenContactProfile = async () => {
    if (activeConversation) {
      const data = await fetchContact(activeConversation.contactId);
      if (data) {
        setActiveContact(data.contact);
        setSharedAttachments(data.sharedAttachments);
      }
    }
    setCurrentScreen('contact');
  };

  // ================= VIEW: DESKTOP PRO LAYOUT (3-to-4 Panes) =================
  if (viewMode === 'desktop') {
    return (
      <DesktopLayout
        conversations={conversations}
        activeConversation={activeConversation}
        messages={messages}
        activeContact={activeContact}
        sharedAttachments={sharedAttachments}
        accounts={accounts}
        categoryCounts={categoryCounts}
        selectedCategory={selectedCategory}
        telemetry={telemetry}
        onSelectCategory={handleSelectCategory}
        onSelectConversation={handleSelectConversation}
        onSendMessage={handleSendMessage}
        onArchiveConversation={handleArchiveConversation}
        onMarkAsRead={handleMarkAsRead}
        onSwitchToMobile={() => setViewMode('mobile')}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  // ================= VIEW: MOBILE APPLICATION (Titanium Device Shell or Viewport) =================
  return (
    <div className="min-h-screen bg-vibery-black text-[#E5E5E7] flex flex-col blueprint-grid selection:bg-white selection:text-black">
      {/* Top App Header with Desktop switch button */}
      <Header
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        isDeviceMode={isDeviceMode}
        onToggleDeviceMode={() => setIsDeviceMode(!isDeviceMode)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Floating button to switch to Desktop Pro 3-pane mode */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => setViewMode('desktop')}
          className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition border border-white/10 font-mono shadow-md"
        >
          <i className="ph-bold ph-laptop text-sm"></i>
          <span>Переключить в Desktop Pro режим (3 колонки)</span>
        </button>
      </div>

      {/* Main Interactive Stage */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 overflow-hidden pb-4">
        <DeviceShell isDeviceMode={isDeviceMode} isDarkMode={isDarkMode}>
          {currentScreen === 'inbox' && (
            <InboxScreen
              conversations={conversations}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              onOpenConversation={handleSelectConversation}
              onArchiveConversation={handleArchiveConversation}
              onNavigateTab={(tab) => setCurrentScreen(tab as any)}
            />
          )}

          {currentScreen === 'dialog' && activeConversation && (
            <ChatScreen
              conversation={activeConversation}
              messages={messages}
              onBack={() => setCurrentScreen('inbox')}
              onSendMessage={handleSendMessage}
              onOpenContactProfile={handleOpenContactProfile}
            />
          )}

          {currentScreen === 'contact' && activeContact && (
            <ContactScreen
              contact={activeContact}
              sharedAttachments={sharedAttachments}
              onBack={() => setCurrentScreen('dialog')}
              onOpenChat={() => setCurrentScreen('dialog')}
            />
          )}

          {currentScreen === 'categories' && (
            <CategoriesScreen
              categoryCounts={categoryCounts}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsScreen accounts={accounts} />
          )}

          {currentScreen === 'design' && (
            <DesignSystemScreen telemetry={telemetry} />
          )}
        </DeviceShell>
      </main>
    </div>
  );
};
