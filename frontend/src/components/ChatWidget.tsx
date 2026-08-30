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
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-subtle flex flex-col overflow-hidden mb-3 animate-in fade-in zoom-in-95 duration-apple">
          {/* Header */}
          <div className="p-4 bg-bg-light dark:bg-bg-dark border-b border-border-light dark:border-border-dark flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Araştırma Asistanı
                </h2>
                <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                  Makaleye dayalı soru-cevap
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent text-white rounded-tr-sm'
                      : 'bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Source citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-border-light dark:border-border-dark flex flex-wrap gap-1">
                      {msg.sources.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark"
                        >
                          <BookOpen className="w-2.5 h-2.5 text-accent" />
                          Sayfa {src.page}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center text-text-secondary-light dark:text-text-secondary-dark text-xs">
                <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-2xl bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-bg-light dark:bg-bg-dark border-t border-border-light dark:border-border-dark flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Makaleye bir soru sor..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-xs text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark focus:outline-none focus:ring-1 focus:ring-accent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white disabled:opacity-50 transition-colors flex items-center justify-center"
              aria-label="Gönder"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-13 h-13 p-3.5 rounded-full bg-accent hover:bg-accent-hover text-white shadow-md hover:shadow-lg transition-all duration-apple flex items-center justify-center"
        aria-label="Sohbeti Aç/Kapat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </aside>
  );
};
