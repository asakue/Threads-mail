import React from 'react';
import { Contact } from '../types';

interface ContactDossierProps {
  contact: Contact;
  sharedAttachments: any[];
  onClose: () => void;
  isMobileDrawer?: boolean;
}

export const ContactDossier: React.FC<ContactDossierProps> = ({
  contact,
  sharedAttachments,
  onClose,
  isMobileDrawer = false,
}) => {
  return (
    <aside
      className={`border-l border-vibery-border bg-vibery-dark flex flex-col flex-shrink-0 z-20 select-none overflow-y-auto ${
        isMobileDrawer
          ? 'fixed inset-y-0 right-0 w-full sm:w-96 shadow-2xl animate-fade-in'
          : 'w-80'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider font-mono text-vibery-slate">
          ДОСЬЕ КОНТАКТА
        </span>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-1 text-base transition"
          title="Закрыть"
        >
          <i className="ph-bold ph-x"></i>
        </button>
      </div>

      {/* Hero Profile Card */}
      <div className="p-6 text-center border-b border-white/5 flex-shrink-0">
        <div className="relative inline-block">
          {contact.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-white/20 shadow-xl"
              alt={contact.displayName}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-2xl border-2 border-white/20 mx-auto text-white">
              {contact.displayName.charAt(0)}
            </div>
          )}
          {contact.category === 'human' && (
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-vibery-accentGreen border-2 border-vibery-dark"></span>
          )}
        </div>

        <h3 className="text-base font-bold text-white mt-3">{contact.displayName}</h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          {contact.role ? `${contact.role} • ` : ''}
          {contact.organization || 'Личный контакт'}
        </p>

        {/* Quick Action Icons */}
        <div className="flex justify-center gap-3 mt-3">
          <button
            onClick={() => alert(`Поиск писем от ${contact.displayName}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition border border-white/5"
          >
            <i className="ph-bold ph-magnifying-glass"></i>
            <span>Поиск</span>
          </button>
          <button
            onClick={() => alert('Уведомления отключены')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition border border-white/5"
          >
            <i className="ph-bold ph-bell-slash"></i>
            <span>Без звука</span>
          </button>
        </div>
      </div>

      {/* Linked Email Aliases */}
      <div className="p-4 border-b border-white/5 space-y-2">
        <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider block">
          СВЯЗАННЫЕ АДРЕСА ПОЧТЫ
        </span>
        {contact.linkedEmails.map((link, idx) => (
          <div key={idx} className="p-2.5 rounded-xl bg-vibery-surface border border-white/5 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-white text-[11px] truncate">{link.email}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                  link.isPrimary
                    ? 'bg-blue-500/20 text-blue-400 font-bold'
                    : 'bg-white/5 text-zinc-400'
                }`}
              >
                {link.isPrimary ? 'ОСНОВНОЙ' : 'ALIAS'}
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">{link.label}</div>
          </div>
        ))}
      </div>

      {/* Shared Attachments Gallery */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider">
            ОБЩИЕ ВЛОЖЕНИЯ ({sharedAttachments.length || 3})
          </span>
          <span className="text-[10px] text-vibery-blue cursor-pointer hover:underline">
            Все файлы
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div
            onClick={() => alert('Скачивание Pitch_Deck.pdf')}
            className="bg-black/50 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/30 transition"
          >
            <i className="ph-bold ph-file-pdf text-red-400 text-lg"></i>
            <span className="text-[9px] text-zinc-300 truncate w-full mt-1">Pitch_Deck.pdf</span>
          </div>
          <div
            onClick={() => alert('Скачивание Icons_svg.zip')}
            className="bg-black/50 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/30 transition"
          >
            <i className="ph-bold ph-file-archive text-amber-400 text-lg"></i>
            <span className="text-[9px] text-zinc-300 truncate w-full mt-1">Icons_svg.zip</span>
          </div>
          <div
            onClick={() => alert('Скачивание Brief_v2.docx')}
            className="bg-black/50 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/30 transition"
          >
            <i className="ph-bold ph-file-doc text-blue-400 text-lg"></i>
            <span className="text-[9px] text-zinc-300 truncate w-full mt-1">Brief_v2.docx</span>
          </div>
        </div>
      </div>

      {/* History Stats */}
      <div className="p-4 text-xs space-y-2">
        <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider block">
          СТАТИСТИКА ОБЩЕНИЯ
        </span>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-[11px]">
          <div className="flex justify-between text-zinc-400">
            <span>Первый контакт:</span>
            <span className="text-white font-mono">{contact.firstContactDate}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Всего сообщений:</span>
            <span className="text-white font-mono">{contact.totalMessagesExchanged}</span>
          </div>
          {contact.avgResponseTimeMinutes && (
            <div className="flex justify-between text-zinc-400">
              <span>Средний ответ:</span>
              <span className="text-vibery-accentGreen font-mono font-bold">
                ~{contact.avgResponseTimeMinutes} мин
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
