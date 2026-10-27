import React, { useState } from 'react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendNewMessage: (recipient: string, subject: string, body: string) => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSendNewMessage,
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !recipient.includes('@')) {
      setError('Укажите корректный email получателя');
      return;
    }
    if (!body.trim()) {
      setError('Текст сообщения не может быть пустым');
      return;
    }

    onSendNewMessage(recipient.trim(), subject.trim() || 'Без темы', body.trim());
    setRecipient('');
    setSubject('');
    setBody('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-vibery-surface border border-vibery-border rounded-2xl w-full max-w-lg p-5 md:p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-base font-bold text-white tracking-tight">Новое сообщение</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <i className="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        {error && (
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Кому (Email)
            </label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="alex@example.com"
              className="w-full bg-vibery-dark border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-500 outline-none focus:border-white/30 transition"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Тема переписки
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Тема сообщения (необязательно)"
              className="w-full bg-vibery-dark border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-500 outline-none focus:border-white/30 transition"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Сообщение
            </label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Напишите текст сообщения..."
              className="w-full bg-vibery-dark border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-500 outline-none focus:border-white/30 transition resize-none"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-white/10">
            <div className="flex items-center gap-2 text-zinc-400 text-lg">
              <button
                type="button"
                onClick={() => alert('Прикрепить файлы')}
                className="hover:text-white transition p-1"
                title="Прикрепить файл"
              >
                <i className="ph-bold ph-paperclip"></i>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:opacity-90 transition flex items-center gap-1.5 shadow-md"
              >
                <span>Отправить</span>
                <i className="ph-bold ph-paper-plane-right"></i>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
