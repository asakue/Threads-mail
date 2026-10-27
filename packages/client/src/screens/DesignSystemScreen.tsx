import React from 'react';
import { TelemetryStats } from '../types';

interface DesignSystemScreenProps {
  telemetry: TelemetryStats | null;
}

export const DesignSystemScreen: React.FC<DesignSystemScreenProps> = ({ telemetry }) => {
  return (
    <div className="flex flex-col h-full bg-vibery-dark text-white select-none p-5 overflow-y-auto space-y-5 text-xs">
      {/* Brand mark specimen */}
      <div className="border-b border-white/10 pb-4">
        <span className="text-[9px] font-mono text-vibery-slate uppercase tracking-widest">
          // MASTER WORDMARK
        </span>
        <div className="mt-2 text-2xl font-black tracking-tight text-white font-mono uppercase inline-flex items-baseline">
          ВА<span className="relative inline-block">И<span className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white"></span></span>БЕРЫ
        </div>
        <p className="text-[10px] text-zinc-400 mt-1">
          Швейцарский плотный гротеск + авторская геометрия над буквой «Й».
        </p>
      </div>

      {/* Color Palette Swatches */}
      <div className="border-b border-white/10 pb-4">
        <span className="text-[9px] font-mono text-vibery-slate uppercase tracking-widest">
          // ЦВЕТОВЫЕ ТОКЕНЫ
        </span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="p-2 rounded-lg bg-[#0D0D0E] border border-white/10">
            <div className="text-[10px] font-bold">#0D0D0E</div>
            <div className="text-[9px] text-zinc-400">Space Onyx</div>
          </div>
          <div className="p-2 rounded-lg bg-[#FFFFFF] text-black border border-white/10">
            <div className="text-[10px] font-bold">#FFFFFF</div>
            <div className="text-[9px] text-zinc-600">Pure White</div>
          </div>
          <div className="p-2 rounded-lg bg-[#1D1D1F] border border-white/10">
            <div className="text-[10px] font-bold">#1D1D1F</div>
            <div className="text-[9px] text-zinc-400">Card Surface</div>
          </div>
          <div className="p-2 rounded-lg bg-[#0071E3] text-white">
            <div className="text-[10px] font-bold">#0071E3</div>
            <div className="text-[9px] text-white/80">Focus Accent</div>
          </div>
        </div>
      </div>

      {/* Typography Hierarchy */}
      <div className="border-b border-white/10 pb-4">
        <span className="text-[9px] font-mono text-vibery-slate uppercase tracking-widest">
          // ТИПОГРАФИКА
        </span>
        <div className="mt-2 space-y-1.5 font-sans">
          <div className="text-lg font-black tracking-tight leading-none">Title Large 24px</div>
          <div className="text-sm font-bold text-zinc-200">Headline Bold 14px</div>
          <div className="text-xs font-normal text-zinc-400">Body Regular 12px (Inter)</div>
          <div className="text-[10px] font-mono text-vibery-slate">Code & Timestamp 10px (JetBrains Mono)</div>
        </div>
      </div>

      {/* Live Observability / Analytics Telemetry Panel */}
      <div>
        <span className="text-[9px] font-mono text-vibery-accentGreen uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-vibery-accentGreen animate-pulse"></span>
          <span>LIVE TELEMETRY (ZERO PII OBSERVABILITY)</span>
        </span>
        
        {telemetry ? (
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-vibery-surface border border-white/5">
                <span className="text-[10px] text-zinc-400">p95 Sync Latency</span>
                <div className="text-base font-bold text-vibery-accentGreen font-mono mt-0.5">
                  {telemetry.syncLatency.p95Ms} ms
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-vibery-surface border border-white/5">
                <span className="text-[10px] text-zinc-400">Срезка шума</span>
                <div className="text-base font-bold text-white font-mono mt-0.5">
                  ~{Math.round(telemetry.averageCleanRatio * 100)}%
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-vibery-surface border border-white/5 space-y-1 font-mono text-[10px]">
              <div className="flex justify-between text-zinc-400">
                <span>Всего событий:</span>
                <span className="text-white">{telemetry.totalEventsLogged}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Свайпы (Архив / Прочтение):</span>
                <span className="text-white">
                  {telemetry.gestureActionCounts.archive_swipe || 0} / {telemetry.gestureActionCounts.read_swipe || 0}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Быстрые ответы (Chips):</span>
                <span className="text-white">{telemetry.gestureActionCounts.quick_reply || 0}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 p-3 rounded-xl bg-vibery-surface text-zinc-500 font-mono text-[10px]">
            Загрузка телеметрических метрик...
          </div>
        )}
      </div>
    </div>
  );
};
