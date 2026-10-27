import React, { useState, useRef } from 'react';

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
  const [attachedName, setAttachedName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

    const finalBody = attachedName
      ? `${body.trim()}\n\n[Прикрепленный файл: ${attachedName}]`.trim()
      : body.trim();
    onSendNewMessage(recipient.trim(), subject.trim() || 'Без темы', finalBody);
    setRecipient('');
    setSubject('');
    setBody('');
    setAttachedName(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#121216] border border-white/[0.08] rounded-2xl w-full max-w-lg p-5 md:p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-base font-semibold text-white tracking-tight">Новое письмо</h2>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <i className="ph-bold ph-x text-base"></i>
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[11px] font-mono text-[#71717A] uppercase tracking-wider block mb-1">
              Кому (Email)
            </label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#16161B] border border-white/[0.06] focus:border-white/20 rounded-xl px-3 py-2 text-white placeholder-[#71717A] outline-none transition"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-[#71717A] uppercase tracking-wider block mb-1">
              Тема переписки
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Тема сообщения (необязательно)"
              className="w-full bg-[#16161B] border border-white/[0.06] focus:border-white/20 rounded-xl px-3 py-2 text-white placeholder-[#71717A] outline-none transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-[#71717A] uppercase tracking-wider block mb-1">
              Сообщение
            </label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Текст сообщения..."
              className="w-full bg-[#16161B] border border-white/[0.06] focus:border-white/20 rounded-xl px-3 py-2 text-white placeholder-[#71717A] outline-none transition resize-none leading-relaxed"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setAttachedName(file.name);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-1 rounded transition text-lg ${attachedName ? 'text-white' : 'text-[#71717A] hover:text-white'}`}
                title="Прикрепить файл"
              >
                <i className="ph-bold ph-paperclip"></i>
              </button>
              {attachedName && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/10 text-white text-[11px] font-mono">
                  <i className="ph-bold ph-file text-xs"></i>
                  <span className="truncate max-w-[150px]">{attachedName}</span>
                  <button
                    type="button"
                    onClick={() => setAttachedName(null)}
                    className="hover:text-red-400"
                  >
                    <i className="ph-bold ph-x text-xs"></i>
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-white text-black font-medium text-xs hover:bg-[#E5E5E7] transition flex items-center gap-1.5"
              >
                <span>Отправить</span>
                <i className="ph-bold ph-paper-plane-right text-xs"></i>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
