import React, { useState } from 'react';
import {
  ArrowRight,
  Circle,
  FilePlus,
  Layers,
  Minus,
  PenTool as PenIcon,
  Plus,
  Square,
  StickyNote,
  Type,
} from 'lucide-react';
import { CanvasSummary, DocumentSummary, listProjectDocuments } from '../../api/client';
import { useTheme } from '../../theme/ThemeContext';
import { CanvasTabs } from './CanvasTabs';
import { ShapeType } from './ShapeNode';

interface CanvasToolbarProps {
  canvases: CanvasSummary[];
  activeCanvasId: string;
  onSelectCanvas: (canvasId: string) => void;
  onCreateCanvas: () => void;
  onRenameCanvas: (canvasId: string, currentName: string) => void;
  onDeleteCanvas: (canvasId: string, name: string) => void;
  onNavigateHome: () => void;
  onAddDocumentToCanvas: (doc: DocumentSummary) => void;
  onAddNoteToCanvas: () => void;
  onAddSectionToCanvas?: (title: string, contentType: string, contentText: string) => void;
  onAddShapeToCanvas?: (shapeType: ShapeType) => void;
  isPenActive: boolean;
  onTogglePen: () => void;
  onToggleInventory: () => void;
  isInventoryOpen: boolean;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  canvases,
  activeCanvasId,
  onSelectCanvas,
  onCreateCanvas,
  onRenameCanvas,
  onDeleteCanvas,
  onNavigateHome,
  onAddDocumentToCanvas,
  onAddNoteToCanvas,
  onAddSectionToCanvas,
  onAddShapeToCanvas,
  isPenActive,
  onTogglePen,
  onToggleInventory,
  isInventoryOpen,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<DocumentSummary[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // New section form state
  const [secTitle, setSecTitle] = useState('');
  const [secType, setSecType] = useState('prose');
  const [secContent, setSecContent] = useState('');

  const handleOpenDocModal = async () => {
    setIsDocModalOpen(true);
    setLoadingDocs(true);
    try {
      const docs = await listProjectDocuments();
      setAvailableDocs(docs);
    } catch {
      setAvailableDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSelectDoc = (doc: DocumentSummary) => {
    onAddDocumentToCanvas(doc);
    setIsDocModalOpen(false);
  };

  const handleCreateSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secTitle.trim()) return;
    onAddSectionToCanvas?.(secTitle.trim(), secType, secContent.trim());
    setSecTitle('');
    setSecContent('');
    setIsSectionModalOpen(false);
  };

  return (
    <>
      <header className="absolute top-4 left-6 right-6 z-20 flex items-center justify-between pointer-events-none gap-3">
        {/* Sol Alan: Projeye Dön & Canvas Sekmeleri */}
        <div className="flex items-center gap-2 bg-white/85 dark:bg-[#0A0A0A]/85 backdrop-blur-md p-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.08] shadow-sm pointer-events-auto overflow-hidden">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#0A0A0A] dark:hover:text-white transition-colors flex-shrink-0"
          >
            &larr; Projeye Dön
          </button>

          <div className="h-4 w-px bg-black/[0.08] dark:bg-white/[0.1] flex-shrink-0" />

          {/* Canvas Tabs */}
          <CanvasTabs
            canvases={canvases}
            activeCanvasId={activeCanvasId}
            onSelectCanvas={onSelectCanvas}
            onCreateCanvas={onCreateCanvas}
            onRenameCanvas={onRenameCanvas}
            onDeleteCanvas={onDeleteCanvas}
          />
        </div>

        {/* Sağ Alan: Çizim, Şekil, Bölüm, Not, Doküman ve Envanter Araçları */}
        <div className="flex items-center gap-1.5 bg-white/85 dark:bg-[#0A0A0A]/85 backdrop-blur-md p-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.08] shadow-sm pointer-events-auto">
          {/* Kalem Aracı (Pen Tool) */}
          <button
            onClick={onTogglePen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isPenActive
                ? 'bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] shadow-xs'
                : 'text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            }`}
            title="Serbest Kalem Çizimi"
          >
            <PenIcon className="w-3.5 h-3.5" />
            <span>Kalem</span>
          </button>

          {/* Şekil Ekle Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsShapeMenuOpen(!isShapeMenuOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Şekil</span>
            </button>

            {isShapeMenuOpen && (
              <div className="absolute top-full mt-2 left-0 w-36 bg-white dark:bg-[#141414] rounded-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-xl p-1.5 z-30 space-y-0.5">
                <button
                  onClick={() => {
                    onAddShapeToCanvas?.('rectangle');
                    setIsShapeMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  <Square className="w-3.5 h-3.5" /> Dikdörtgen
                </button>
                <button
                  onClick={() => {
                    onAddShapeToCanvas?.('circle');
                    setIsShapeMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  <Circle className="w-3.5 h-3.5" /> Daire
                </button>
                <button
                  onClick={() => {
                    onAddShapeToCanvas?.('arrow');
                    setIsShapeMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Ok
                </button>
                <button
                  onClick={() => {
                    onAddShapeToCanvas?.('line');
                    setIsShapeMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  <Minus className="w-3.5 h-3.5" /> Çizgi
                </button>
                <button
                  onClick={() => {
                    onAddShapeToCanvas?.('text');
                    setIsShapeMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  <Type className="w-3.5 h-3.5" /> Metin Kutusu
                </button>
              </div>
            )}
          </div>

          {/* Not / Yapışkan Not Butonu */}
          <button
            onClick={onAddNoteToCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Not</span>
          </button>

          {/* Manuel Bölüm Ekle Butonu */}
          <button
            onClick={() => setIsSectionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Bölüm</span>
          </button>

          {/* Doküman Ekle Butonu */}
          <button
            onClick={handleOpenDocModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Doküman</span>
          </button>

          {/* Envanter Drawer Button */}
          <button
            onClick={onToggleInventory}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full transition-all shadow-xs ${
              isInventoryOpen
                ? 'bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A]'
                : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#0A0A0A] dark:text-white hover:bg-black/[0.08] dark:hover:bg-white/[0.1]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Envanter</span>
          </button>

          {/* Theme Switch */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            title={isDark ? 'Açık Mod' : 'Koyu Mod'}
          >
            {isDark ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* 1. Doküman Seçim Modalı */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#141414] rounded-3xl border border-black/[0.08] dark:border-white/[0.1] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-medium tracking-tight">Tuvale Doküman Ekle</h3>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-black/50 dark:text-white/50"
              >
                &times;
              </button>
            </div>

            {loadingDocs ? (
              <div className="p-8 text-center text-xs text-black/50 dark:text-white/50 font-mono">
                Dokümanlar yükleniyor...
              </div>
            ) : availableDocs.length === 0 ? (
              <div className="p-8 text-center text-xs text-black/50 dark:text-white/50">
                Projede henüz doküman bulunmuyor. Önce bir PDF yükleyin.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {availableDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className="p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 bg-black/[0.02] dark:bg-white/[0.02] cursor-pointer flex items-center justify-between gap-3 transition-all"
                  >
                    <span className="text-xs font-medium truncate font-sans">
                      {doc.original_filename}
                    </span>
                    <span className="text-xs font-medium text-[#0A0A0A] dark:text-white flex-shrink-0">
                      Ekle +
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Manuel Bölüm Ekleme Modalı */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#141414] rounded-3xl border border-black/[0.08] dark:border-white/[0.1] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-medium tracking-tight">Yeni Bölüm Oluştur</h3>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-black/50 dark:text-white/50"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-black/60 dark:text-white/60 mb-1">
                  Bölüm Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={secTitle}
                  onChange={(e) => setSecTitle(e.target.value)}
                  placeholder="Örn: Yöntem Özeti veya Ek Bulgular"
                  className="w-full px-3.5 py-2 rounded-full text-xs bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black/60 dark:text-white/60 mb-1">
                  İçerik Tipi
                </label>
                <select
                  value={secType}
                  onChange={(e) => setSecType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-full text-xs bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] outline-none"
                >
                  <option value="prose">Düz Metin (Prose)</option>
                  <option value="list">Liste (List)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-black/60 dark:text-white/60 mb-1">
                  İçerik
                </label>
                <textarea
                  rows={4}
                  value={secContent}
                  onChange={(e) => setSecContent(e.target.value)}
                  placeholder="Bölüm içeriğini girin..."
                  className="w-full p-3 rounded-2xl text-xs bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] outline-none resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 shadow-xs"
                >
                  Bölüm Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
