import React, { useState, useEffect } from 'react';
import { Plus, StickyNote, X, Send } from 'lucide-react';
import { SectionNote, createSectionNote, getSectionNotes } from '../api/client';

interface ReportSectionNoteProps {
  sectionId?: string;
}

export const ReportSectionNote: React.FC<ReportSectionNoteProps> = ({ sectionId }) => {
  const [notes, setNotes] = useState<SectionNote[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    if (!sectionId) return;
    getSectionNotes(sectionId)
      .then(setNotes)
      .catch(() => {});
  }, [sectionId]);

  if (!sectionId) return null;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setLoading(true);
    try {
      const added = await createSectionNote(sectionId, newContent.trim());
      setNotes((prev) => [...prev, added]);
      setNewContent('');
      setShowInput(false);
    } catch (err) {
      console.error('Not kaydedilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Not Tetikleyici Buton */}
      <div className="flex items-center gap-1">
        {notes.length > 0 && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all"
            title={`${notes.length} kenar notu`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span className="font-medium">{notes.length}</span>
          </button>
        )}

        <button
          onClick={() => {
            setIsOpen(true);
            setShowInput(true);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-hover"
          title="Bölüme Hızlı Not Ekle"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Not Paneli & Giriş Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 z-50 p-3 bg-surface border border-border rounded-xl shadow-xl backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border text-xs font-semibold text-fg">
            <span className="flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-amber-500" />
              Kenar Notları
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-fg-muted hover:text-fg p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Not Listesi */}
          <div className="max-h-48 overflow-y-auto space-y-2 mb-2 pr-1">
            {notes.length === 0 && !showInput && (
              <p className="text-xs text-fg-muted text-center py-2">Henüz not eklenmedi.</p>
            )}
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-2 rounded-lg bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/10 text-xs text-fg leading-relaxed"
              >
                <p className="whitespace-pre-wrap">{note.content}</p>
                <span className="text-[10px] text-fg-subtle mt-1 block">
                  {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>

          {/* Not Ekleme Alanı */}
          {showInput ? (
            <form onSubmit={handleAddNote} className="mt-2">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Bu bölüme bir not yazın..."
                className="w-full text-xs p-2 rounded-lg bg-surface-hover border border-border focus:outline-none focus:ring-1 focus:ring-accent resize-none text-fg"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowInput(false)}
                  className="px-2 py-1 text-xs text-fg-muted hover:text-fg rounded-md"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={loading || !newContent.trim()}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-accent text-white rounded-md hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  Kaydet
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="w-full py-1 text-xs text-center text-accent hover:underline flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> Yeni Not Ekle
            </button>
          )}
        </div>
      )}
    </div>
  );
};
