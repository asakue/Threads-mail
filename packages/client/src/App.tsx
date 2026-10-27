import React, { useState, useEffect } from 'react';
import { AppSidebar } from './components/AppSidebar';
import { ConversationList } from './components/ConversationList';
import { ChatArea } from './components/ChatArea';
import { ContactDossier } from './components/ContactDossier';
import { SettingsModal } from './components/SettingsModal';
import { ComposeModal } from './components/ComposeModal';
import { MobileNavBar } from './components/MobileNavBar';
import { CategoriesView } from './components/CategoriesView';
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [sharedAttachments, setSharedAttachments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [accounts, setAccounts] = useState<AccountSyncStatus[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [telemetry, setTelemetry] = useState<TelemetryStats | null>(null);

  // UI state
  const [isDossierOpen, setIsDossierOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'inbox' | 'categories'>('inbox');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Screen size check for adaptive behaviors
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsDossierOpen(false);
      }
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
    const [convs, accs, cats] = await Promise.all([
      fetchConversations(selectedCategory),
      fetchAccounts(),
      fetchCategories(),
    ]);
    setConversations(convs);
    setAccounts(accs);
    setCategoryCounts(cats);

    // Default select first conversation on desktop
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
  };

  const handleSelectCategory = async (cat: string) => {
    setSelectedCategory(cat);
    const convs = await fetchConversations(cat);
    setConversations(convs);
    if (convs.length > 0 && !isMobile) {
      selectConversation(convs[0]);
    } else if (convs.length === 0) {
      setActiveConversationId(null);
      setMessages([]);
    }
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
    // If conversation with recipient exists, send to it, else create
    const existing = conversations.find(
      (c) => c.contact.primaryEmail.toLowerCase() === recipient.toLowerCase()
    );
    if (existing) {
      selectConversation(existing);
      handleSendMessage(body);
    } else {
      // Send message to active or new thread
      const firstConv = conversations[0];
      if (firstConv) {
        selectConversation(firstConv);
        handleSendMessage(body);
      }
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  const unreadTotal = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        isDarkMode ? 'bg-vibery-black text-[#E5E5E7]' : 'bg-[#F5F5F7] text-black'
      } font-sans selection:bg-white selection:text-black antialiased`}
    >
      {/* ================= 1. DESKTOP / TABLET SIDEBAR ================= */}
      <div className="hidden md:flex flex-shrink-0">
        <AppSidebar
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          categoryCounts={categoryCounts}
          accounts={accounts}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenCompose={() => setIsComposeOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
      </div>

      {/* ================= 2. ADAPTIVE MAIN STAGE ================= */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* On Mobile: Switch between ConversationList and ChatArea */}
        {isMobile ? (
          activeConversationId && activeConversation ? (
            /* Mobile Chat View */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <ChatArea
                conversation={activeConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                onArchiveConversation={handleArchiveConversation}
                onMarkAsRead={handleMarkAsRead}
                onToggleDossier={() => setIsDossierOpen(!isDossierOpen)}
                isDossierOpen={isDossierOpen}
                onBackToConversations={() => setActiveConversationId(null)}
              />
              {/* Mobile Dossier Drawer */}
              {isDossierOpen && activeContact && (
                <ContactDossier
                  contact={activeContact}
                  sharedAttachments={sharedAttachments}
                  onClose={() => setIsDossierOpen(false)}
                  isMobileDrawer={true}
                />
              )}
            </div>
          ) : (
            /* Mobile Feed / Categories View */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {mobileTab === 'categories' ? (
                <CategoriesView
                  categoryCounts={categoryCounts}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                  onClose={() => setMobileTab('inbox')}
                />
              ) : (
                <ConversationList
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelectConversation={(conv) => selectConversation(conv)}
                  onArchiveConversation={handleArchiveConversation}
                  onMarkAsRead={handleMarkAsRead}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                  categoryCounts={categoryCounts}
                  onOpenCompose={() => setIsComposeOpen(true)}
                  isMobileView={true}
                />
              )}
              {/* Mobile Bottom Navigation Bar */}
              <MobileNavBar
                currentTab={mobileTab}
                onSelectTab={setMobileTab}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenCompose={() => setIsComposeOpen(true)}
                unreadTotal={unreadTotal}
              />
            </div>
          )
        ) : (
          /* ================= DESKTOP 2-to-3 COLUMN STAGE ================= */
          <>
            {/* Column 2: Conversation List (320px - 360px) */}
            <div className="w-80 lg:w-96 flex-shrink-0 flex flex-col h-full">
              <ConversationList
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={(conv) => selectConversation(conv)}
                onArchiveConversation={handleArchiveConversation}
                onMarkAsRead={handleMarkAsRead}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                categoryCounts={categoryCounts}
                onOpenCompose={() => setIsComposeOpen(true)}
                isMobileView={false}
              />
            </div>

            {/* Column 3: Active Chat Area (flex-1) */}
            <div className="flex-1 flex flex-col h-full min-w-0">
              <ChatArea
                conversation={activeConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                onArchiveConversation={handleArchiveConversation}
                onMarkAsRead={handleMarkAsRead}
                onToggleDossier={() => setIsDossierOpen(!isDossierOpen)}
                isDossierOpen={isDossierOpen}
              />
            </div>

            {/* Column 4: Collapsible Contact Dossier (320px) */}
            {isDossierOpen && activeContact && (
              <div className="hidden lg:flex w-80 flex-shrink-0 h-full">
                <ContactDossier
                  contact={activeContact}
                  sharedAttachments={sharedAttachments}
                  onClose={() => setIsDossierOpen(false)}
                  isMobileDrawer={false}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ================= 3. MODALS ================= */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        accounts={accounts}
        telemetry={telemetry}
      />

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSendNewMessage={handleSendNewMessage}
      />
    </div>
  );
};
