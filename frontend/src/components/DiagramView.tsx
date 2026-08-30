import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../theme/ThemeContext';

interface DiagramViewProps {
  mermaidCode: string;
  title?: string;
}

export const DiagramView: React.FC<DiagramViewProps> = ({ mermaidCode, title }) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setError(null);
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'neutral',
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif',
        });

        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, mermaidCode);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Diyagram render edilirken hata oluştu.');
        }
      }
    };

    if (mermaidCode) {
      renderDiagram();
    }

    return () => {
      isMounted = false;
    };
  }, [mermaidCode, theme]);

  return (
    <div className="mt-4 p-4 rounded-xl bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark transition-colors duration-apple">
      {title && (
        <div className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-3">
          {title}
        </div>
      )}

      {error ? (
        <div className="text-xs text-red-500 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
          {error}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="overflow-x-auto flex justify-center py-2 [&>svg]:max-w-full [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
};
