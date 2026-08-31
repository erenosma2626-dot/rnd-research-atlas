import React, { memo, useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Cpu,
  FileText,
  Image as ImageIcon,
  List as ListIcon,
  Table as TableIcon,
  Trash2,
} from 'lucide-react';
import { ChartSection } from '../ChartSection';
import { ImageGallerySection } from '../ImageGallerySection';
import { ModuleListView } from '../ModuleListView';

export interface SectionBoxNodeData {
  section_id: string;
  itemId?: string;
  report_id?: string;
  document_id?: string;
  title: string;
  content_type: 'prose' | 'table' | 'list' | 'module_list' | 'image_gallery' | 'chart' | 'error' | string;
  content: Record<string, any>;
  order?: number;
  width?: number;
  height?: number;
  is_expanded?: boolean;
  figures?: any[];
  key_finding?: string | null;
  diagram?: any;
  onDelete?: (sectionId: string) => void;
  onRemoveFromCanvas?: () => void;
  onResizeStop?: (id: string, width: number, height: number, x: number, y: number) => void;
  onToggleExpand?: (id: string, isExpanded: boolean) => void;
  onRenameTitle?: (id: string, newTitle: string) => void;
}

export const SectionBoxNode: React.FC<NodeProps<SectionBoxNodeData>> = memo(({ id, data, selected }) => {
  const {
    title: initialTitle,
    content_type,
    content,
    order,
    itemId,
    is_expanded: initialExpanded = false,
    figures = [],
    key_finding,
    onRemoveFromCanvas,
    onResizeStop,
    onToggleExpand,
    onRenameTitle,
  } = data;

  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(initialTitle || 'Bölüm');

  const nodeItemId = itemId || id;

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== initialTitle) {
      onRenameTitle?.(nodeItemId, trimmed);
    } else {
      setTitleValue(initialTitle || 'Bölüm');
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    onToggleExpand?.(nodeItemId, nextState);
  };

  const getIcon = () => {
    switch (content_type) {
      case 'table':
        return <TableIcon className="w-3.5 h-3.5 text-black/70 dark:text-white/70" />;
      case 'list':
        return <ListIcon className="w-3.5 h-3.5 text-black/70 dark:text-white/70" />;
      case 'module_list':
        return <Cpu className="w-3.5 h-3.5 text-black/70 dark:text-white/70" />;
      case 'image_gallery':
        return <ImageIcon className="w-3.5 h-3.5 text-black/70 dark:text-white/70" />;
      case 'chart':
        return <BarChart3 className="w-3.5 h-3.5 text-black/70 dark:text-white/70" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-black/70 dark:text-white/70" />;
    }
  };

  // Section figures from data prop or attached content
  const attachedFigures =
    (figures && figures.length > 0)
      ? figures
      : (content?.figures && Array.isArray(content.figures) ? content.figures : []);

  const attachedKeyFinding = key_finding || content?.key_finding;

  return (
    <div
      className={`relative rounded-2xl bg-white dark:bg-[#141414] border transition-all duration-200 shadow-sm flex flex-col ${
        isExpanded ? 'w-[440px] min-h-[160px]' : 'w-80 min-h-[90px]'
      } ${
        selected
          ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/20 shadow-md'
          : 'border-black/[0.08] dark:border-white/[0.1] hover:border-black/20 dark:hover:border-white/20'
      }`}
      style={{
        width: data.width ? `${data.width}px` : undefined,
        height: data.height ? `${data.height}px` : undefined,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={240}
        minHeight={80}
        lineClassName="border-[#0A0A0A] dark:border-white"
        handleClassName="h-2.5 w-2.5 bg-white dark:bg-[#0A0A0A] border-2 border-[#0A0A0A] dark:border-white rounded-xs"
        onResizeEnd={(_e, params) => {
          if (onResizeStop) {
            onResizeStop(nodeItemId, params.width, params.height, params.x, params.y);
          }
        }}
      />

      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-black dark:!bg-white" />

      {/* Header with Expand Button and Inline Editable Title */}
      <div className="p-3 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2 bg-black/[0.01] dark:bg-white/[0.02] rounded-t-2xl shrink-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Expand / Collapse Chevron Button */}
          <button
            type="button"
            onClick={handleToggleExpand}
            className="p-1 rounded-md text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors shrink-0"
            title={isExpanded ? 'İçeriği Daralt' : 'Tam İçeriği Göster (Genişlet)'}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="w-5 h-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[10px] font-mono font-semibold shrink-0">
            {order || 1}
          </div>

          <div className="shrink-0">{getIcon()}</div>

          {/* Inline Editable Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={titleValue}
              autoFocus
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTitleValue(initialTitle || 'Bölüm');
                  setIsEditingTitle(false);
                }
              }}
              className="w-full px-1.5 py-0.5 text-xs font-serif font-medium rounded bg-black/[0.04] dark:bg-white/[0.06] border border-black/20 dark:border-white/20 text-[#0A0A0A] dark:text-white outline-none"
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              className="font-serif text-xs font-medium tracking-tight text-[#0A0A0A] dark:text-white truncate cursor-text select-none"
              title="Başlığı değiştirmek için çift tıklayın"
            >
              {titleValue}
            </span>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {onRemoveFromCanvas && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromCanvas();
              }}
              className="p-1 rounded-md text-black/40 hover:text-rose-600 dark:text-white/40 dark:hover:text-rose-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
              title="Tuvalden Kaldır"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3.5 flex-1 overflow-y-auto text-xs text-black/80 dark:text-white/80 font-sans space-y-2.5">
        {!content || (typeof content === 'object' && Object.keys(content).length === 0 && !content?.text) ? (
          <div className="py-2 text-[11px] text-black/50 dark:text-white/50 italic flex items-center gap-1.5">
            <span>⚠️</span>
            <span>Bu bölümün içeriği bulunamadı veya kaynaktan kaldırılmış.</span>
          </div>
        ) : !isExpanded ? (
          /* Collapsed Mode (Compact Preview) */
          <div>
            {content_type === 'prose' && (
              <p className="line-clamp-2 leading-relaxed text-black/70 dark:text-white/70">
                {content?.text || '(Boş metin)'}
              </p>
            )}

            {content_type === 'list' && (
              <ul className="space-y-1 text-black/70 dark:text-white/70">
                {content?.items && content.items.length > 0 ? (
                  content.items.slice(0, 2).map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5 line-clamp-1">
                      <span className="w-1 h-1 rounded-full bg-[#0A0A0A] dark:bg-white mt-1.5 shrink-0" />
                      <span className="truncate">{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[11px] text-black/40 dark:text-white/40 italic">Liste boş</li>
                )}
              </ul>
            )}

            {content_type === 'module_list' && (
              <div className="text-[11px] font-mono text-black/60 dark:text-white/60">
                {content?.modules?.length || 0} Modül Bileşeni
              </div>
            )}

            {content_type === 'table' && (
              <div className="text-[11px] font-mono text-black/60 dark:text-white/60">
                Tablo: {content?.rows?.length || 0} satır, {content?.columns?.length || 0} sütun
              </div>
            )}

            {content_type === 'image_gallery' && (
              <div className="text-[11px] font-mono text-black/60 dark:text-white/60">
                Görsel Galerisi ({content?.images?.length || 0} Görsel)
              </div>
            )}

            {content_type === 'chart' && (
              <div className="text-[11px] font-mono text-black/60 dark:text-white/60">
                📊 Sayısal Grafik: {content?.series?.length || 0} Seri
              </div>
            )}

            {attachedKeyFinding && (
              <p className="text-[11px] italic text-black/60 dark:text-white/60 truncate mt-1">
                "{attachedKeyFinding}"
              </p>
            )}
          </div>
        ) : (
          /* Expanded Mode (Full Rich Section Content) */
          <div className="space-y-3">
            {/* Prose Content with Markdown & LaTeX */}
            {content_type === 'prose' && (
              <div className="prose dark:prose-invert prose-xs max-w-none leading-relaxed text-[#0A0A0A]/90 dark:text-white/90">
                {content?.text ? (
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {content.text}
                  </ReactMarkdown>
                ) : (
                  <p className="text-[11px] text-black/40 dark:text-white/40 italic">Metin içeriği bulunmuyor.</p>
                )}
              </div>
            )}

            {/* Module List Content */}
            {content_type === 'module_list' && (
              <ModuleListView content={content as any} />
            )}

            {/* List Content */}
            {content_type === 'list' && (
              <ul className="space-y-1.5 my-1 text-black/85 dark:text-white/85">
                {content?.items?.map((item: any, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] dark:bg-white mt-1.5 shrink-0" />
                    <span>{typeof item === 'string' ? item : item?.text || JSON.stringify(item)}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Table Content */}
            {content_type === 'table' && content?.columns && (
              <div className="overflow-x-auto my-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08]">
                <table className="w-full text-[11px] text-left border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03]">
                      {content.columns.map((col: string, i: number) => (
                        <th key={i} className="py-1.5 px-2.5 font-medium text-[#0A0A0A] dark:text-white">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {content.rows?.map((row: any[], rI: number) => (
                      <tr key={rI} className="border-b border-black/[0.03] dark:border-white/[0.04]">
                        {row.map((cell: any, cI: number) => (
                          <td key={cI} className="py-1.5 px-2.5 text-black/80 dark:text-white/80">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Image Gallery */}
            {content_type === 'image_gallery' && (
              <ImageGallerySection images={content?.images || []} />
            )}

            {/* Chart Section */}
            {content_type === 'chart' && (
              <ChartSection data={content as any} />
            )}

            {/* Attached Key Finding */}
            {attachedKeyFinding && (
              <blockquote className="my-2 pl-3 border-l-2 border-[#0A0A0A] dark:border-white text-[11px] italic bg-black/[0.02] dark:bg-white/[0.03] p-2 rounded-r-lg">
                “{attachedKeyFinding}”
              </blockquote>
            )}

            {/* Contextual Figures */}
            {attachedFigures && attachedFigures.length > 0 && content_type !== 'image_gallery' && (
              <div className="mt-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachedFigures.map((fig: any, fIdx: number) => (
                    <div
                      key={fIdx}
                      className="rounded-lg overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] p-1.5"
                    >
                      <a
                        href={fig.image_url || fig.image_storage_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded bg-white dark:bg-black/20"
                      >
                        <img
                          src={fig.image_url || fig.image_storage_path}
                          alt={fig.caption || `Şekil ${fIdx + 1}`}
                          className="w-full h-auto object-contain max-h-36 hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </a>
                      {fig.caption && (
                        <p className="text-[10px] text-black/60 dark:text-white/60 mt-1 px-0.5 truncate">
                          {fig.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-black dark:!bg-white" />
    </div>
  );
});

SectionBoxNode.displayName = 'SectionBoxNode';
