import React from 'react';
import { Contact } from '../types';

interface ContactScreenProps {
  contact: Contact;
  sharedAttachments: any[];
  onBack: () => void;
  onOpenChat: () => void;
}

export const ContactScreen: React.FC<ContactScreenProps> = ({
  contact,
  sharedAttachments,
  onBack,
  onOpenChat,
}) => {
  return (
    <div className="flex flex-col h-full bg-vibery-dark text-white select-none">
      {/* Top Header */}
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <button onClick={onBack} className="text-zinc-400 hover:text-white p-1 -ml-1 text-xl">
          <i className="ph-bold ph-caret-left"></i>
        </button>
        <span className="text-xs font-bold uppercase tracking-wider font-mono text-vibery-slate">
          ПРОФИЛЬ КОНТАКТА
        </span>
        <button className="text-zinc-400 hover:text-white p-1 text-lg">
          <i className="ph-bold ph-share-network"></i>
        </button>
      </div>

      {/* Hero Card */}
      <div className="px-5 py-4 text-center border-b border-white/5 flex-shrink-0">
        <div className="relative inline-block">
          {contact.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-white/20 shadow-lg"
              alt={contact.displayName}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-2xl border-2 border-white/20 mx-auto">
              {contact.displayName.charAt(0)}
            </div>
          )}
          {contact.category === 'human' && (
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-vibery-accentGreen border-2 border-vibery-dark"></span>
          )}
        </div>

        <h2 className="text-base font-bold text-white mt-2">{contact.displayName}</h2>
        <p className="text-xs text-zinc-400">
          {contact.role ? `${contact.role} • ` : ''}
          {contact.organization || 'Личный контакт'}
        </p>

        {/* Action Pills */}
        <div className="flex justify-center gap-4 mt-3">
          <button
            onClick={onOpenChat}
            className="flex flex-col items-center gap-1 text-[10px] text-zinc-300 hover:text-white"
          >
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-white/20 transition">
              <i className="ph-bold ph-chat-circle-dots"></i>
            </div>
            <span>Написать</span>
          </button>
          <button
            onClick={() => alert('Поиск по истории сообщений')}
            className="flex flex-col items-center gap-1 text-[10px] text-zinc-300 hover:text-white"
          >
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-white/20 transition">
              <i className="ph-bold ph-magnifying-glass"></i>
            </div>
            <span>Поиск</span>
          </button>
          <button
            onClick={() => alert('Уведомления отключены для этого контакта')}
            className="flex flex-col items-center gap-1 text-[10px] text-zinc-300 hover:text-white"
          >
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-white/20 transition">
              <i className="ph-bold ph-bell-slash"></i>
            </div>
            <span>Без звука</span>
          </button>
        </div>
      </div>

      {/* Details Scroll Area */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 text-xs">
        {/* Linked email accounts (Multi-account aliasing) */}
        <div>
          <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider">
            СВЯЗАННЫЕ АДРЕСА ПОЧТЫ
          </span>
          <div className="mt-2 space-y-1.5">
            {contact.linkedEmails.map((link, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-vibery-surface border border-white/5 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-white text-xs">{link.email}</div>
                  <div className="text-[10px] text-zinc-400">{link.label}</div>
                </div>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                    link.isPrimary
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold'
                      : 'bg-white/5 text-zinc-400 border-white/10'
                  }`}
                >
                  {link.isPrimary ? 'ОСНОВНОЙ' : 'ALIAS'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shared Attachments Gallery */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-vibery-slate tracking-wider">
              ОБЩИЕ ВЛОЖЕНИЯ ({sharedAttachments.length || 3})
            </span>
            <span className="text-[10px] text-vibery-blue cursor-pointer hover:underline">
              Все файлы
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-black/40 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center text-center hover:border-white/20 transition cursor-pointer">
              <i className="ph-bold ph-file-pdf text-red-400 text-lg"></i>
              <span className="text-[9px] text-zinc-300 truncate w-full mt-1">Pitch_Deck.pdf</span>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center text-center hover:border-white/20 transition cursor-pointer">
              <i className="ph-bold ph-file-archive text-amber-400 text-lg"></i>
              <span className="text-[9px] text-zinc-300 truncate w-full mt-1">Icons_svg.zip</span>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center text-center hover:border-white/20 transition cursor-pointer">
              <i className="ph-bold ph-file-doc text-blue-400 text-lg"></i>
              <span className="text-[9px] text-zinc-300 truncate w-full mt-1">Brief_v2.docx</span>
            </div>
          </div>
        </div>

        {/* History Stats */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] space-y-1.5">
          <div className="flex justify-between text-zinc-400">
            <span>Первое письмо:</span>
            <span className="text-white font-mono">{contact.firstContactDate}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Всего сообщений в треде:</span>
            <span className="text-white font-mono">{contact.totalMessagesExchanged} сообщений</span>
          </div>
          {contact.avgResponseTimeMinutes && (
            <div className="flex justify-between text-zinc-400">
              <span>Среднее время ответа:</span>
              <span className="text-vibery-accentGreen font-mono font-semibold">
                ~{contact.avgResponseTimeMinutes} минут
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
