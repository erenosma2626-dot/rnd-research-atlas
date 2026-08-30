import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, BookOpen } from 'lucide-react';
import { ChatMessage, ChatResponse, sendChatMessage } from '../api/client';

interface ChatWidgetProps {
  documentId: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ documentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; sources?: any[] }>>([
    {
      role: 'assistant',
      content: 'Merhaba! Makale hakkında sormak istediğiniz soruları buradan sorabilirsiniz.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuestion = input.trim();
    setInput('');
    const newHistory: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, { role: 'user', content: userQuestion }]);
    setIsLoading(true);

    try {
      const response: ChatResponse = await sendChatMessage({
        document_id: documentId,
        question: userQuestion,
        history: newHistory,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Hata: ${err?.message || 'Cevap alınamadı.'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside aria-label="Araştırma Asistanı Sohbeti" className="fixed bottom-6 right-6 z-50">
      {/* Chat Window (Glassmorphic Prompt Style) */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-[#0A0A0A]/85 border border-white/60 dark:border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden mb-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 bg-white/50 dark:bg-black/40 border-b border-black/[0.05] dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0A0A0A] dark:bg-white flex items-center justify-center text-white dark:text-[#0A0A0A]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#0A0A0A] dark:text-white tracking-tight">
                  Araştırma Asistanı
                </h2>
                <p className="text-[11px] text-black/50 dark:text-white/50">
                  RAG destekli soru-cevap
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 text-[#0A0A0A] dark:text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] rounded-tr-sm shadow-xs'
                      : 'bg-black/[0.03] dark:bg-white/[0.06] text-[#0A0A0A] dark:text-white border border-black/[0.04] dark:border-white/[0.08] rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Source citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-black/[0.05] dark:border-white/[0.08] flex flex-wrap gap-1">
                      {msg.sources.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-black/50 border border-black/[0.06] dark:border-white/[0.1] text-black/60 dark:text-white/60"
                        >
                          <BookOpen className="w-2.5 h-2.5 text-black/50 dark:text-white/50" />
                          Sayfa {src.page}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center text-black/50 dark:text-white/50 text-xs">
                <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.08] flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] dark:bg-white animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] dark:bg-white animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] dark:bg-white animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box (Prompt Bar) */}
          <form onSubmit={handleSend} className="p-3 bg-white/40 dark:bg-black/40 border-t border-black/[0.05] dark:border-white/[0.08] flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Makaleye bir soru sor..."
              className="flex-1 px-4 py-2.5 rounded-full bg-white dark:bg-[#141414] border border-black/[0.08] dark:border-white/[0.12] text-xs text-[#0A0A0A] dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:border-black/30 dark:focus:border-white/30 shadow-xs"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 rounded-full bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] disabled:opacity-30 hover:opacity-90 transition-all flex items-center justify-center shrink-0 shadow-xs"
              aria-label="Gönder"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button (Pill Round) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-13 h-13 p-3.5 rounded-full bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:scale-105 transition-all duration-200 flex items-center justify-center"
        aria-label="Sohbeti Aç/Kapat"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </button>
    </aside>
  );
};
