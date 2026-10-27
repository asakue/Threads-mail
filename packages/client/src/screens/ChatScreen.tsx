import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '../types';

interface ChatScreenProps {
  conversation: Conversation;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (text: string) => void;
  onOpenContactProfile: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversation,
  messages,
  onBack,
  onSendMessage,
  onOpenContactProfile,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const toggleQuote = (msgId: string) => {
    setExpandedQuotes((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const latestQuickReplies = messages.length > 0
    ? messages[messages.length - 1].quickReplies
    : undefined;

  return (
    <div className="flex flex-col h-full bg-vibery-dark text-white">
      {/* Top Conversation Header */}
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between bg-vibery-dark flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="text-zinc-400 hover:text-white p-1 -ml-1 text-xl flex-shrink-0"
          >
            <i className="ph-bold ph-caret-left"></i>
          </button>
          
          <div
            onClick={onOpenContactProfile}
            className="relative cursor-pointer flex-shrink-0"
            title="Открыть досье контакта"
          >
            {conversation.contact.avatarUrl ? (
              <img
                src={conversation.contact.avatarUrl}
                className="w-9 h-9 rounded-full object-cover border border-white/10"
                alt={conversation.contact.displayName}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white border border-white/10">
                {conversation.contact.displayName.charAt(0)}
              </div>
            )}
            {conversation.category === 'human' && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-vibery-accentGreen border border-vibery-dark"></span>
            )}
          </div>

          <div
            onClick={onOpenContactProfile}
            className="min-w-0 cursor-pointer"
          >
            <div className="font-bold text-xs text-white leading-tight truncate flex items-center gap-1">
              <span>{conversation.contact.displayName}</span>
              {conversation.contact.isService && (
                <i className="ph-fill ph-seal-check text-blue-400 text-[10px]"></i>
              )}
            </div>
            <div className="text-[10px] text-vibery-slate font-mono truncate">
              {conversation.contact.primaryEmail}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-400 text-base flex-shrink-0">
          <button
            onClick={onOpenContactProfile}
            className="hover:text-white transition p-1"
            title="Профиль контакта"
          >
            <i className="ph-bold ph-address-book"></i>
          </button>
          <button className="hover:text-white transition p-1" title="Опции">
            <i className="ph-bold ph-dots-three-vertical"></i>
          </button>
        </div>
      </div>

      {/* Topic Subheader Banner (Email Subject Context) */}
      <div className="bg-white/[0.03] px-4 py-1.5 flex items-center justify-between text-[10px] text-zinc-400 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <i className="ph-bold ph-paperclip text-zinc-500"></i>
          <span className="truncate">Тема: {conversation.subjectContext}</span>
        </div>
        <span className="font-mono text-zinc-500 flex-shrink-0 ml-2">
          {messages.length} {messages.length === 1 ? 'письмо' : 'письма'}
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {/* Date separator */}
        <div className="flex justify-center">
          <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2.5 py-0.5 rounded-full">
            Сегодня, 27 октября
          </span>
        </div>

        {messages.map((msg) => {
          const isQuoteOpen = expandedQuotes[msg.id];
          if (msg.isOutgoing) {
            // Outgoing Bubble (Right, White)
            return (
              <div key={msg.id} className="flex items-start justify-end">
                <div className="max-w-[85%] bg-white text-black font-medium rounded-2xl rounded-tr-sm p-3 shadow-md">
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.cleanBody}</p>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-zinc-600 font-mono mt-1">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <i className="ph-bold ph-checks text-xs text-blue-600"></i>
                  </div>
                </div>
              </div>
            );
          }

          // Incoming Bubble (Left, Dark Surface)
          return (
            <div key={msg.id} className="flex items-start gap-2 max-w-[88%]">
              <div className="bg-vibery-surface border border-white/5 rounded-2xl rounded-tl-sm p-3 text-zinc-200 space-y-2">
                <p className="leading-relaxed whitespace-pre-wrap">{msg.cleanBody}</p>

                {/* Attachments Card */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-3 hover:border-white/20 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0 font-mono">
                            {att.category.toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-semibold text-white truncate">{att.filename}</div>
                            <div className="text-[10px] font-mono text-zinc-500">
                              {(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB • Документ
                            </div>
                          </div>
                        </div>
                        <a
                          href={att.downloadUrl}
                          download={att.filename}
                          onClick={(e) => {
                            e.preventDefault();
                            alert(`Скачивание файла: ${att.filename}`);
                          }}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs flex-shrink-0"
                          title="Скачать"
                        >
                          <i className="ph-bold ph-download-simple"></i>
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Collapsible Quote Accordion */}
                {msg.collapsedQuote && (
                  <div className="pt-1">
                    <button
                      onClick={() => toggleQuote(msg.id)}
                      className="text-[10px] font-mono text-vibery-slate hover:text-white flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded transition"
                    >
                      <i className={isQuoteOpen ? 'ph-bold ph-caret-down' : 'ph-bold ph-caret-right'}></i>
                      <span>{isQuoteOpen ? 'Скрыть историю цитаты' : '··· 1 цитата'}</span>
                    </button>
                    {isQuoteOpen && (
                      <div className="mt-1.5 p-2 bg-black/50 border border-white/5 rounded-lg text-[10px] font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed">
                        {msg.collapsedQuote}
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp and Provider tag */}
                <div className="flex items-center justify-end gap-1.5 text-[9px] font-mono text-zinc-500 mt-1">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span className="uppercase">{msg.provider}</span>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reply Suggestion Chips */}
      {latestQuickReplies && latestQuickReplies.length > 0 && (
        <div className="px-4 py-1.5 flex items-center gap-2 overflow-x-auto bg-vibery-dark/80 flex-shrink-0 no-scrollbar">
          {latestQuickReplies.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(chip)}
              className="text-[10px] bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white px-2.5 py-1 rounded-full transition border border-white/5 whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Composer (Messenger Input Bar) */}
      <div className="p-3 bg-vibery-surface/90 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2 bg-vibery-dark border border-white/10 rounded-2xl px-3 py-1.5">
          <button className="text-zinc-400 hover:text-white text-base">
            <i className="ph-bold ph-paperclip"></i>
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Быстрый ответ письмом..."
            className="bg-transparent text-xs text-white placeholder-zinc-500 flex-1 outline-none"
          />
          <button
            onClick={() => alert('Голосовой ответ: микрофон активирован')}
            className="text-zinc-400 hover:text-white text-base"
          >
            <i className="ph-bold ph-microphone"></i>
          </button>
          <button
            onClick={handleSend}
            className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:opacity-90 transition flex-shrink-0"
          >
            <i className="ph-bold ph-arrow-up text-xs font-bold"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
