import React, { useState, useRef } from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { FileText, Sigma, TrendingUp } from 'lucide-react';

interface NodeItem {
  id: 'paper' | 'math' | 'stat';
  x: number;
  y: number;
}

export const InteractiveMiniCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NodeItem[]>([
    { id: 'paper', x: 20, y: 30 },
    { id: 'math', x: 380, y: 70 },
    { id: 'stat', x: 180, y: 220 },
  ]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingId(id);
    const node = nodes.find((n) => n.id === id);
    if (!node || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(rect.width - 240, e.clientX - rect.left - dragOffsetRef.current.x));
    const newY = Math.max(0, Math.min(rect.height - 140, e.clientY - rect.top - dragOffsetRef.current.y));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingId ? { ...n, x: newX, y: newY } : n))
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setDraggingId(null);
    }
  };

  // Node center anchors for connecting wires
  const pNode = nodes.find((n) => n.id === 'paper') || nodes[0];
  const mNode = nodes.find((n) => n.id === 'math') || nodes[1];
  const sNode = nodes.find((n) => n.id === 'stat') || nodes[2];

  const c1 = { x: pNode.x + 115, y: pNode.y + 65 };
  const c2 = { x: mNode.x + 130, y: mNode.y + 60 };
  const c3 = { x: sNode.x + 105, y: sNode.y + 55 };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative h-[380px] w-full max-w-3xl mx-auto overflow-hidden select-none cursor-grab active:cursor-grabbing rounded-3xl"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
        backgroundSize: '24px 24px',
        opacity: 0.96,
      }}
    >
      {/* Dynamic Elastic Bezier Wires */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="wire1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="wire2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Paper -> Math wire */}
        <path
          d={`M ${c1.x} ${c1.y} C ${(c1.x + c2.x) / 2} ${c1.y - 30}, ${(c1.x + c2.x) / 2} ${c2.y + 30}, ${c2.x} ${c2.y}`}
          fill="none"
          stroke="url(#wire1)"
          strokeWidth="2"
          strokeDasharray="4 3"
        />

        {/* Math -> Stat wire */}
        <path
          d={`M ${c2.x} ${c2.y} C ${(c2.x + c3.x) / 2} ${c2.y + 30}, ${(c2.x + c3.x) / 2} ${c3.y - 30}, ${c3.x} ${c3.y}`}
          fill="none"
          stroke="url(#wire2)"
          strokeWidth="2"
        />
      </svg>

      {/* NODE 1: TACTILE PAPER SLIP (Distinct Paper Texture & Serif Tone) */}
      <div
        onPointerDown={(e) => handlePointerDown('paper', e)}
        style={{ transform: `translate3d(${pNode.x}px, ${pNode.y}px, 0)` }}
        className={`absolute z-10 w-[230px] p-4 rounded-xl border transition-shadow duration-150 ${
          draggingId === 'paper'
            ? 'bg-[#FBFBFA] dark:bg-[#1C1C1A] border-black/30 dark:border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.18)] scale-[1.02]'
            : 'bg-[#FBFBFA]/95 dark:bg-[#191918]/95 border-[#E6E4DD] dark:border-[#2C2C29] shadow-sm hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-black/[0.05] dark:border-white/[0.05]">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-black/60 dark:text-white/60">
            <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Vaswani et al. (2017)</span>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-wider text-black/40 dark:text-white/40">§ 3.2</span>
        </div>
        <p className="font-serif text-[11px] leading-relaxed text-black/80 dark:text-white/85 line-clamp-3">
          "We compute the attention function on a set of queries simultaneously, packed together into matrix <span className="underline decoration-amber-500/60 decoration-2">Q</span>..."
        </p>
      </div>

      {/* NODE 2: MONOCHROME LATEX MATHEMATICAL SLATE */}
      <div
        onPointerDown={(e) => handlePointerDown('math', e)}
        style={{ transform: `translate3d(${mNode.x}px, ${mNode.y}px, 0)` }}
        className={`absolute z-10 w-[260px] p-4 rounded-2xl border transition-shadow duration-150 ${
          draggingId === 'math'
            ? 'bg-white dark:bg-[#181818] border-black/40 dark:border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.2)] scale-[1.02]'
            : 'bg-white/95 dark:bg-[#141414]/95 border-black/[0.09] dark:border-white/[0.12] shadow-sm hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-black/40 dark:text-white/40">
          <div className="flex items-center gap-1.5 text-indigo-500">
            <Sigma className="w-3.5 h-3.5" />
            <span className="font-semibold text-black/70 dark:text-white/70">Scaled Dot-Product</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06]">KaTeX</span>
        </div>
        <div className="py-2 text-center text-black dark:text-white overflow-hidden text-xs sm:text-[13px]">
          <BlockMath math="\text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V" />
        </div>
        <div className="flex justify-center gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.04] text-[10px] font-mono text-black/50 dark:text-white/50">
          <span>Q: Query</span>
          <span>•</span>
          <span>K: Key</span>
          <span>•</span>
          <span>V: Value</span>
        </div>
      </div>

      {/* NODE 3: EMPIRICAL DISCOVERY CHIP (Benchmark & Metric) */}
      <div
        onPointerDown={(e) => handlePointerDown('stat', e)}
        style={{ transform: `translate3d(${sNode.x}px, ${sNode.y}px, 0)` }}
        className={`absolute z-10 w-[210px] p-3.5 rounded-xl border transition-shadow duration-150 ${
          draggingId === 'stat'
            ? 'bg-white dark:bg-[#1A1A1A] border-black/30 dark:border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.18)] scale-[1.02]'
            : 'bg-white/95 dark:bg-[#151515]/95 border-black/[0.08] dark:border-white/[0.1] shadow-sm hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-black/50 dark:text-white/50">
          <div className="flex items-center gap-1.5 text-amber-500">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-medium text-black/80 dark:text-white/80">WMT 2014 EN-DE</span>
          </div>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">+2.1 SOTA</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-[11px] font-sans text-black/60 dark:text-white/60">Transformer (big)</span>
          <span className="font-mono text-base font-bold text-black dark:text-white">28.4 <span className="text-[10px] font-normal text-black/40 dark:text-white/40">BLEU</span></span>
        </div>
      </div>
    </div>
  );
};
