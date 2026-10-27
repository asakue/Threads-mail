import React, { useState } from 'react';
import { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conv: Conversation) => void;
  onArchiveConversation: (convId: string) => void;
  onMarkAsRead: (convId: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categoryCounts: Record<string, number>;
  onOpenCompose?: () => void;
  isMobileView?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onArchiveConversation,
  onMarkAsRead,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  onOpenCompose,
  isMobileView = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [swipedConvId, setSwipedConvId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: 'Все' },
    { id: 'human', label: 'Люди' },
    { id: 'service', label: 'Сервисы' },
    { id: 'receipt', label: 'Чеки' },
    { id: 'action', label: 'Требуют ответа' },
  ];

  const filtered = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.contact.displayName.toLowerCase().includes(q) ||
      c.subjectContext.toLowerCase().includes(q) ||
      c.lastMessageSnippet.toLowerCase().includes(q)
    );
  });

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent, convId: string) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent, convId: string) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    if (diff < -50) {
      setSwipedConvId(convId);
    } else if (diff > 30) {
      setSwipedConvId(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

  return (
    <section className="flex flex-col h-full bg-vibery-dark/80 border-r border-vibery-border select-none min-w-0">
      {/* Top Bar / Search */}
      <div className="p-3.5 border-b border-white/5 space-y-2.5 flex-shrink-0">
        {/* Mobile top header if on mobile */}
        {isMobileView && (
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight font-mono uppercase text-white">
                ВА<span className="relative inline-block">И<span className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white"></span></span>БЕРЫ
              </span>
              <div className="flex items-center gap-1 text-[10px] bg-white/10 border border-white/10 px-2 py-0.5 rounded-full font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                <span className="text-zinc-300">Gmail + Яндекс</span>
              </div>
            </div>
            {onOpenCompose && (
              <button
                onClick={onOpenCompose}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:opacity-90 shadow-sm"
              >
                <i className="ph-bold ph-note-pencil text-base"></i>
              </button>
            )}
          </div>
        )}

        {/* Search Input Box */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-vibery-surface text-xs focus-within:border-white/30 transition">
          <i className="ph-bold ph-magnifying-glass text-zinc-500 text-sm flex-shrink-0"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по человеку, теме или тексту..."
            className="bg-transparent outline-none flex-1 text-xs text-white placeholder-zinc-500 min-w-0"
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white">
              <i className="ph-bold ph-x text-xs"></i>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono text-zinc-500">
              <span className="bg-white/10 px-1 py-0.5 rounded">Ctrl</span>
              <span>K</span>
            </div>
          )}
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-0.5 no-scrollbar">
          {categories.map((cat) => {
            const count = categoryCounts[cat.id];
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-white/10 text-zinc-300 hover:text-white border border-white/5'
                }`}
              >
                <span>{cat.label}</span>
                {typeof count === 'number' && count > 0 && cat.id !== 'all' && (
                  <span className={`text-[9px] font-mono ${isSelected ? 'text-black' : 'text-zinc-400'}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 text-sm">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            {searchQuery ? 'Ничего не найдено' : 'В этой категории пока нет писем'}
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = activeConversationId === conv.id;
            const isSwiped = swipedConvId === conv.id;

            return (
              <div
                key={conv.id}
                className="relative overflow-hidden group"
                onTouchStart={(e) => handleTouchStart(e, conv.id)}
                onTouchMove={(e) => handleTouchMove(e, conv.id)}
                onTouchEnd={handleTouchEnd}
              >
                {/* Swipe Action Background (Archive) */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchiveConversation(conv.id);
                    setSwipedConvId(null);
                  }}
                  className="absolute inset-0 bg-vibery-blue flex items-center justify-end px-5 text-white text-xs font-semibold cursor-pointer z-0"
                >
                  <i className="ph-bold ph-archive-box text-lg mr-1.5"></i>
                  <span>Архив</span>
                </div>

                {/* Foreground Conversation Card */}
                <div
                  onClick={() => onSelectConversation(conv)}
                  style={{
                    transform: isSwiped ? 'translateX(-75px)' : 'translateX(0)',
                    transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className={`relative p-3.5 flex items-start gap-3 cursor-pointer transition z-10 ${
                    isSelected
                      ? 'bg-vibery-surface border-l-2 border-white'
                      : 'bg-vibery-dark hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Left Avatar */}
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

                  {/* Center Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`font-bold truncate text-[13px] ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                          {conv.contact.displayName}
                        </span>
                        {conv.contact.isService && (
                          <i className="ph-fill ph-seal-check text-blue-400 text-xs flex-shrink-0"></i>
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

                  {/* Right Status Badges & Quick Action */}
                  <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0">
                    {conv.unreadCount > 0 ? (
                      <span className="w-2 h-2 rounded-full bg-vibery-blue my-0.5"></span>
                    ) : (
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">
                        {conv.providerBadge}
                      </span>
                    )}

                    {/* Quick archive hover icon for mouse users */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition p-1 text-sm hidden sm:block"
                      title="Архивировать"
                    >
                      <i className="ph-bold ph-archive-box"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
