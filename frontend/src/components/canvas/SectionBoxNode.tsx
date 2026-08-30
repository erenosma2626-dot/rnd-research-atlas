import React, { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { BarChart3, FileText, Image as ImageIcon, List as ListIcon, Table as TableIcon, Trash2 } from 'lucide-react';

export interface SectionBoxNodeData {
  section_id: string;
  report_id?: string;
  document_id?: string;
  title: string;
  content_type: 'prose' | 'table' | 'list' | 'image_gallery' | 'chart' | 'error' | string;
  content: Record<string, any>;
  order?: number;
  onDelete?: (sectionId: string) => void;
  onRemoveFromCanvas?: () => void;
}

export const SectionBoxNode: React.FC<NodeProps<SectionBoxNodeData>> = memo(({ data, selected }) => {
  const { title, content_type, content, order, onRemoveFromCanvas } = data;

  const getIcon = () => {
    switch (content_type) {
      case 'table':
        return <TableIcon className="w-3.5 h-3.5 text-[#0A0A0A] dark:text-white" />;
      case 'list':
        return <ListIcon className="w-3.5 h-3.5 text-[#0A0A0A] dark:text-white" />;
      case 'image_gallery':
        return <ImageIcon className="w-3.5 h-3.5 text-[#0A0A0A] dark:text-white" />;
      case 'chart':
        return <BarChart3 className="w-3.5 h-3.5 text-[#0A0A0A] dark:text-white" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-[#0A0A0A] dark:text-white" />;
    }
  };

  return (
    <div
      className={`w-80 rounded-2xl bg-white dark:bg-[#141414] border transition-all duration-200 shadow-sm ${
        selected
          ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/20 shadow-md'
          : 'border-black/[0.08] dark:border-white/[0.1] hover:border-black/20 dark:hover:border-white/20'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-black dark:!bg-white" />

      {/* Header */}
      <div className="p-3.5 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2 bg-black/[0.01] dark:bg-white/[0.02] rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[10px] font-mono font-semibold">
            {order || 1}
          </div>
          {getIcon()}
          <span className="font-serif text-xs font-medium tracking-tight text-[#0A0A0A] dark:text-white truncate">
            {title}
          </span>
        </div>

        {onRemoveFromCanvas && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromCanvas();
            }}
            className="p-1 rounded-md text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            title="Tuvalden Kaldır"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Content Preview */}
      <div className="p-3.5 max-h-60 overflow-y-auto text-xs text-black/80 dark:text-white/80 font-sans space-y-2">
        {content_type === 'prose' && (
          <p className="line-clamp-4 leading-relaxed">
            {content?.text || '(Boş metin)'}
          </p>
        )}

        {content_type === 'list' && (
          <ul className="space-y-1">
            {content?.items?.slice(0, 3).map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-1.5 line-clamp-1">
                <span className="w-1 h-1 rounded-full bg-[#0A0A0A] dark:bg-white mt-1.5 shrink-0" />
                <span className="truncate">{item}</span>
              </li>
            ))}
          </ul>
        )}

        {content_type === 'table' && (
          <div className="text-[11px] font-mono text-black/60 dark:text-white/60">
            Tablo: {content?.rows?.length || 0} satır, {content?.columns?.length || 0} sütun
          </div>
        )}

        {content_type === 'image_gallery' && (
          <div className="grid grid-cols-2 gap-1.5">
            {content?.images?.slice(0, 2).map((img: any, i: number) => (
              <img
                key={i}
                src={img.image_url}
                alt="Görsel"
                className="h-16 w-full object-cover rounded-lg bg-black/[0.02]"
              />
            ))}
          </div>
        )}

        {content_type === 'chart' && (
          <div className="text-[11px] font-mono text-black/60 dark:text-white/60">
            📊 Sayısal Grafik: {content?.series?.length || 0} Seri
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-black dark:!bg-white" />
    </div>
  );
});
