import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '../types';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onArchiveConversation: (convId: string) => void;
  onMarkAsRead: (convId: string) => void;
  onToggleDossier: () => void;
  isDossierOpen: boolean;
  onBackToConversations?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  onSendMessage,
  onArchiveConversation,
  onMarkAsRead,
  onToggleDossier,
  isDossierOpen,
  onBackToConversations,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-vibery-dark min-w-0 select-none p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-3 text-zinc-400">
          <i className="ph-bold ph-chats-circle"></i>
        </div>
        <h3 className="text-base font-bold text-white">Выберите диалог</h3>
        <p className="text-xs text-zinc-400 max-w-sm mt-1">
          Выберите переписку из списка слева или начните новое письмо, нажав кнопку создания.
        </p>
      </main>
    );
  }

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleQuote = (msgId: string) => {
    setExpandedQuotes((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const latestQuickReplies = messages.length > 0
    ? messages[messages.length - 1].quickReplies
    : undefined;

  return (
    <main className="flex-1 flex flex-col h-full bg-vibery-dark min-w-0 select-none">
      {/* ================= CHAT HEADER ================= */}
      <div className="px-4 md:px-6 py-3 border-b border-white/5 flex items-center justify-between bg-vibery-dark/95 backdrop-blur flex-shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          {onBackToConversations && (
            <button
              onClick={onBackToConversations}
              className="text-zinc-400 hover:text-white p-1 -ml-1 text-xl md:hidden flex-shrink-0"
              title="Назад к списку"
            >
              <i className="ph-bold ph-caret-left"></i>
            </button>
          )}

          {/* Contact Avatar */}
          <div
            onClick={onToggleDossier}
            className="relative cursor-pointer flex-shrink-0"
            title="Открыть досье контакта"
          >
            {conversation.contact.avatarUrl ? (
              <img
                src={conversation.contact.avatarUrl}
                className="w-10 h-10 rounded-full object-cover border border-white/10"
                alt={conversation.contact.displayName}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-white border border-white/10">
                {conversation.contact.displayName.charAt(0)}
              </div>
            )}
            {conversation.category === 'human' && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-vibery-accentGreen border border-vibery-dark"></span>
            )}
          </div>

          {/* Contact Details */}
          <div onClick={onToggleDossier} className="min-w-0 cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white truncate">
                {conversation.contact.displayName}
              </span>
              {conversation.contact.isService && (
                <i className="ph-fill ph-seal-check text-blue-400 text-xs"></i>
              )}
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-zinc-400 uppercase hidden sm:inline-block">
                {conversation.providerBadge}
              </span>
            </div>
            <div className="text-[11px] text-vibery-slate font-mono truncate">
              {conversation.contact.primaryEmail}
              {conversation.contact.organization && ` • ${conversation.contact.organization}`}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 md:gap-2.5 text-zinc-400 flex-shrink-0">
          <button
            onClick={() => onArchiveConversation(conversation.id)}
            className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition"
            title="Архивировать диалог"
          >
            <i className="ph-bold ph-archive-box text-lg"></i>
          </button>
          <button
            onClick={() => onMarkAsRead(conversation.id)}
            className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition"
            title="Отметить прочитанным"
          >
            <i className="ph-bold ph-envelope-open text-lg"></i>
          </button>
          <button
            onClick={onToggleDossier}
            className={`p-2 rounded-xl transition ${
              isDossierOpen ? 'bg-white text-black' : 'hover:bg-white/5 hover:text-white'
            }`}
            title="Досье контакта и вложения"
          >
            <i className="ph-bold ph-sidebar-simple text-lg"></i>
          </button>
        </div>
      </div>

      {/* ================= TOPIC SUBHEADER (EMAIL CONTEXT) ================= */}
      <div className="bg-white/[0.02] px-4 md:px-6 py-2 flex items-center justify-between text-xs text-zinc-400 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2 truncate min-w-0">
          <i className="ph-bold ph-tag text-zinc-500 flex-shrink-0"></i>
          <span className="font-medium text-white truncate">
            Тема: {conversation.subjectContext}
          </span>
        </div>
        <span className="font-mono text-zinc-500 flex-shrink-0 ml-3 text-[11px]">
          {messages.length} {messages.length === 1 ? 'письмо' : 'сообщений'}
        </span>
      </div>

      {/* ================= MESSAGE TIMELINE ================= */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 text-xs">
        <div className="flex justify-center">
          <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-3 py-1 rounded-full">
            Сегодня, 27 октября
          </span>
        </div>

        {messages.map((msg) => {
          const isQuoteOpen = expandedQuotes[msg.id];
          if (msg.isOutgoing) {
            // Outgoing bubble (Right, Pure White)
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] md:max-w-[70%] bg-white text-black font-medium rounded-2xl rounded-tr-sm p-3.5 shadow-lg">
                  <p className="leading-relaxed whitespace-pre-wrap text-xs md:text-sm">{msg.cleanBody}</p>
                  <div className="flex items-center justify-end gap-1.5 text-[9px] md:text-[10px] text-zinc-600 font-mono mt-1">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <i className="ph-bold ph-checks text-xs md:text-sm text-blue-600"></i>
                  </div>
                </div>
              </div>
            );
          }

          // Incoming bubble (Left, Dark Surface)
          return (
            <div key={msg.id} className="flex items-start gap-2 max-w-[90%] md:max-w-[75%]">
              <div className="bg-vibery-surface border border-white/5 rounded-2xl rounded-tl-sm p-3.5 md:p-4 text-zinc-200 space-y-2.5">
                <p className="leading-relaxed whitespace-pre-wrap text-xs md:text-sm">{msg.cleanBody}</p>

                {/* Clean Attachments Cards */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="bg-black/50 border border-white/10 rounded-xl p-2.5 md:p-3 flex items-center justify-between gap-3 hover:border-white/20 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs flex-shrink-0 font-mono">
                            {att.category.toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-semibold text-white truncate">{att.filename}</div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              {(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB • Документ
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => alert(`Скачивание файла: ${att.filename}`)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs font-mono flex items-center gap-1.5 flex-shrink-0"
                        >
                          <i className="ph-bold ph-download-simple"></i>
                          <span className="hidden sm:inline">Скачать</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Collapsible Quote Accordion */}
                {msg.collapsedQuote && (
                  <div className="pt-1">
                    <button
                      onClick={() => toggleQuote(msg.id)}
                      className="text-[10px] md:text-[11px] font-mono text-vibery-slate hover:text-white flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md transition"
                    >
                      <i className={isQuoteOpen ? 'ph-bold ph-caret-down' : 'ph-bold ph-caret-right'}></i>
                      <span>{isQuoteOpen ? 'Скрыть историю цитирования' : '··· 1 цитата'}</span>
                    </button>
                    {isQuoteOpen && (
                      <div className="mt-2 p-2.5 bg-black/60 border border-white/5 rounded-xl text-[10px] font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed">
                        {msg.collapsedQuote}
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp & Provider Badge */}
                <div className="flex items-center justify-end gap-1.5 text-[9px] font-mono text-zinc-500 mt-1">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>•</span>
                  <span className="uppercase">{msg.provider}</span>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ================= QUICK REPLY CHIPS ================= */}
      {latestQuickReplies && latestQuickReplies.length > 0 && (
        <div className="px-4 md:px-6 py-2 flex items-center gap-2 overflow-x-auto bg-vibery-dark/80 border-t border-white/5 flex-shrink-0 no-scrollbar">
          <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1 hidden sm:inline">Ответ:</span>
          {latestQuickReplies.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(chip)}
              className="text-xs bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white px-3 py-1 rounded-full transition border border-white/5 whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* ================= MESSENGER COMPOSER ================= */}
      <div className="p-3 md:p-4 bg-vibery-surface/80 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2 bg-vibery-dark border border-white/10 rounded-2xl p-2 md:p-2.5 focus-within:border-white/30 transition">
          <button
            onClick={() => alert('Прикрепить файл или изображение')}
            className="text-zinc-400 hover:text-white text-base md:text-lg p-1 transition"
            title="Прикрепить файл"
          >
            <i className="ph-bold ph-paperclip"></i>
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Быстрый ответ письмом..."
            className="bg-transparent text-xs md:text-sm text-white placeholder-zinc-500 flex-1 outline-none px-1 md:px-2"
          />
          <button
            onClick={() => alert('Голосовое сообщение активировано')}
            className="text-zinc-400 hover:text-white text-base md:text-lg p-1 transition hidden sm:block"
            title="Голосовой ответ"
          >
            <i className="ph-bold ph-microphone"></i>
          </button>
          <button
            onClick={handleSend}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:opacity-90 transition flex-shrink-0 shadow-md"
            title="Отправить"
          >
            <i className="ph-bold ph-arrow-up text-sm font-bold"></i>
          </button>
        </div>
      </div>
    </main>
  );
};
