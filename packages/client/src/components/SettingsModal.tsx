import React, { useState } from 'react';
import { AccountSyncStatus, TelemetryStats } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSyncStatus[];
  telemetry: TelemetryStats | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  telemetry,
}) => {
  const [stripFooters, setStripFooters] = useState(true);
  const [crossSubjectThreads, setCrossSubjectThreads] = useState(true);
  const [zeroKnowledge, setZeroKnowledge] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-vibery-surface border border-vibery-border rounded-2xl w-full max-w-lg p-5 md:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight">Настройки и безопасность</h2>
            <p className="text-[11px] text-zinc-400">Управление учетными записями и поведением клиента</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <i className="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        {/* Block 1: Connected Accounts */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider block">
            ПОДКЛЮЧЕННЫЕ ПОЧТОВЫЕ ЯЩИКИ
          </span>
          <div className="space-y-2">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3 rounded-xl bg-vibery-dark border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      acc.provider === 'gmail'
                        ? 'bg-red-500/15 text-red-500'
                        : 'bg-yellow-400/15 text-yellow-500'
                    }`}
                  >
                    {acc.provider === 'gmail' ? 'G' : 'Я'}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{acc.email}</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Синхронизировано ({acc.latencyMs}ms)</span>
                    </div>
                  </div>
                </div>
                <i className="ph-bold ph-check text-emerald-400 text-sm"></i>
              </div>
            ))}

            <button
              onClick={() => alert('Интеграция нового почтового шлюза OAuth2 (Google / Yandex / IMAP)')}
              className="w-full py-2 border border-dashed border-white/20 hover:border-white/40 rounded-xl text-zinc-400 hover:text-white transition flex items-center justify-center gap-2 text-xs"
            >
              <i className="ph-bold ph-plus"></i>
              <span>Подключить еще один аккаунт (Mail.ru / IMAP)</span>
            </button>
          </div>
        </div>

        {/* Block 2: De-clutter & Formatting Preferences */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider block">
            ОЧИСТКА КАНЦЕЛЯРИТА И ЦИТАТ
          </span>
          <div className="rounded-xl bg-vibery-dark border border-white/5 divide-y divide-white/5">
            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-xs">Срезать подписи и приветствия</div>
                <div className="text-[10px] text-zinc-400">Скрывать «С уважением...» и дисклеймеры</div>
              </div>
              <button
                onClick={() => setStripFooters(!stripFooters)}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition ${
                  stripFooters ? 'bg-white justify-end' : 'bg-white/20 justify-start'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${stripFooters ? 'bg-black' : 'bg-white'}`}></div>
              </button>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-xs">Сквозные диалоги без тем</div>
                <div className="text-[10px] text-zinc-400">Объединять все письма контакта в один чат</div>
              </div>
              <button
                onClick={() => setCrossSubjectThreads(!crossSubjectThreads)}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition ${
                  crossSubjectThreads ? 'bg-white justify-end' : 'bg-white/20 justify-start'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${crossSubjectThreads ? 'bg-black' : 'bg-white'}`}></div>
              </button>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-xs">Zero-Knowledge режим</div>
                <div className="text-[10px] text-zinc-400">Письма не сохраняются в облаке бэкенда</div>
              </div>
              <button
                onClick={() => setZeroKnowledge(!zeroKnowledge)}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition ${
                  zeroKnowledge ? 'bg-vibery-accentGreen justify-end' : 'bg-white/20 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Block 3: Live Observability */}
        {telemetry && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase text-vibery-accentGreen tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-vibery-accentGreen animate-pulse"></span>
              <span>ТЕЛЕМЕТРИЯ СИСТЕМЫ (БЕЗ PII)</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-vibery-dark border border-white/5">
                <span className="text-[10px] text-zinc-400">p95 Задержка синка</span>
                <div className="text-base font-bold text-vibery-accentGreen mt-0.5">
                  {telemetry.syncLatency.p95Ms} ms
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-vibery-dark border border-white/5">
                <span className="text-[10px] text-zinc-400">Сжатие мусора</span>
                <div className="text-base font-bold text-white mt-0.5">
                  ~{Math.round(telemetry.averageCleanRatio * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:opacity-90 transition"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
