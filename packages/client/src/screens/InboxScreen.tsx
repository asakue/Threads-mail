import React, { useState } from 'react';
import { Conversation } from '../types';

interface InboxScreenProps {
  conversations: Conversation[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenConversation: (conv: Conversation) => void;
  onArchiveConversation: (convId: string) => void;
  onNavigateTab: (tab: 'inbox' | 'dialog' | 'contact' | 'categories' | 'settings') => void;
}

export const InboxScreen: React.FC<InboxScreenProps> = ({
  conversations,
  selectedCategory,
  onSelectCategory,
  onOpenConversation,
  onArchiveConversation,
  onNavigateTab,
}) => {
  const [swipedConvId, setSwipedConvId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Все' },
    { id: 'human', label: 'Люди' },
    { id: 'service', label: 'Сервисы' },
    { id: 'receipt', label: 'Чеки' },
    { id: 'action', label: 'Требуют ответа' },
  ];

  return (
    <div className="flex flex-col h-full bg-vibery-dark text-white select-none">
      {/* Top Header */}
      <div className="px-5 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight">Чаты</span>
            {/* Unified Mailbox pill */}
            <div className="flex items-center gap-1.5 text-[10px] bg-white/10 border border-white/10 px-2 py-0.5 rounded-full font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
              <span className="text-zinc-300">Gmail + Яндекс</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-lg text-zinc-400">
            <button className="hover:text-white transition"><i className="ph-bold ph-magnifying-glass"></i></button>
            <button className="hover:text-white transition"><i className="ph-bold ph-note-pencil"></i></button>
          </div>
        </div>

        {/* Quick Categories Filter Chips */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto text-[11px] pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/10 text-zinc-300 hover:text-white border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Swipe instructions hint */}
      <div className="px-5 py-1 text-[10px] text-vibery-slate flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
        <span>Свайп влево — архив диалога</span>
        <span className="font-mono">{conversations.length} переписок</span>
      </div>

      {/* Dialogs / Thread List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 text-sm">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            В этой категории нет писем
          </div>
        ) : (
          conversations.map((conv) => {
            const isSwiped = swipedConvId === conv.id;
            return (
              <div key={conv.id} className="relative overflow-hidden group">
                {/* Swipe Underlayer (Archive Action) */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchiveConversation(conv.id);
                    setSwipedConvId(null);
                  }}
                  className="absolute inset-0 bg-vibery-blue flex items-center justify-end px-5 text-white text-xs font-semibold cursor-pointer z-0"
                >
                  <i className="ph-bold ph-archive-box text-lg mr-1"></i> Архив
                </div>

                {/* Card Foreground Item */}
                <div
                  onClick={() => onOpenConversation(conv)}
                  style={{
                    transform: isSwiped ? 'translateX(-75px)' : 'translateX(0)',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="relative bg-vibery-dark p-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/5 z-10"
                >
                  {/* Left Avatar */}
                  <div className="relative flex-shrink-0">
                    {conv.contact.avatarUrl ? (
                      <img
                        src={conv.contact.avatarUrl}
                        className="w-12 h-12 rounded-full object-cover border border-white/10"
                        alt={conv.contact.displayName}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base border border-white/10"
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
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-vibery-accentGreen border-2 border-vibery-dark"></span>
                    )}
                  </div>

                  {/* Middle Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-white truncate text-[13px]">
                          {conv.contact.displayName}
                        </span>
                        {conv.contact.isService && (
                          <i className="ph-fill ph-seal-check text-blue-400 text-xs flex-shrink-0"></i>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-[11px] text-vibery-slate truncate">
                      {conv.subjectContext}
                    </div>

                    <div className="text-xs text-zinc-300 truncate mt-0.5">
                      {conv.lastMessageSnippet}
                    </div>
                  </div>

                  {/* Right Badges & Swipe Toggle */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {conv.unreadCount > 0 ? (
                      <span className="w-2 h-2 rounded-full bg-vibery-blue"></span>
                    ) : (
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">
                        {conv.providerBadge}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSwipedConvId(isSwiped ? null : conv.id);
                      }}
                      className="text-zinc-500 hover:text-white p-1 text-xs"
                      title="Симуляция свайпа"
                    >
                      <i className={isSwiped ? 'ph-bold ph-caret-right' : 'ph-bold ph-caret-left'}></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Messenger Tab Bar */}
      <div className="border-t border-white/10 bg-vibery-dark/95 backdrop-blur px-6 py-2.5 flex items-center justify-between text-xs text-zinc-400 flex-shrink-0">
        <div
          onClick={() => onNavigateTab('inbox')}
          className="flex flex-col items-center text-white font-medium cursor-pointer"
        >
          <i className="ph-fill ph-chats-circle text-lg"></i>
          <span className="text-[10px] mt-0.5">Чаты</span>
        </div>
        <div
          onClick={() => onNavigateTab('categories')}
          className="flex flex-col items-center hover:text-white transition cursor-pointer"
        >
          <i className="ph-bold ph-funnel text-lg"></i>
          <span className="text-[10px] mt-0.5">Фильтры</span>
        </div>
        <div
          onClick={() => onNavigateTab('contact')}
          className="flex flex-col items-center hover:text-white transition cursor-pointer"
        >
          <i className="ph-bold ph-address-book text-lg"></i>
          <span className="text-[10px] mt-0.5">Контакты</span>
        </div>
        <div
          onClick={() => onNavigateTab('settings')}
          className="flex flex-col items-center hover:text-white transition cursor-pointer"
        >
          <i className="ph-bold ph-gear text-lg"></i>
          <span className="text-[10px] mt-0.5">Настройки</span>
        </div>
      </div>
    </div>
  );
};
