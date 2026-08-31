import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  BarChart3,
  BookOpen,
  Cpu,
  FileText,
  Image as ImageIcon,
  List as ListIcon,
  Table as TableIcon,
} from 'lucide-react';
import { FilledSection, GeneratedDiagram } from '../api/client';
import { ChartSection } from './ChartSection';
import { DiagramView } from './DiagramView';
import { ImageGallerySection } from './ImageGallerySection';
import { ModuleListView } from './ModuleListView';

interface SectionCardProps {
  section: FilledSection;
  diagram?: GeneratedDiagram;
  index: number;
}

export const SectionCard: React.FC<SectionCardProps> = ({ section, diagram, index }) => {
  const getIcon = () => {
    switch (section.content_type) {
      case 'table':
        return <TableIcon className="w-4 h-4 text-[#0A0A0A] dark:text-white" />;
      case 'list':
        return <ListIcon className="w-4 h-4 text-[#0A0A0A] dark:text-white" />;
      case 'module_list':
        return <Cpu className="w-4 h-4 text-[#0A0A0A] dark:text-white" />;
      case 'image_gallery':
        return <ImageIcon className="w-4 h-4 text-[#0A0A0A] dark:text-white" />;
      case 'chart':
        return <BarChart3 className="w-4 h-4 text-[#0A0A0A] dark:text-white" />;
      default:
        return <FileText className="w-4 h-4 text-[#0A0A0A] dark:text-white" />;
    }
  };

  // Diagram from prop or attached to section JSON
  const activeDiagram = diagram || section.diagram;
  const mermaidCode = activeDiagram?.mermaid_code || (activeDiagram as any)?.code;

  return (
    <article className="group p-7 rounded-2xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-200 mb-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center font-mono text-xs font-semibold text-[#0A0A0A] dark:text-white">
            {index + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {getIcon()}
              <h2 className="font-serif text-2xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
                {section.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Source References */}
        {section.sources && section.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center opacity-80 group-hover:opacity-100 transition-opacity duration-200">
            <BookOpen className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
            {section.sources.map((src, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.05] text-black/60 dark:text-white/60 border border-black/[0.04] dark:border-white/[0.06]"
                title={src.section_title}
              >
                s. {src.page} · {src.section_title.length > 20 ? `${src.section_title.slice(0, 20)}...` : src.section_title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content Rendering with KaTeX LaTeX Support */}
      <div className="pt-5 text-sm text-[#0A0A0A]/90 dark:text-white/90 leading-relaxed font-sans">
        {section.content_type === 'prose' && (
          <div className="prose dark:prose-invert max-w-none prose-p:my-2.5 prose-headings:font-serif prose-headings:font-medium">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {section.content?.text || ''}
            </ReactMarkdown>
          </div>
        )}

        {section.content_type === 'module_list' && (
          <ModuleListView content={section.content as any} />
        )}

        {section.content_type === 'list' && (
          <ul className="space-y-2.5 my-2">
            {section.content?.items?.map((item: any, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] dark:bg-white mt-2 shrink-0" />
                <div className="flex-1 prose prose-sm dark:prose-invert max-w-none prose-p:my-0">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {typeof item === 'string' ? item : JSON.stringify(item)}
                  </ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        )}

        {section.content_type === 'table' && (
          <div className="overflow-x-auto my-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-black/[0.02] dark:bg-white/[0.03] border-b border-black/[0.06] dark:border-white/[0.08] text-black/60 dark:text-white/60 font-medium">
                <tr>
                  {section.content?.columns?.map((col: any, i: number) => (
                    <th key={i} className="px-4 py-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {section.content?.rows?.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    {row.map((cell: any, cIdx: number) => (
                      <td key={cIdx} className="px-4 py-3">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {String(cell || '')}
                        </ReactMarkdown>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section.content_type === 'image_gallery' && (
          <div className="my-2">
            <ImageGallerySection images={section.content?.images || []} />
          </div>
        )}

        {section.content_type === 'chart' && (
          <div className="my-2">
            <ChartSection data={section.content as any} />
          </div>
        )}

        {section.content_type === 'error' && (
          <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 dark:bg-amber-500/[0.08] text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>
                {section.content?.message || 'Bu bölüm üretilirken bir gecikme oluştu. Lütfen yeniden deneyin.'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Render Attached Diagram (Mermaid) */}
      {mermaidCode && (
        <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
          <DiagramView mermaidCode={mermaidCode} title="Diyagram / Akış Şeması" />
        </div>
      )}
    </article>
  );
};
