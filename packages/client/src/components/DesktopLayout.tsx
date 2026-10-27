import React, { useState } from 'react';
import { Conversation, Message, Contact, AccountSyncStatus, TelemetryStats } from '../types';

interface DesktopLayoutProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  activeContact: Contact | null;
  sharedAttachments: any[];
  accounts: AccountSyncStatus[];
  categoryCounts: Record<string, number>;
  selectedCategory: string;
  telemetry: TelemetryStats | null;
  onSelectCategory: (cat: string) => void;
  onSelectConversation: (conv: Conversation) => void;
  onSendMessage: (text: string) => void;
  onArchiveConversation: (convId: string) => void;
  onMarkAsRead: (convId: string) => void;
  onSwitchToMobile: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  conversations,
  activeConversation,
  messages,
  activeContact,
  sharedAttachments,
  accounts,
  categoryCounts,
  selectedCategory,
  telemetry,
  onSelectCategory,
  onSelectConversation,
  onSendMessage,
  onArchiveConversation,
  onMarkAsRead,
  onSwitchToMobile,
  isDarkMode,
  onToggleTheme,
}) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDossier, setShowDossier] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.contact.displayName.toLowerCase().includes(q) ||
      c.subjectContext.toLowerCase().includes(q) ||
      c.lastMessageSnippet.toLowerCase().includes(q)
    );
  });

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleQuote = (msgId: string) => {
    setExpandedQuotes((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const channels = [
    { id: 'all', label: 'Все входящие', icon: 'tray', count: categoryCounts.all || conversations.length },
    { id: 'human', label: 'Люди и Команда', icon: 'users', count: categoryCounts.human || 2 },
    { id: 'service', label: 'Сервисы и боты', icon: 'bell-simple-ringing', count: categoryCounts.service || 2 },
    { id: 'receipt', label: 'Чеки и Финансы', icon: 'receipt', count: categoryCounts.receipt || 1 },
    { id: 'action', label: 'Требуют ответа', icon: 'check-square-offset', count: categoryCounts.action || 1 },
  ];

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${isDarkMode ? 'bg-vibery-black text-[#E5E5E7]' : 'bg-[#F5F5F7] text-black'} font-sans select-none`}>
      {/* ================= PANE 1: LEFT NAVIGATION RAIL ================= */}
      <aside className={`w-64 border-r ${isDarkMode ? 'border-vibery-border bg-vibery-dark' : 'border-zinc-300 bg-zinc-100'} flex flex-col justify-between flex-shrink-0 z-20`}>
        {/* Top: Logo & Mailbox Switcher */}
        <div>
          {/* Logo */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-xl font-black tracking-tight font-mono uppercase inline-flex items-baseline">
                ВА<span className="relative inline-block">И<span className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white"></span></span>БЕРЫ
              </span>
              <span className="ml-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-vibery-slate">
                DESKTOP
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-vibery-accentGreen animate-pulse" title="Все почтовые шлюзы активны"></div>
          </div>

          {/* Unified Mailbox Status Pill */}
          <div className="p-3">
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-vibery-surface border-white/5' : 'bg-white border-zinc-200'} flex items-center justify-between text-xs`}>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-vibery-dark"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-vibery-dark"></span>
                </div>
                <div>
                  <div className="font-bold text-[11px] leading-tight">Общий инбокс</div>
                  <div className="text-[9px] text-vibery-slate font-mono">Gmail + Яндекс</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-vibery-accentGreen font-semibold">12ms</span>
            </div>
          </div>

          {/* Channels Navigation List */}
          <div className="px-3 py-1 space-y-1">
            <span className="text-[9px] font-mono uppercase text-vibery-slate tracking-wider px-2">
              КАНАЛЫ ПОТОКА
            </span>
            {channels.map((ch) => {
              const isActive = selectedCategory === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => onSelectCategory(ch.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                    isActive
                      ? 'bg-white text-black font-bold shadow-sm'
                      : isDarkMode
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                      : 'text-zinc-600 hover:text-black hover:bg-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <i className={`ph-bold ph-${ch.icon} text-sm`}></i>
                    <span>{ch.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-black/10 text-black font-black'
                        : 'bg-white/10 text-zinc-400'
                    }`}
                  >
                    {ch.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Rail Controls */}
        <div className="p-3 border-t border-white/5 space-y-1 text-xs">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition"
          >
            <i className="ph-bold ph-gear text-sm"></i>
            <span>Почтовые аккаунты</span>
          </button>

          <button
            onClick={() => setShowTelemetryModal(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition"
          >
            <i className="ph-bold ph-chart-line-up text-sm"></i>
            <span>Телеметрия & Метрики</span>
          </button>

          <div className="pt-2 flex items-center justify-between px-2">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white text-xs"
              title="Переключить тему"
            >
              <i className={isDarkMode ? 'ph-bold ph-moon' : 'ph-bold ph-sun'}></i>
            </button>
            <button
              onClick={onSwitchToMobile}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-vibery-slate hover:text-white text-xs font-mono"
              title="Переключить в режим телефона"
            >
              <i className="ph-bold ph-device-mobile"></i>
              <span>Мобильный вид</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================= PANE 2: CONVERSATIONS FEED (340px) ================= */}
      <section className={`w-80 md:w-96 border-r ${isDarkMode ? 'border-vibery-border bg-vibery-dark/70' : 'border-zinc-300 bg-white'} flex flex-col flex-shrink-0 z-10`}>
        {/* Search header */}
        <div className="p-3.5 border-b border-white/5 flex-shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold tracking-tight">Переписки</span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
              <span className="bg-white/10 px-1.5 py-0.5 rounded">Ctrl</span>
              <span>+</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded">K</span>
            </div>
          </div>

          {/* Search Input */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isDarkMode ? 'bg-vibery-surface border-white/5' : 'bg-zinc-100 border-zinc-200'} text-xs`}>
            <i className="ph-bold ph-magnifying-glass text-zinc-500 text-sm"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по человеку, теме или тексту..."
              className="bg-transparent outline-none flex-1 text-xs placeholder-zinc-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white">
                <i className="ph-bold ph-x text-xs"></i>
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 text-sm">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              Нет диалогов в этом разделе
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeConversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition relative group ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-vibery-surface border-l-2 border-white'
                        : 'bg-zinc-100 border-l-2 border-black'
                      : isDarkMode
                      ? 'hover:bg-white/[0.03]'
                      : 'hover:bg-zinc-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 mt-0.5">
                    {conv.contact.avatarUrl ? (
                      <img
                        src={conv.contact.avatarUrl}
                        className="w-11 h-11 rounded-full object-cover border border-white/10"
                        alt={conv.contact.displayName}
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border border-white/10"
                        style={{
                          backgroundColor: conv.contact.serviceBrandColor
                            ? `${conv.contact.serviceBrandColor}25`
                            : 'rgba(255,255,255,0.1)',
                          color: conv.contact.serviceBrandColor || '#FFF',
                        }}
                      >
                        {conv.contact.serviceIconName ? (
                          <i className={`ph-bold ph-${conv.contact.serviceIconName}`}></i>
                        ) : (
                          conv.contact.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                    )}
                    {conv.category === 'human' && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-vibery-accentGreen border-2 border-vibery-dark"></span>
                    )}
                  </div>

                  {/* Body preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`font-bold truncate text-[13px] ${isSelected ? 'text-white' : ''}`}>
                          {conv.contact.displayName}
                        </span>
                        {conv.contact.isService && (
                          <i className="ph-fill ph-seal-check text-blue-400 text-xs"></i>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono flex-shrink-0 ml-1">
                        {new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-[11px] text-vibery-slate truncate">
                      {conv.subjectContext}
                    </div>

                    <div className="text-xs text-zinc-400 truncate mt-0.5">
                      {conv.lastMessageSnippet}
                    </div>
                  </div>

                  {/* Actions & Provider Badge */}
                  <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      {conv.providerBadge}
                    </span>

                    {/* Quick archive button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-vibery-blue transition p-1 text-sm"
                      title="Архивировать диалог"
                    >
                      <i className="ph-bold ph-archive-box"></i>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ================= PANE 3: CHAT CANVAS (FLEX-1) ================= */}
      <main className="flex-1 flex flex-col h-full bg-vibery-dark min-w-0">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-vibery-dark/90 backdrop-blur flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  {activeConversation.contact.avatarUrl ? (
                    <img
                      src={activeConversation.contact.avatarUrl}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                      alt={activeConversation.contact.displayName}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-white">
                      {activeConversation.contact.displayName.charAt(0)}
                    </div>
                  )}
                  {activeConversation.category === 'human' && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-vibery-accentGreen border border-vibery-dark"></span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white truncate">
                      {activeConversation.contact.displayName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-400 uppercase">
                      {activeConversation.providerBadge}
                    </span>
                  </div>
                  <div className="text-[11px] text-vibery-slate font-mono truncate">
                    {activeConversation.contact.primaryEmail}
                    {activeConversation.contact.organization && ` • ${activeConversation.contact.organization}`}
                  </div>
                </div>
              </div>

              {/* Chat Header Actions */}
              <div className="flex items-center gap-3 text-zinc-400">
                <button
                  onClick={() => onArchiveConversation(activeConversation.id)}
                  className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition"
                  title="Архивировать"
                >
                  <i className="ph-bold ph-archive-box text-lg"></i>
                </button>
                <button
                  onClick={() => onMarkAsRead(activeConversation.id)}
                  className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition"
                  title="Отметить прочитанным"
                >
                  <i className="ph-bold ph-envelope-open text-lg"></i>
                </button>
                <button
                  onClick={() => setShowDossier(!showDossier)}
                  className={`p-2 rounded-xl transition ${
                    showDossier ? 'bg-white text-black' : 'hover:bg-white/5 hover:text-white'
                  }`}
                  title="Показать досье контакта"
                >
                  <i className="ph-bold ph-sidebar-simple text-lg"></i>
                </button>
              </div>
            </div>

            {/* Topic Context Subheader Bar */}
            <div className="bg-white/[0.02] px-6 py-2 flex items-center justify-between text-xs text-zinc-400 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2 truncate">
                <i className="ph-bold ph-tag text-zinc-500"></i>
                <span className="font-medium text-white truncate">
                  Тема: {activeConversation.subjectContext}
                </span>
              </div>
              <span className="font-mono text-zinc-500 flex-shrink-0 ml-4">
                {messages.length} сообщений в треде
              </span>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="flex justify-center">
                <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-3 py-1 rounded-full">
                  Сегодня, 27 октября
                </span>
              </div>

              {messages.map((msg) => {
                const isQuoteOpen = expandedQuotes[msg.id];
                if (msg.isOutgoing) {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[75%] bg-white text-black font-medium rounded-2xl rounded-tr-sm p-4 shadow-lg">
                        <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.cleanBody}</p>
                        <div className="flex items-center justify-end gap-1.5 text-[10px] text-zinc-600 font-mono mt-1.5">
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <i className="ph-bold ph-checks text-sm text-blue-600"></i>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex items-start gap-3 max-w-[80%]">
                    <div className="bg-vibery-surface border border-white/5 rounded-2xl rounded-tl-sm p-4 text-zinc-200 space-y-2.5">
                      <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.cleanBody}</p>

                      {/* Attachments Card */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="bg-black/50 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-4 hover:border-white/20 transition"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs flex-shrink-0 font-mono">
                                  {att.category.toUpperCase()}
                                </div>
                                <div className="truncate">
                                  <div className="text-xs font-semibold text-white truncate">{att.filename}</div>
                                  <div className="text-[10px] font-mono text-zinc-400">
                                    {(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB • Документ
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => alert(`Скачивание файла: ${att.filename}`)}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs font-mono flex items-center gap-1.5 flex-shrink-0"
                              >
                                <i className="ph-bold ph-download-simple"></i>
                                <span>Скачать</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quotes Accordion */}
                      {msg.collapsedQuote && (
                        <div className="pt-1">
                          <button
                            onClick={() => toggleQuote(msg.id)}
                            className="text-[11px] font-mono text-vibery-slate hover:text-white flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md transition"
                          >
                            <i className={isQuoteOpen ? 'ph-bold ph-caret-down' : 'ph-bold ph-caret-right'}></i>
                            <span>{isQuoteOpen ? 'Скрыть историю цитирования' : '··· 1 цитата'}</span>
                          </button>
                          {isQuoteOpen && (
                            <div className="mt-2 p-3 bg-black/60 border border-white/5 rounded-xl text-[11px] font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed">
                              {msg.collapsedQuote}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1.5 text-[10px] font-mono text-zinc-500 mt-1">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="uppercase">{msg.provider}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick replies chips */}
            <div className="px-6 py-2 flex items-center gap-2 overflow-x-auto bg-vibery-dark/80 border-t border-white/5 flex-shrink-0">
              <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Быстрый ответ:</span>
              {['👍 Принято, смотрю', '📁 Сохранить в проект', 'Подтверждаю правки'].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(chip)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white px-3 py-1 rounded-full transition border border-white/5 whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Desktop Composer */}
            <div className="p-4 bg-vibery-surface/80 border-t border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3 bg-vibery-dark border border-white/10 rounded-2xl p-2.5">
                <button
                  onClick={() => alert('Прикрепить вложение')}
                  className="text-zinc-400 hover:text-white text-lg p-1"
                  title="Прикрепить файл"
                >
                  <i className="ph-bold ph-paperclip"></i>
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Быстрый ответ письмом (Enter для отправки)..."
                  className="bg-transparent text-sm text-white placeholder-zinc-500 flex-1 outline-none px-2"
                />
                <button
                  onClick={() => alert('Голосовая заметка')}
                  className="text-zinc-400 hover:text-white text-lg p-1"
                  title="Голосовой ввод"
                >
                  <i className="ph-bold ph-microphone"></i>
                </button>
                <button
                  onClick={handleSend}
                  className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition flex-shrink-0"
                >
                  <span>Отправить</span>
                  <i className="ph-bold ph-paper-plane-right"></i>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <i className="ph-bold ph-chats-circle text-5xl mb-2"></i>
            <span className="text-sm">Выберите диалог слева для просмотра</span>
          </div>
        )}
      </main>

      {/* ================= PANE 4: COLLAPSIBLE CONTACT DOSSIER (320px) ================= */}
      {showDossier && activeContact && (
        <aside className={`w-80 border-l ${isDarkMode ? 'border-vibery-border bg-vibery-dark' : 'border-zinc-300 bg-white'} flex flex-col flex-shrink-0 z-10 overflow-y-auto`}>
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-vibery-slate">
              ДОСЬЕ КОНТАКТА
            </span>
            <button
              onClick={() => setShowDossier(false)}
              className="text-zinc-400 hover:text-white p-1 text-base"
            >
              <i className="ph-bold ph-x"></i>
            </button>
          </div>

          {/* Contact Hero */}
          <div className="p-6 text-center border-b border-white/5">
            <div className="relative inline-block">
              {activeContact.avatarUrl ? (
                <img
                  src={activeContact.avatarUrl}
                  className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-white/20 shadow-xl"
                  alt={activeContact.displayName}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-2xl border-2 border-white/20 mx-auto">
                  {activeContact.displayName.charAt(0)}
                </div>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-3">{activeContact.displayName}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeContact.role ? `${activeContact.role} • ` : ''}
              {activeContact.organization || 'Личный контакт'}
            </p>
          </div>

          {/* Linked aliases */}
          <div className="p-4 border-b border-white/5 space-y-2">
            <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider block">
              СВЯЗАННЫЕ ПОЧТОВЫЕ АДРЕСА
            </span>
            {activeContact.linkedEmails.map((link, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-vibery-surface border border-white/5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-[11px] truncate">{link.email}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    link.isPrimary ? 'bg-blue-500/20 text-blue-400 font-bold' : 'bg-white/5 text-zinc-400'
                  }`}>
                    {link.isPrimary ? 'ОСНОВНОЙ' : 'ALIAS'}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400">{link.label}</div>
              </div>
            ))}
          </div>

          {/* Shared files */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider">
                ВЛОЖЕНИЯ В ТРЕДЕ ({sharedAttachments.length || 3})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-black/50 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/30 transition">
                <i className="ph-bold ph-file-pdf text-red-400 text-lg"></i>
                <span className="text-[9px] text-zinc-300 truncate w-full mt-1">Pitch_Deck.pdf</span>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/30 transition">
                <i className="ph-bold ph-file-archive text-amber-400 text-lg"></i>
                <span className="text-[9px] text-zinc-300 truncate w-full mt-1">Icons_svg.zip</span>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/30 transition">
                <i className="ph-bold ph-file-doc text-blue-400 text-lg"></i>
                <span className="text-[9px] text-zinc-300 truncate w-full mt-1">Brief_v2.docx</span>
              </div>
            </div>
          </div>

          {/* History Stats */}
          <div className="p-4 text-xs space-y-2">
            <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider block">
              СТАТИСТИКА ОБЩЕНИЯ
            </span>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-zinc-400">
                <span>Первый контакт:</span>
                <span className="text-white font-mono">{activeContact.firstContactDate}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Сообщений:</span>
                <span className="text-white font-mono">{activeContact.totalMessagesExchanged}</span>
              </div>
              {activeContact.avgResponseTimeMinutes && (
                <div className="flex justify-between text-zinc-400">
                  <span>Средний ответ:</span>
                  <span className="text-vibery-accentGreen font-mono font-bold">
                    ~{activeContact.avgResponseTimeMinutes} мин
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ================= SETTINGS MODAL ================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-vibery-surface border border-vibery-border rounded-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white">Управление почтовыми аккаунтами</h2>
              <button onClick={() => setShowSettingsModal(false)} className="text-zinc-400 hover:text-white">
                <i className="ph-bold ph-x text-lg"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-3 rounded-xl bg-vibery-dark border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm">
                      {acc.provider === 'gmail' ? 'G' : 'Я'}
                    </span>
                    <div>
                      <div className="font-bold text-white text-xs">{acc.email}</div>
                      <div className="text-[10px] text-emerald-400">Синхронизировано ({acc.latencyMs}ms)</div>
                    </div>
                  </div>
                  <i className="ph-bold ph-check text-emerald-400 text-base"></i>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TELEMETRY MODAL ================= */}
      {showTelemetryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-vibery-surface border border-vibery-border rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-vibery-accentGreen animate-pulse"></span>
                <span>Телеметрия системы (Zero-PII)</span>
              </h2>
              <button onClick={() => setShowTelemetryModal(false)} className="text-zinc-400 hover:text-white">
                <i className="ph-bold ph-x text-lg"></i>
              </button>
            </div>

            {telemetry ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-vibery-dark border border-white/5">
                    <span className="text-[10px] text-zinc-400">p95 Sync Latency</span>
                    <div className="text-xl font-bold text-vibery-accentGreen mt-1">{telemetry.syncLatency.p95Ms} ms</div>
                  </div>
                  <div className="p-3 rounded-xl bg-vibery-dark border border-white/5">
                    <span className="text-[10px] text-zinc-400">Сжатие канцелярита</span>
                    <div className="text-xl font-bold text-white mt-1">~{Math.round(telemetry.averageCleanRatio * 100)}%</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-vibery-dark border border-white/5 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Событий зарегистрировано:</span>
                    <span className="text-white">{telemetry.totalEventsLogged}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Быстрые ответы (Chips):</span>
                    <span className="text-white">{telemetry.gestureActionCounts.quick_reply || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 font-mono text-xs">Загрузка данных...</div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowTelemetryModal(false)}
                className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
