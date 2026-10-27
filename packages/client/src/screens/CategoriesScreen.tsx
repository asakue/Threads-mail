import React from 'react';

interface CategoriesScreenProps {
  categoryCounts: Record<string, number>;
  onSelectCategory: (cat: string) => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  categoryCounts,
  onSelectCategory,
}) => {
  return (
    <div className="flex flex-col h-full bg-vibery-dark text-white select-none">
      {/* Header */}
      <div className="px-5 pt-3 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black tracking-tight">Категории</span>
          <button className="text-zinc-400 hover:text-white text-lg">
            <i className="ph-bold ph-sliders-horizontal"></i>
          </button>
        </div>
        <p className="text-xs text-vibery-slate mt-0.5">Нейросетевая группировка потока писем</p>
      </div>

      {/* 4 Core Channels */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2.5 text-xs">
        {/* Channel 1: Humans */}
        <div
          onClick={() => onSelectCategory('human')}
          className="p-3.5 rounded-2xl bg-vibery-surface border border-white/10 hover:border-white/20 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-vibery-blue/20 text-vibery-blue flex items-center justify-center text-base">
                <i className="ph-bold ph-users"></i>
              </div>
              <div>
                <div className="font-bold text-white text-[13px]">Люди и Команда</div>
                <div className="text-[10px] text-zinc-400">Только живые собеседники</div>
              </div>
            </div>
            <span className="w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px]">
              {categoryCounts.human || 2}
            </span>
          </div>
          {/* Mini preview avatars */}
          <div className="flex items-center gap-1.5 pt-1">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop"
              className="w-6 h-6 rounded-full border border-white/20"
              alt="Avatar"
            />
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop"
              className="w-6 h-6 rounded-full border border-white/20"
              alt="Avatar"
            />
            <span className="text-[10px] text-zinc-500 font-mono ml-1">Алёна, Дмитрий</span>
          </div>
        </div>

        {/* Channel 2: Services */}
        <div
          onClick={() => onSelectCategory('service')}
          className="p-3.5 rounded-2xl bg-vibery-surface border border-white/5 hover:border-white/20 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-base">
                <i className="ph-bold ph-bell-simple-ringing"></i>
              </div>
              <div>
                <div className="font-bold text-white text-[13px]">Сервисы и боты</div>
                <div className="text-[10px] text-zinc-400">GitHub, Figma, Notion, Sentry</div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {categoryCounts.service || 2} новых
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 truncate bg-black/30 p-2 rounded-lg">
            <span className="text-white font-medium">GitHub Enterprise:</span> Build #140 deployed to staging in 38s
          </div>
        </div>

        {/* Channel 3: Receipts & Finance */}
        <div
          onClick={() => onSelectCategory('receipt')}
          className="p-3.5 rounded-2xl bg-vibery-surface border border-white/5 hover:border-white/20 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base">
                <i className="ph-bold ph-receipt"></i>
              </div>
              <div>
                <div className="font-bold text-white text-[13px]">Чеки и Финансы</div>
                <div className="text-[10px] text-zinc-400">Подписки, счета, квитанции</div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Обновлено</span>
          </div>
          <div className="flex justify-between items-center bg-black/30 p-2 rounded-lg text-[11px]">
            <span className="text-zinc-300">Расходы за октябрь:</span>
            <span className="text-emerald-400 font-mono font-bold">14 290 ₽</span>
          </div>
        </div>

        {/* Channel 4: Action items & Deadlines */}
        <div
          onClick={() => onSelectCategory('action')}
          className="p-3.5 rounded-2xl bg-vibery-surface border border-white/5 hover:border-white/20 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base">
                <i className="ph-bold ph-check-square-offset"></i>
              </div>
              <div>
                <div className="font-bold text-white text-[13px]">Требуют ответа</div>
                <div className="text-[10px] text-zinc-400">Письма с дедлайнами и вопросами</div>
              </div>
            </div>
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono flex items-center justify-center text-[10px]">
              {categoryCounts.action || 1}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-3 border-t border-white/10 flex-shrink-0">
        <button
          onClick={() => alert('Создание пользовательского правила классификации')}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition"
        >
          <i className="ph-bold ph-plus"></i> Настроить правила авто-сортировки
        </button>
      </div>
    </div>
  );
};
