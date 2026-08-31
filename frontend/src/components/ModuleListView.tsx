import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Cpu } from 'lucide-react';

export interface ModuleItem {
  order: number;
  name: string;
  short_label?: string | null;
  description: string;
}

export interface ModuleListContent {
  modules: ModuleItem[];
  flow_summary?: string | null;
}

interface ModuleListViewProps {
  content: ModuleListContent;
}

export const ModuleListView: React.FC<ModuleListViewProps> = ({ content }) => {
  const modules = content?.modules || [];
  const flowSummary = content?.flow_summary;

  if (modules.length === 0) {
    return (
      <div className="text-xs text-black/50 dark:text-white/50 font-mono py-2">
        Modül verisi bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-6 my-3">
      {/* Vertical Stepper Modules */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-black/[0.08] dark:before:bg-white/[0.1]">
        {modules.map((mod, idx) => (
          <div key={idx} className="relative group">
            {/* Step Circle Indicator */}
            <div className="absolute -left-6 top-0 w-6 h-6 rounded-full bg-white dark:bg-[#141414] border-2 border-[#0A0A0A] dark:border-white flex items-center justify-center text-[10px] font-mono font-bold text-[#0A0A0A] dark:text-white shadow-xs z-10">
              {mod.order || idx + 1}
            </div>

            {/* Module Card Content */}
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] group-hover:border-black/20 dark:group-hover:border-white/20 transition-all">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h3 className="text-xs font-semibold text-[#0A0A0A] dark:text-white font-sans tracking-tight">
                  {mod.name}
                </h3>
                {mod.short_label && (
                  <span className="text-[11px] font-mono text-black/50 dark:text-white/50 px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                    {mod.short_label}
                  </span>
                )}
              </div>

              {/* KaTeX Markdown Rendered Description */}
              <div className="text-xs text-black/75 dark:text-white/75 font-sans leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {mod.description}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Flow Summary Banner */}
      {flowSummary && (
        <div className="mt-4 p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-black/40 dark:text-white/40 mb-0.5">
              Veri Akışı Özeti
            </span>
            <p className="text-xs font-mono text-black/80 dark:text-white/80 truncate">
              {flowSummary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
