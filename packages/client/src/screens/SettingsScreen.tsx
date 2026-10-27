import React, { useState } from 'react';
import { AccountSyncStatus } from '../types';

interface SettingsScreenProps {
  accounts: AccountSyncStatus[];
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ accounts }) => {
  const [stripFooters, setStripFooters] = useState(true);
  const [crossSubjectThreads, setCrossSubjectThreads] = useState(true);
  const [zeroKnowledge, setZeroKnowledge] = useState(true);

  return (
    <div className="flex flex-col h-full bg-vibery-dark text-white select-none">
      {/* Header */}
      <div className="px-5 pt-3 pb-3 flex-shrink-0">
        <span className="text-2xl font-black tracking-tight">Настройки</span>
        <p className="text-xs text-vibery-slate mt-0.5">Управление почтовыми шлюзами и приватностью</p>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 text-xs pb-4">
        {/* Block 1: Connected Mailboxes */}
        <div>
          <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider">
            ПОДКЛЮЧЕННЫЕ АККАУНТЫ
          </span>
          <div className="mt-2 space-y-2">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3 rounded-xl bg-vibery-surface border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      acc.provider === 'gmail'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-yellow-400/10 text-yellow-500'
                    }`}
                  >
                    {acc.provider === 'gmail' ? 'G' : 'Я'}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{acc.email}</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Синхронизировано ({acc.latencyMs}ms)</span>
                    </div>
                  </div>
                </div>
                <i className="ph-bold ph-check text-emerald-400 text-sm"></i>
              </div>
            ))}

            <button
              onClick={() => alert('Окно добавления учетной записи OAuth / IMAP')}
              className="w-full py-2 border border-dashed border-white/20 hover:border-white/40 rounded-xl text-zinc-400 hover:text-white transition flex items-center justify-center gap-1.5 text-[11px]"
            >
              <i className="ph-bold ph-plus"></i> Подключить Mail.ru / IMAP
            </button>
          </div>
        </div>

        {/* Block 2: Messenger Behavior Preferences */}
        <div>
          <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider">
            ПОВЕДЕНИЕ МЕССЕНДЖЕРА
          </span>
          <div className="mt-2 rounded-xl bg-vibery-surface border border-white/5 divide-y divide-white/5">
            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-xs">Срезать подписи и приветствия</div>
                <div className="text-[10px] text-zinc-400">Скрывать "С уважением..." в письмах</div>
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
                <div className="font-medium text-white text-xs">Свайп влево</div>
                <div className="text-[10px] text-zinc-400">Архивировать диалог</div>
              </div>
              <span className="text-[10px] font-mono text-vibery-slate">Архив &gt;</span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-xs">Сквозные треды без тем</div>
                <div className="text-[10px] text-zinc-400">Объединять разные письма контакта</div>
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
          </div>
        </div>

        {/* Block 3: Security & Zero Knowledge Privacy */}
        <div>
          <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider">
            БЕЗОПАСНОСТЬ И ШИФРОВАНИЕ
          </span>
          <div className="mt-2 rounded-xl bg-vibery-surface border border-white/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-xs">Zero-Knowledge режим</div>
                <div className="text-[10px] text-zinc-400">Письма не сохраняются на сервере</div>
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
            <div className="text-[10px] text-zinc-400 leading-relaxed pt-1">
              Все токены зашифрованы AES-256-GCM с защитой от подделки (AEAD). Тексты писем кэшируются исключительно в зашифрованной локальной SQLite базе на телефоне.
            </div>
          </div>
        </div>

        {/* Privacy Note Badge */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-zinc-400 flex items-start gap-2">
          <i className="ph-bold ph-shield-check text-emerald-400 text-sm mt-0.5 flex-shrink-0"></i>
          <span>
            Все письма передаются напрямую между вашим устройством и серверами Google/Yandex без промежуточного сохранения на наших серверах.
          </span>
        </div>
      </div>
    </div>
  );
};
