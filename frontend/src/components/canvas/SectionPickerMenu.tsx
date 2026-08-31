import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Cpu,
  FileText,
  GripVertical,
  Image as ImageIcon,
  List as ListIcon,
  Loader2,
  Table as TableIcon,
  X,
} from 'lucide-react';
import { FilledSection, getDocumentReport } from '../../api/client';

interface SectionPickerMenuProps {
  documentId: string;
  documentTitle: string;
  onClose: () => void;
}

export const SectionPickerMenu: React.FC<SectionPickerMenuProps> = ({
  documentId,
  documentTitle,
  onClose,
}) => {
  const [sections, setSections] = useState<FilledSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSections = async () => {
      setLoading(true);
      setError(null);
      try {
        const report = await getDocumentReport(documentId);
        if (isMounted) {
          setSections(report.sections || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Bölümler yüklenemedi');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSections();
    return () => {
      isMounted = false;
    };
  }, [documentId]);

  // Click outside listener to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    // Delay adding listener to avoid immediate close
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleOutsideClick);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose]);

  const getIcon = (contentType: string) => {
    switch (contentType) {
      case 'table':
        return <TableIcon className="w-3 h-3 text-indigo-500" />;
      case 'list':
        return <ListIcon className="w-3 h-3 text-emerald-500" />;
      case 'module_list':
        return <Cpu className="w-3 h-3 text-purple-500" />;
      case 'image_gallery':
        return <ImageIcon className="w-3 h-3 text-amber-500" />;
      case 'chart':
        return <BarChart3 className="w-3 h-3 text-rose-500" />;
      default:
        return <FileText className="w-3 h-3 text-blue-500" />;
    }
  };

  const handleDragStart = (e: React.DragEvent, sec: FilledSection, index: number) => {
    const secId = sec.id || sec.outline_id || sec.group_id || `sec-${index}`;
    const payload = {
      documentId,
      documentTitle,
      sectionId: secId,
      title: sec.title,
      contentType: sec.content_type || 'prose',
      content: sec.content || {},
      order: sec.order || index + 1,
      figures: sec.figures || [],
      key_finding: sec.key_finding,
    };
    e.dataTransfer.setData('application/rnd-section', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="nodrag nopan absolute bottom-full left-0 right-0 mb-3 z-50 w-80 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md rounded-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 cursor-default select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#0A0A0A] dark:text-white font-serif">
            Makale Bölümleri
          </span>
          {sections.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-black/60 dark:text-white/60 font-mono">
              {sections.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          title="Kapat"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[10px] text-black/50 dark:text-white/50 mb-2 leading-tight">
        İstediğiniz bölümü tuvale sürükleyip bırakın:
      </p>

      {/* Body */}
      {loading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-black/50 dark:text-white/50">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Bölümler yükleniyor...</span>
        </div>
      ) : error ? (
        <div className="py-3 text-center text-xs text-rose-500">{error}</div>
      ) : sections.length === 0 ? (
        <div className="py-4 text-center text-xs text-black/40 dark:text-white/40">
          Rapor henüz üretilmemiş.
        </div>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {sections.map((sec, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={(e) => handleDragStart(e, sec, idx)}
              className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] cursor-grab active:cursor-grabbing transition-all select-none hover:shadow-xs"
              title="Tuvale sürükleyin"
            >
              <div className="flex items-center gap-2 min-w-0">
                <GripVertical className="w-3 h-3 text-black/25 dark:text-white/25 group-hover:text-black/60 dark:group-hover:text-white/60 shrink-0" />
                {getIcon(sec.content_type)}
                <span className="text-xs text-[#0A0A0A] dark:text-white font-medium truncate">
                  {sec.title}
                </span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-black/50 dark:text-white/50 font-mono shrink-0">
                Sürükle
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
