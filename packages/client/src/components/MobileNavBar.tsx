import React from 'react';

interface MobileNavBarProps {
  currentTab: 'inbox' | 'categories';
  onSelectTab: (tab: 'inbox' | 'categories') => void;
  onOpenSettings: () => void;
  onOpenCompose: () => void;
  unreadTotal: number;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  onOpenCompose,
  unreadTotal,
}) => {
  return (
    <nav className="border-t border-white/10 bg-vibery-dark/95 backdrop-blur px-6 py-2 flex items-center justify-between text-xs text-zinc-400 flex-shrink-0 z-30 select-none md:hidden">
      <button
        onClick={() => onSelectTab('inbox')}
        className={`flex flex-col items-center gap-0.5 transition ${
          currentTab === 'inbox' ? 'text-white font-medium' : 'hover:text-white'
        }`}
      >
        <div className="relative">
          <i className="ph-fill ph-chats-circle text-xl"></i>
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-vibery-blue"></span>
          )}
        </div>
        <span className="text-[10px]">Чаты</span>
      </button>

      <button
        onClick={() => onSelectTab('categories')}
        className={`flex flex-col items-center gap-0.5 transition ${
          currentTab === 'categories' ? 'text-white font-medium' : 'hover:text-white'
        }`}
      >
        <i className="ph-bold ph-funnel text-xl"></i>
        <span className="text-[10px]">Категории</span>
      </button>

      <button
        onClick={onOpenCompose}
        className="flex flex-col items-center gap-0.5 text-zinc-300 hover:text-white transition"
      >
        <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md">
          <i className="ph-bold ph-note-pencil text-base"></i>
        </div>
      </button>

      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center gap-0.5 hover:text-white transition"
      >
        <i className="ph-bold ph-gear text-xl"></i>
        <span className="text-[10px]">Настройки</span>
      </button>
    </nav>
  );
};
