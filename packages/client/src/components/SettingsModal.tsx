import React, { useState } from 'react';
import { AccountSyncStatus, TelemetryStats } from '../types';
import { addAccount, deleteAccount } from '../api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSyncStatus[];
  telemetry: TelemetryStats | null;
  onAccountsUpdated?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  telemetry,
  onAccountsUpdated,
}) => {
  const [stripFooters, setStripFooters] = useState(true);
  const [crossSubjectThreads, setCrossSubjectThreads] = useState(true);
  const [zeroKnowledge, setZeroKnowledge] = useState(true);

  // Connect new account form state
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newProvider, setNewProvider] = useState<'gmail' | 'yandex' | 'imap'>('gmail');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setAddError('Укажите корректный email');
      return;
    }
    setIsSubmitting(true);
    setAddError('');
    const res = await addAccount(newEmail.trim(), newProvider);
    setIsSubmitting(false);
    if (res) {
      setNewEmail('');
      setIsAdding(false);
      onAccountsUpdated?.();
    } else {
      setAddError('Не удалось подключить аккаунт');
    }
  };

  const handleRemove = async (id: string) => {
    const ok = await deleteAccount(id);
    if (ok) {
      onAccountsUpdated?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#121216] border border-white/[0.08] rounded-2xl w-full max-w-lg p-5 md:p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">Настройки почты</h2>
            <p className="text-xs text-[#71717A] mt-0.5">Управление подключенными ящиками и чтением</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <i className="ph-bold ph-x text-base"></i>
          </button>
        </div>

        {/* Block 1: Connected Accounts */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-mono uppercase text-[#71717A] tracking-wider block">
            ПОДКЛЮЧЕННЫЕ ПОЧТОВЫЕ ЯЩИКИ
          </span>
          <div className="space-y-2">
            {accounts.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#16161B] border border-white/[0.05] text-center text-xs text-[#71717A]">
                Нет подключенных почтовых ящиков. Добавьте аккаунт для синхронизации.
              </div>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl bg-[#16161B] border border-white/[0.05] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] text-[#D1D1D6] flex items-center justify-center font-mono font-medium text-xs border border-white/5 flex-shrink-0">
                      {acc.provider === 'gmail' ? 'G' : acc.provider === 'yandex' ? 'Я' : 'I'}
                    </div>
                    <div className="truncate min-w-0">
                      <div className="font-medium text-white text-xs truncate">{acc.email}</div>
                      <div className="text-[11px] text-[#71717A] flex items-center gap-1.5 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Синхронизировано ({acc.latencyMs}мс)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-[#A1A1AA] font-mono">Активен</span>
                    <button
                      onClick={() => handleRemove(acc.id)}
                      className="p-1.5 rounded-lg text-[#71717A] hover:text-red-400 hover:bg-white/5 transition"
                      title="Отключить аккаунт"
                    >
                      <i className="ph-bold ph-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Add account form or trigger */}
            {isAdding ? (
              <form onSubmit={handleCreateAccount} className="p-3 rounded-xl bg-[#16161B] border border-white/10 space-y-2.5">
                <div className="text-xs font-semibold text-white">Подключение нового ящика</div>
                {addError && <div className="text-[11px] text-red-400">{addError}</div>}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="flex-1 bg-[#121216] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                  <select
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value as any)}
                    className="bg-[#121216] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="gmail">Gmail</option>
                    <option value="yandex">Яндекс</option>
                    <option value="imap">IMAP</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setAddError('');
                    }}
                    className="px-3 py-1 rounded-lg text-xs text-[#71717A] hover:text-white transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3.5 py-1 rounded-lg bg-white text-black text-xs font-medium hover:bg-[#E5E5E7] transition disabled:opacity-40"
                  >
                    {isSubmitting ? 'Подключение...' : 'Подключить'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="w-full py-2.5 border border-dashed border-white/10 hover:border-white/20 rounded-xl text-[#71717A] hover:text-white transition flex items-center justify-center gap-2 text-xs"
              >
                <i className="ph-bold ph-plus text-xs"></i>
                <span>Подключить почтовый ящик (Gmail / Яндекс / IMAP)</span>
              </button>
            )}
          </div>
        </div>

        {/* Block 2: De-clutter & Formatting Preferences */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-mono uppercase text-[#71717A] tracking-wider block">
            РЕЖИМ ЧТЕНИЯ
          </span>
          <div className="rounded-xl bg-[#16161B] border border-white/[0.05] divide-y divide-white/[0.04]">
            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-xs">Срезать подписи и приветствия</div>
                <div className="text-[11px] text-[#71717A]">Скрывать канцелярию, дисклеймеры и «С уважением...»</div>
              </div>
              <button
                onClick={() => setStripFooters(!stripFooters)}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition ${
                  stripFooters ? 'bg-white justify-end' : 'bg-white/15 justify-start'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${stripFooters ? 'bg-black' : 'bg-white'}`}></div>
              </button>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-xs">Сквозные диалоги</div>
                <div className="text-[11px] text-[#71717A]">Объединять цепочки одного контакта в единый тред</div>
              </div>
              <button
                onClick={() => setCrossSubjectThreads(!crossSubjectThreads)}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition ${
                  crossSubjectThreads ? 'bg-white justify-end' : 'bg-white/15 justify-start'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${crossSubjectThreads ? 'bg-black' : 'bg-white'}`}></div>
              </button>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-xs">Zero-Knowledge режим</div>
                <div className="text-[11px] text-[#71717A]">Письма не сохраняются на сторонних серверах</div>
              </div>
              <button
                onClick={() => setZeroKnowledge(!zeroKnowledge)}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition ${
                  zeroKnowledge ? 'bg-white justify-end' : 'bg-white/15 justify-start'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${zeroKnowledge ? 'bg-black' : 'bg-white'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Block 3: Live Observability */}
        {telemetry && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-mono uppercase text-[#71717A] tracking-wider block">
              ТЕЛЕМЕТРИЯ (БЕЗ ПЕРСОНАЛЬНЫХ ДАННЫХ)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#16161B] border border-white/[0.05]">
                <span className="text-[10px] text-[#71717A]">p95 Задержка синка</span>
                <div className="text-sm font-semibold text-white mt-0.5">
                  {telemetry.syncLatency.p95Ms} мс
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#16161B] border border-white/[0.05]">
                <span className="text-[10px] text-[#71717A]">Сжатие канцелярии</span>
                <div className="text-sm font-semibold text-white mt-0.5">
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
            className="px-4 py-2 rounded-xl bg-white text-black font-medium text-xs hover:bg-[#E5E5E7] transition"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
