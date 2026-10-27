import React from 'react';
import { AccountSyncStatus } from '../types';

interface AppSidebarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categoryCounts: Record<string, number>;
  accounts: AccountSyncStatus[];
  onOpenSettings: () => void;
  onOpenCompose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  accounts,
  onOpenSettings,
  onOpenCompose,
  isDarkMode,
  onToggleTheme,
}) => {
  const channels = [
    { id: 'all', label: 'Все входящие', icon: 'tray', count: categoryCounts.all || 0 },
    { id: 'human', label: 'Люди и Команда', icon: 'users', count: categoryCounts.human || 0 },
    { id: 'service', label: 'Сервисы и боты', icon: 'bell-simple-ringing', count: categoryCounts.service || 0 },
    { id: 'receipt', label: 'Чеки и Финансы', icon: 'receipt', count: categoryCounts.receipt || 0 },
    { id: 'action', label: 'Требуют ответа', icon: 'check-square-offset', count: categoryCounts.action || 0 },
  ];

  const allSynced = accounts.length > 0 && accounts.every((a) => a.status === 'synced');

  return (
    <aside className="w-64 border-r border-vibery-border bg-vibery-dark flex flex-col justify-between flex-shrink-0 z-20 select-none">
      {/* Top: Brand Header & New Message button */}
      <div>
        {/* Brand */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-xl font-black tracking-tight font-mono uppercase inline-flex items-baseline text-white">
              ВА<span className="relative inline-block">И<span className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white"></span></span>БЕРЫ
            </span>
          </div>

          <button
            onClick={onOpenCompose}
            className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center hover:opacity-90 transition shadow-md"
            title="Новое сообщение (Написать письмо)"
          >
            <i className="ph-bold ph-note-pencil text-base"></i>
          </button>
        </div>

        {/* Mailboxes Status Pill */}
        <div className="p-3">
          <div
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl border border-white/5 bg-vibery-surface hover:border-white/10 transition cursor-pointer flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-vibery-dark"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-vibery-dark"></span>
              </div>
              <div>
                <div className="font-bold text-[11px] leading-tight text-white">Gmail + Яндекс</div>
                <div className="text-[9px] text-vibery-slate font-mono">
                  {allSynced ? 'Синхронизировано' : 'Обновление...'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-vibery-accentGreen animate-pulse"></span>
              <span className="text-[10px] font-mono text-zinc-400">12ms</span>
            </div>
          </div>
        </div>

        {/* Channels Navigation List */}
        <div className="px-3 py-1 space-y-1">
          <span className="text-[9px] font-mono uppercase text-vibery-slate tracking-wider px-2 block mb-1">
            КАТЕГОРИИ
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
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <i className={`ph-bold ph-${ch.icon} text-sm`}></i>
                  <span>{ch.label}</span>
                </div>
                {ch.count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-black/15 text-black font-black'
                        : 'bg-white/10 text-zinc-400'
                    }`}
                  >
                    {ch.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-3 border-t border-white/5 space-y-1 text-xs">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-2.5">
            <i className="ph-bold ph-gear text-sm"></i>
            <span>Настройки & Ящики</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">2 акк.</span>
        </button>

        <div className="pt-2 flex items-center justify-between px-2">
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white text-xs transition"
          >
            <i className={isDarkMode ? 'ph-bold ph-moon' : 'ph-bold ph-sun'}></i>
            <span className="text-[10px] font-mono">{isDarkMode ? 'Dark' : 'Light'}</span>
          </button>

          <span className="text-[9px] font-mono text-zinc-600">v1.0 // PROD</span>
        </div>
      </div>
    </aside>
  );
};
