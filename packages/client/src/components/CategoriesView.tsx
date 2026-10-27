import React from 'react';

interface CategoriesViewProps {
  categoryCounts: Record<string, number>;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onClose: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categoryCounts,
  selectedCategory,
  onSelectCategory,
  onClose,
}) => {
  const channels = [
    {
      id: 'all',
      title: 'Все переписки',
      desc: 'Единый поток Gmail и Яндекс',
      icon: 'tray',
      color: 'bg-white/10 text-white',
      count: categoryCounts.all || 0,
    },
    {
      id: 'human',
      title: 'Люди и Команда',
      desc: 'Только живые собеседники и коллеги',
      icon: 'users',
      color: 'bg-vibery-blue/20 text-vibery-blue',
      count: categoryCounts.human || 0,
    },
    {
      id: 'service',
      title: 'Сервисы и боты',
      desc: 'GitHub, Figma, Notion, Sentry',
      icon: 'bell-simple-ringing',
      color: 'bg-purple-500/20 text-purple-400',
      count: categoryCounts.service || 0,
    },
    {
      id: 'receipt',
      title: 'Чеки и Финансы',
      desc: 'Счета, подписки, чеки ОФД',
      icon: 'receipt',
      color: 'bg-emerald-500/20 text-emerald-400',
      count: categoryCounts.receipt || 0,
    },
    {
      id: 'action',
      title: 'Требуют ответа',
      desc: 'Письма с дедлайнами и вопросами',
      icon: 'check-square-offset',
      color: 'bg-amber-500/20 text-amber-400',
      count: categoryCounts.action || 0,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-vibery-dark text-white select-none p-4 space-y-3 overflow-y-auto">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Категории</h2>
          <p className="text-xs text-vibery-slate">Умная фильтрация почтового потока</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
        >
          <i className="ph-bold ph-x text-lg"></i>
        </button>
      </div>

      <div className="space-y-2.5 pt-1">
        {channels.map((ch) => {
          const isSelected = selectedCategory === ch.id;
          return (
            <div
              key={ch.id}
              onClick={() => {
                onSelectCategory(ch.id);
                onClose();
              }}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-vibery-surface border-white/40 shadow-md'
                  : 'bg-vibery-surface/60 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${ch.color}`}>
                  <i className={`ph-bold ph-${ch.icon}`}></i>
                </div>
                <div>
                  <div className="font-bold text-white text-xs">{ch.title}</div>
                  <div className="text-[10px] text-zinc-400">{ch.desc}</div>
                </div>
              </div>
              <span className="w-6 h-6 rounded-full bg-white/10 text-white font-mono text-xs flex items-center justify-center font-bold">
                {ch.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
