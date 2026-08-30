import React from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, FileText, List as ListIcon, Table as TableIcon } from 'lucide-react';
import { FilledSection, GeneratedDiagram } from '../api/client';
import { DiagramView } from './DiagramView';

interface SectionCardProps {
  section: FilledSection;
  diagram?: GeneratedDiagram;
  index: number;
}

export const SectionCard: React.FC<SectionCardProps> = ({ section, diagram, index }) => {
  const getIcon = () => {
    switch (section.content_type) {
      case 'table':
        return <TableIcon className="w-4 h-4 text-accent" />;
      case 'list':
        return <ListIcon className="w-4 h-4 text-accent" />;
      default:
        return <FileText className="w-4 h-4 text-accent" />;
    }
  };

  return (
    <article className="p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-all duration-apple mb-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center font-semibold text-xs text-accent">
            {index + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {getIcon()}
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                {section.title}
              </h2>
            </div>
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono">
              {section.group_id}
            </span>
          </div>
        </div>

        {/* Source References */}
        {section.sources && section.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <BookOpen className="w-3.5 h-3.5 text-text-secondary-light dark:text-text-secondary-dark" />
            {section.sources.map((src, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full bg-bg-light dark:bg-bg-dark text-text-secondary-light dark:text-text-secondary-dark border border-border-light dark:border-border-dark"
                title={src.section_title}
              >
                s. {src.page} · {src.section_title.length > 18 ? `${src.section_title.slice(0, 18)}...` : src.section_title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content Rendering */}
      <div className="pt-4 text-sm text-text-primary-light dark:text-text-primary-dark leading-relaxed">
        {section.content_type === 'prose' && (
          <div className="prose dark:prose-invert max-w-none prose-p:my-2 prose-headings:font-semibold">
            <ReactMarkdown>{section.content?.text || ''}</ReactMarkdown>
          </div>
        )}

        {section.content_type === 'list' && (
          <ul className="space-y-2 my-1">
            {section.content?.items?.map((item: any, i: number) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {section.content_type === 'table' && (
          <div className="overflow-x-auto my-2 rounded-xl border border-border-light dark:border-border-dark">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-light dark:bg-bg-dark border-b border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark font-medium">
                <tr>
                  {section.content?.columns?.map((col: any, i: number) => (
                    <th key={i} className="px-4 py-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {section.content?.rows?.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-bg-light/50 dark:hover:bg-bg-dark/50 transition-colors">
                    {row.map((cell: any, cIdx: number) => (
                      <td key={cIdx} className="px-4 py-3">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section.content_type === 'error' && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs">
            {section.content?.error || 'Bu bölüm üretilirken bir hata oluştu.'}
          </div>
        )}
      </div>

      {/* Render Attached Diagram */}
      {diagram && diagram.mermaid_code && (
        <DiagramView mermaidCode={diagram.mermaid_code} title="Diyagram / Akış Şeması" />
      )}
    </article>
  );
};
