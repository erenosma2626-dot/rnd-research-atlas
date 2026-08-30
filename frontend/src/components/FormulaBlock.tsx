import React from 'react';
import { BlockMath } from 'react-katex';
import { ExtractedFormula } from '../api/client';

interface FormulaBlockProps {
  formula: ExtractedFormula;
  index?: number;
}

export const FormulaBlock: React.FC<FormulaBlockProps> = ({ formula, index }) => {
  const latex = formula.latex_code || formula.raw_text;

  return (
    <div className="my-3 p-4 rounded-xl bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark transition-colors duration-apple">
      <div className="flex items-center justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2">
        <span className="font-medium">
          {index !== undefined ? `Formül #${index + 1}` : 'Matematiksel Formül'}
        </span>
        <span className="bg-surface-light dark:bg-surface-dark px-2 py-0.5 rounded-md border border-border-light dark:border-border-dark">
          Sayfa {formula.page}
        </span>
      </div>

      <div className="overflow-x-auto py-2 text-center select-all">
        {formula.latex_code ? (
          <BlockMath math={latex} />
        ) : (
          <pre className="font-mono text-sm text-left p-2 bg-surface-light dark:bg-surface-dark rounded-lg">
            {formula.raw_text}
          </pre>
        )}
      </div>

      {formula.low_confidence && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
          <span>⚠️</span>
          <span>Doğruluğu teyit edilmemiş (LLM Fallback)</span>
        </div>
      )}
    </div>
  );
};
