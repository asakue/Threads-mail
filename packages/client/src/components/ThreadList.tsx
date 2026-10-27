import React, { useState } from 'react';
import { Conversation } from '../types';

interface ThreadListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conv: Conversation) => void;
  onOpenCompose: () => void;
  onOpenSettings: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
}

export const ThreadList: React.FC<ThreadListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenCompose,
  onOpenSettings,
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  const unreadCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const filtered = conversations.filter((c) => {
    if (filterMode === 'unread' && c.unreadCount === 0) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.contact.displayName.toLowerCase().includes(q) ||
      c.contact.primaryEmail.toLowerCase().includes(q) ||
      c.subjectContext.toLowerCase().includes(q) ||
      c.lastMessageSnippet.toLowerCase().includes(q)
    );
  });

  const formatRelativeTime = (timestamp: number) => {
    const diffHours = (Date.now() - timestamp) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffHours < 48) {
      return 'Вчера';
    }
    return new Date(timestamp).toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  // ================= MOBILE VIEW (EDGE-TO-EDGE, RESPONSIVE W-FULL) =================
  if (isMobile) {
    return (
      <aside className="w-full h-full flex flex-col bg-[#0F0F12] select-none min-w-0 overflow-hidden">
        {/* Mobile Header with Safe Area */}
        <div className="pt-[max(1rem,env(safe-area-inset-top,1rem))] px-4 pb-3 border-b border-white/[0.06] flex-shrink-0 space-y-3 bg-[#0F0F12]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-white tracking-tight">Threads</h1>
              {unreadCount > 0 && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-medium">
                  {unreadCount} {unreadCount === 1 ? 'новое' : 'новых'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[#8E8E93]">
              <button
                onClick={onOpenCompose}
                className="w-9 h-9 rounded-xl hover:text-white bg-white/[0.04] active:bg-white/10 transition flex items-center justify-center"
                title="Новое письмо"
              >
                <i className="ph-bold ph-note-pencil text-lg"></i>
              </button>
              <button
                onClick={onOpenSettings}
                className="w-9 h-9 rounded-xl hover:text-white bg-white/[0.04] active:bg-white/10 transition flex items-center justify-center"
                title="Настройки почты"
              >
                <i className="ph-bold ph-gear-six text-lg"></i>
              </button>
            </div>
          </div>

          {/* Search Input (100% width) */}
          <div className="relative w-full">
            <i className="ph-bold ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#71717A]"></i>
            <input
              type="text"
              placeholder="Поиск диалогов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16161A] text-sm text-white placeholder-[#71717A] rounded-xl pl-9 pr-8 py-2.5 border border-white/[0.06] focus:border-white/20 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#71717A] hover:text-white"
              >
                <i className="ph-bold ph-x"></i>
              </button>
            )}
          </div>

          {/* Filter Tabs (100% width) */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#16161A] border border-white/[0.04] text-xs w-full">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1.5 rounded-lg text-center transition font-medium ${
                filterMode === 'all'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`flex-1 py-1.5 rounded-lg text-center transition font-medium flex items-center justify-center gap-1.5 ${
                filterMode === 'unread'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <span>Непрочитанные</span>
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Stream (100% width with top breathing room and bottom safe area) */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] scrollbar-none w-full pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom,1.5rem))]">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-[#71717A] text-sm px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xl text-[#A1A1AA] mx-auto">
                <i className="ph-bold ph-tray"></i>
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {searchQuery ? 'Ничего не найдено' : 'Почтовый ящик пуст'}
                </p>
                <p className="text-xs text-[#71717A] mt-1 max-w-xs mx-auto">
                  {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Здесь будут появляться ваши диалоги и письма'}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={onOpenCompose}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-[#E5E5E7] transition inline-flex items-center gap-1.5"
                >
                  <i className="ph-bold ph-note-pencil text-sm"></i>
                  <span>Написать письмо</span>
                </button>
              )}
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const hasUnread = conv.unreadCount > 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className={`w-full px-4 py-3.5 flex items-center gap-3.5 cursor-pointer active:bg-white/[0.06] transition-colors relative ${
                    isActive ? 'bg-white/[0.04]' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {conv.contact.avatarUrl ? (
                      <img
                        src={conv.contact.avatarUrl}
                        alt={conv.contact.displayName}
                        className="w-11 h-11 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#1C1C22] text-[#E5E5E7] font-medium text-sm flex items-center justify-center border border-white/5">
                        {conv.contact.displayName.charAt(0)}
                      </div>
                    )}
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-white border-2 border-[#0F0F12]"></span>
                    )}
                  </div>

                  {/* Info (Full width) */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm truncate ${
                          hasUnread ? 'font-semibold text-white' : 'font-medium text-[#E5E5E7]'
                        }`}
                      >
                        {conv.contact.displayName}
                      </span>
                      <span className="text-[11px] font-mono text-[#71717A] flex-shrink-0">
                        {formatRelativeTime(conv.lastMessageTimestamp)}
                      </span>
                    </div>

                    <div className="text-xs text-[#A1A1AA] truncate font-medium">
                      {conv.subjectContext}
                    </div>

                    <div className="text-xs text-[#71717A] truncate">
                      {conv.lastMessageSnippet}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    );
  }

  // ================= DESKTOP VIEW (COLLAPSIBLE 68px VS 340px) =================
  return (
    <aside className="w-full h-full flex flex-col bg-[#0F0F12] border-r border-white/[0.07] select-none min-w-0 overflow-hidden relative">
      {/* ================= FIXED-HEIGHT CROSSFADE HEADER ================= */}
      <div className="h-[148px] w-[340px] flex-shrink-0 border-b border-white/[0.06] relative overflow-hidden">
        {/* Layer 1: Collapsed Icon Rail (68px wide) */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-[68px] flex flex-col items-center justify-center gap-1.5 py-2.5 z-20 transition-all duration-200 ease-out ${
            isCollapsed
              ? 'opacity-100 pointer-events-auto scale-100'
              : 'opacity-0 pointer-events-none scale-90'
          }`}
        >
          {/* Expand toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              title="Развернуть меню (Ctrl+B)"
            >
              <i className="ph-bold ph-sidebar-simple text-base rotate-180"></i>
            </button>
          )}

          {/* New message compose */}
          <button
            onClick={onOpenCompose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors"
            title="Новое письмо"
          >
            <i className="ph-bold ph-note-pencil text-base"></i>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors"
            title="Настройки почты"
          >
            <i className="ph-bold ph-gear-six text-base"></i>
          </button>

          {/* Unread badge indicator */}
          {unreadCount > 0 && (
            <div
              className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-white font-medium"
              title={`${unreadCount} непрочитанных`}
            >
              {unreadCount}
            </div>
          )}
        </div>

        {/* Layer 2: Expanded Full Header (340px wide) */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-[340px] p-4 space-y-3 z-10 transition-all duration-200 ease-out ${
            isCollapsed
              ? 'opacity-0 pointer-events-none -translate-x-4'
              : 'opacity-100 pointer-events-auto translate-x-0'
          }`}
        >
          {/* Row 1: Brand & Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold text-white tracking-tight">Threads</h1>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-medium">
                  {unreadCount} {unreadCount === 1 ? 'новое' : 'новых'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[#8E8E93]">
              <button
                onClick={onOpenCompose}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition"
                title="Новое письмо"
              >
                <i className="ph-bold ph-note-pencil text-base"></i>
              </button>
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition"
                title="Настройки почты"
              >
                <i className="ph-bold ph-gear-six text-base"></i>
              </button>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition ml-0.5"
                  title="Свернуть меню (только иконки, Ctrl+B)"
                >
                  <i className="ph-bold ph-sidebar-simple text-base"></i>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Search */}
          <div className="relative">
            <i className="ph-bold ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#71717A]"></i>
            <input
              type="text"
              placeholder="Поиск диалогов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16161A] text-xs text-white placeholder-[#71717A] rounded-xl pl-8 pr-7 py-2 border border-white/[0.06] focus:border-white/20 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#71717A] hover:text-white"
              >
                <i className="ph-bold ph-x"></i>
              </button>
            )}
          </div>

          {/* Row 3: Filter Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#16161A] border border-white/[0.04] text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1 rounded-md text-center transition font-medium ${
                filterMode === 'all'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`flex-1 py-1 rounded-md text-center transition font-medium flex items-center justify-center gap-1.5 ${
                filterMode === 'unread'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <span>Непрочитанные</span>
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================= DIALOGUE STREAM (STABLE 340px LAYOUT WITH BREATHING ROOM) ================= */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-white/[0.03] scrollbar-none w-[340px] pt-2">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[#71717A] text-xs px-4 w-[340px] space-y-2.5">
            {!isCollapsed && (
              <>
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-lg text-[#A1A1AA] mx-auto">
                  <i className="ph-bold ph-tray"></i>
                </div>
                <div>
                  <div className="text-white font-medium text-xs">
                    {searchQuery ? 'Ничего не найдено' : 'Почтовый ящик пуст'}
                  </div>
                  <div className="text-[11px] text-[#71717A] mt-0.5">
                    {searchQuery ? 'Попробуйте другой запрос' : 'Нет активных переписок'}
                  </div>
                </div>
                {!searchQuery && (
                  <button
                    onClick={onOpenCompose}
                    className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-[#E5E5E7] transition inline-flex items-center gap-1.5 mt-1"
                  >
                    <i className="ph-bold ph-note-pencil"></i>
                    <span>Новое письмо</span>
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const hasUnread = conv.unreadCount > 0;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`group cursor-pointer relative flex items-center h-16 w-[340px] transition-colors duration-150 ${
                  isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                }`}
              >
                {/* Active Bar indicator */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-white rounded-r"></div>
                )}

                {/* Left 68px Fixed Avatar Slot: mathematically centered at x=14px, NEVER MOVES */}
                <div className="w-[68px] h-full flex items-center justify-center flex-shrink-0 relative">
                  <div className="relative flex-shrink-0 transition-transform duration-200 group-hover:scale-[1.04]">
                    {conv.contact.avatarUrl ? (
                      <img
                        src={conv.contact.avatarUrl}
                        alt={conv.contact.displayName}
                        className={`w-10 h-10 rounded-full object-cover transition-all duration-200 ${
                          isActive && isCollapsed
                            ? 'ring-2 ring-white shadow-lg'
                            : 'border border-white/10 group-hover:border-white/30'
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full bg-[#1C1C22] text-[#E5E5E7] font-medium text-xs flex items-center justify-center transition-all duration-200 ${
                          isActive && isCollapsed
                            ? 'ring-2 ring-white shadow-lg'
                            : 'border border-white/5 group-hover:border-white/20'
                        }`}
                      >
                        {conv.contact.displayName.charAt(0)}
                      </div>
                    )}

                    {/* Unread dot */}
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#0F0F12]"></span>
                    )}
                  </div>
                </div>

                {/* Right Text Block (from 68px to 340px) - Smooth fade & slide without line wrapping */}
                <div
                  className={`flex-1 min-w-0 pr-4 space-y-0.5 transition-all duration-200 ease-out ${
                    isCollapsed
                      ? 'opacity-0 -translate-x-3 pointer-events-none'
                      : 'opacity-100 translate-x-0'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm truncate whitespace-nowrap ${
                        hasUnread ? 'font-semibold text-white' : 'font-medium text-[#E5E5E7]'
                      }`}
                    >
                      {conv.contact.displayName}
                    </span>
                    <span className="text-[11px] font-mono text-[#71717A] flex-shrink-0 whitespace-nowrap">
                      {formatRelativeTime(conv.lastMessageTimestamp)}
                    </span>
                  </div>

                  <div className="text-xs text-[#A1A1AA] truncate font-medium whitespace-nowrap">
                    {conv.subjectContext}
                  </div>

                  <div className="text-xs text-[#71717A] truncate whitespace-nowrap">
                    {conv.lastMessageSnippet}
                  </div>
                </div>

                {/* Flyout Hover Tooltip when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-[70px] px-3 py-2 bg-[#18181C] border border-white/10 rounded-xl shadow-2xl text-xs text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 ease-out z-50 min-w-[170px] max-w-[260px] translate-x-1 group-hover:translate-x-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white truncate">{conv.contact.displayName}</span>
                      <span className="text-[10px] font-mono text-[#71717A] flex-shrink-0">
                        {formatRelativeTime(conv.lastMessageTimestamp)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A1A1AA] truncate mt-0.5 font-medium">
                      {conv.subjectContext}
                    </div>
                    <div className="text-[11px] text-[#71717A] truncate mt-0.5">
                      {conv.lastMessageSnippet}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
