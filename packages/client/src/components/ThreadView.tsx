import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message } from '../types';

interface ThreadViewProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onArchiveConversation: (convId: string) => void;
  onMarkAsRead: (convId: string) => void;
  onBack?: () => void;
  isMobile?: boolean;
}

export const ThreadView: React.FC<ThreadViewProps> = ({
  conversation,
  messages,
  onSendMessage,
  onArchiveConversation,
  onMarkAsRead,
  onBack,
  isMobile = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});
  const [attachedName, setAttachedName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center h-full bg-[#0A0A0C] text-[#71717A] p-6 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-xl text-[#A1A1AA] mb-3">
          <i className="ph-bold ph-envelope-simple"></i>
        </div>
        <p className="text-sm font-medium text-[#A1A1AA]">Выберите диалог</p>
        <p className="text-xs text-[#71717A] mt-1 max-w-xs">
          Все цепочки писем сгруппированы по собеседникам и очищены от канцелярии
        </p>
      </main>
    );
  }

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedName) return;
    const textToSend = attachedName
      ? `${inputText.trim()}\n\n[Прикрепленный файл: ${attachedName}]`.trim()
      : inputText.trim();
    onSendMessage(textToSend);
    setInputText('');
    setAttachedName(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleQuote = (msgId: string) => {
    setExpandedQuotes((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleDownload = (filename: string, downloadUrl?: string) => {
    if (downloadUrl) {
      const trimmed = downloadUrl.trim().toLowerCase();
      if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
        console.warn('[Security] Blocked dangerous download URL scheme:', downloadUrl);
        return;
      }
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } else {
      const blob = new Blob([`Содержимое файла: ${filename}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const latestQuickReplies = messages.length > 0
    ? messages[messages.length - 1].quickReplies
    : undefined;

  return (
    <main className="flex-1 flex flex-col h-full bg-[#0A0A0C] min-w-0 select-none overflow-hidden">
      {/* ================= TOP HEADER ================= */}
      <div className="px-4 md:px-5 py-3 md:py-3.5 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))] border-b border-white/[0.06] flex items-center justify-between bg-[#0A0A0C]/90 backdrop-blur flex-shrink-0 z-10">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          {/* Back button (Mobile) */}
          {isMobile && onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 -ml-1.5 text-[#A1A1AA] hover:text-white active:bg-white/10 rounded-xl transition flex items-center justify-center flex-shrink-0"
              title="Назад к списку"
            >
              <i className="ph-bold ph-caret-left text-xl"></i>
            </button>
          )}


          {/* Contact Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white truncate">
                {conversation.contact.displayName}
              </span>
              <span className="text-[10px] font-mono text-[#71717A] bg-white/[0.04] px-1.5 py-0.5 rounded">
                {conversation.providerBadge}
              </span>
            </div>
            <div className="text-xs text-[#71717A] truncate flex items-center gap-1.5">
              <span>{conversation.contact.primaryEmail}</span>
              <span>•</span>
              <span className="text-[#A1A1AA] truncate">{conversation.subjectContext}</span>
            </div>
          </div>
        </div>

        {/* Quiet Actions */}
        <div className="flex items-center gap-1 text-[#8E8E93] flex-shrink-0">
          <button
            onClick={() => onArchiveConversation(conversation.id)}
            className="p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition"
            title="В архив"
          >
            <i className="ph-bold ph-archive-box text-base"></i>
          </button>
          <button
            onClick={() => onMarkAsRead(conversation.id)}
            className="p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition"
            title="Отметить прочитанным"
          >
            <i className="ph-bold ph-envelope-open text-base"></i>
          </button>
        </div>
      </div>

      {/* ================= READING STREAM ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Timeline separator */}
          <div className="flex items-center justify-center">
            <span className="text-[11px] font-mono text-[#5C5C62] uppercase tracking-wider">
              {messages.length} {messages.length === 1 ? 'письмо' : 'сообщений'} в цепочке
            </span>
          </div>

          {/* Messages */}
          {messages.map((msg) => {
            const isQuoteOpen = expandedQuotes[msg.id];
            const isOutgoing = msg.isOutgoing;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const dateStr = new Date(msg.timestamp).toLocaleDateString([], {
              day: 'numeric',
              month: 'short',
            });

            return (
              <article key={msg.id} className="space-y-2 group">
                {/* Message Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Small avatar or monogram */}
                    <div className="w-6 h-6 rounded-full bg-[#18181C] text-[#D1D1D6] font-medium text-[11px] flex items-center justify-center border border-white/5 flex-shrink-0">
                      {isOutgoing ? 'Вы' : msg.sender.name.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-[#F4F4F5] truncate">
                      {isOutgoing ? 'Вы' : msg.sender.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#71717A] bg-white/[0.03] px-1.5 py-0.5 rounded">
                      {msg.provider}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-[#71717A] flex-shrink-0">
                    {dateStr}, {timeStr}
                  </span>
                </div>

                {/* Message Content: Editorial typography, no rounded white bubbles */}
                <div
                  className={`text-[14px] leading-relaxed transition-colors ${
                    isOutgoing
                      ? 'border-l-2 border-white/20 pl-3.5 py-0.5 text-[#EDEDED] font-normal'
                      : 'text-[#D8D8DC] pl-8 font-normal'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.cleanBody}</p>

                  {/* Clean Attachment Cards */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="bg-[#141418] border border-white/[0.08] hover:border-white/20 rounded-xl p-3 flex items-center justify-between gap-3 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-white/[0.05] text-[#D1D1D6] flex items-center justify-center text-sm flex-shrink-0">
                              <i className="ph-bold ph-file-text"></i>
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-medium text-white truncate">
                                {att.filename}
                              </div>
                              <div className="text-[11px] font-mono text-[#71717A]">
                                {(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDownload(att.filename, (att as any).downloadUrl)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white transition text-xs font-mono flex items-center gap-1.5 flex-shrink-0"
                          >
                            <i className="ph-bold ph-download-simple"></i>
                            <span>Скачать</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Collapsible Quote / Full Original Header */}
                  {msg.collapsedQuote && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleQuote(msg.id)}
                        className="text-[11px] font-mono text-[#71717A] hover:text-[#A1A1AA] flex items-center gap-1.5 transition"
                      >
                        <i className={isQuoteOpen ? 'ph-bold ph-caret-down' : 'ph-bold ph-caret-right'}></i>
                        <span>{isQuoteOpen ? 'Скрыть цитирование' : '··· Исходный текст'}</span>
                      </button>
                      {isQuoteOpen && (
                        <div className="mt-2 pl-3 border-l border-white/10 text-[11px] font-mono text-[#71717A] whitespace-pre-wrap break-words leading-relaxed">
                          {msg.collapsedQuote}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ================= COMPOSER & QUICK REPLIES ================= */}
      <div className="p-3 md:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] border-t border-white/[0.06] bg-[#0A0A0C] flex-shrink-0">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Quick Replies chips */}
          {latestQuickReplies && latestQuickReplies.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] text-[#71717A] font-mono flex-shrink-0">Быстрый ответ:</span>
              {latestQuickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(reply)}
                  className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-[#A1A1AA] hover:text-white transition whitespace-nowrap flex-shrink-0"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <div className="flex-1 bg-[#141418] border border-white/[0.08] focus-within:border-white/20 rounded-xl px-3.5 py-2 flex items-center gap-2.5 transition">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Написать ответ... (Enter для отправки)"
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder-[#71717A] focus:outline-none resize-none leading-relaxed"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAttachedName(file.name);
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-1 rounded transition ${attachedName ? 'text-white' : 'text-[#71717A] hover:text-white'}`}
                title="Прикрепить файл"
              >
                <i className="ph-bold ph-paperclip text-base"></i>
              </button>
            </div>

            {attachedName && (
              <div className="absolute -top-7 left-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/10 text-white text-[11px] font-mono">
                <i className="ph-bold ph-file text-xs"></i>
                <span className="truncate max-w-[200px]">{attachedName}</span>
                <button
                  type="button"
                  onClick={() => setAttachedName(null)}
                  className="hover:text-red-400 ml-1"
                >
                  <i className="ph-bold ph-x text-xs"></i>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={!inputText.trim() && !attachedName}
              className="h-10 px-4 rounded-xl bg-white text-black font-medium text-xs hover:bg-[#E5E5E7] disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1.5 flex-shrink-0"
            >
              <span>Отправить</span>
              <i className="ph-bold ph-paper-plane-right text-xs"></i>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
