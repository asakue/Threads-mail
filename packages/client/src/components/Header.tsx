import React from 'react';

interface HeaderProps {
  currentScreen: 'inbox' | 'dialog' | 'contact' | 'categories' | 'settings' | 'design';
  onSelectScreen: (screen: 'inbox' | 'dialog' | 'contact' | 'categories' | 'settings' | 'design') => void;
  isDeviceMode: boolean;
  onToggleDeviceMode: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onSelectScreen,
  isDeviceMode,
  onToggleDeviceMode,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header className="border-b border-vibery-border bg-vibery-dark/95 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Brand / Logo */}
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={() => onSelectScreen('inbox')}
        >
          <span className="text-xl md:text-2xl font-black tracking-tight text-white inline-flex items-baseline font-mono uppercase">
            ВА<span className="relative inline-block">И<span className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white"></span></span>БЕРЫ
          </span>
          <span className="ml-2 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-vibery-slate border border-white/5 hidden sm:inline-block">
            MESSENGER FOR EMAIL
          </span>
        </div>
        <div className="hidden lg:flex items-center text-xs text-vibery-slate gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-vibery-accentGreen animate-pulse"></span>
          <span>GMAIL + YANDEX SYNCED</span>
        </div>
      </div>

      {/* Screen Selector Tabs */}
      <nav className="flex items-center gap-1 bg-vibery-surface p-1 rounded-xl border border-vibery-border text-xs font-medium overflow-x-auto">
        <button
          onClick={() => onSelectScreen('inbox')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            currentScreen === 'inbox' ? 'bg-white text-black font-semibold shadow-sm' : 'text-vibery-slate hover:text-white'
          }`}
        >
          01 // Чаты
        </button>
        <button
          onClick={() => onSelectScreen('dialog')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            currentScreen === 'dialog' ? 'bg-white text-black font-semibold shadow-sm' : 'text-vibery-slate hover:text-white'
          }`}
        >
          02 // Диалог
        </button>
        <button
          onClick={() => onSelectScreen('contact')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            currentScreen === 'contact' ? 'bg-white text-black font-semibold shadow-sm' : 'text-vibery-slate hover:text-white'
          }`}
        >
          03 // Контакт
        </button>
        <button
          onClick={() => onSelectScreen('categories')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            currentScreen === 'categories' ? 'bg-white text-black font-semibold shadow-sm' : 'text-vibery-slate hover:text-white'
          }`}
        >
          04 // Категории
        </button>
        <button
          onClick={() => onSelectScreen('settings')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            currentScreen === 'settings' ? 'bg-white text-black font-semibold shadow-sm' : 'text-vibery-slate hover:text-white'
          }`}
        >
          05 // Аккаунты
        </button>
        <button
          onClick={() => onSelectScreen('design')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            currentScreen === 'design' ? 'bg-white text-black font-semibold shadow-sm' : 'text-vibery-slate hover:text-white'
          }`}
        >
          06 // Дизайн & Метрики
        </button>
      </nav>

      {/* Controls: Shell Toggle + Dark/Light Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleDeviceMode}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-vibery-border bg-vibery-surface hover:bg-white/5 transition text-vibery-slate hover:text-white"
          title="Переключить режим отображения (iPhone frame / Fullscreen)"
        >
          <i className={isDeviceMode ? 'ph-bold ph-device-mobile' : 'ph-bold ph-browsers'}></i>
          <span className="hidden sm:inline">{isDeviceMode ? 'iPhone 16 Pro' : 'Полноэкранный'}</span>
        </button>
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-vibery-border bg-vibery-surface hover:bg-white/5 transition text-vibery-slate hover:text-white"
          title="Сменить тему устройства"
        >
          <i className={isDarkMode ? 'ph-bold ph-moon' : 'ph-bold ph-sun'}></i>
          <span className="hidden sm:inline">{isDarkMode ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </header>
  );
};
