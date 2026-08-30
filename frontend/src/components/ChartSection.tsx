import React from 'react';

export interface ChartSeries {
  name: string;
  values: number[];
}

export interface ChartDataProps {
  chart_type: 'bar' | 'line' | string;
  x_labels: string[];
  series: ChartSeries[];
  y_axis_label?: string;
  title?: string;
}

export const ChartSection: React.FC<{ data: ChartDataProps }> = ({ data }) => {
  const { chart_type, x_labels, series, y_axis_label, title } = data;

  if (!series || series.length === 0 || !x_labels || x_labels.length === 0) {
    return (
      <div className="p-4 text-xs text-black/50 dark:text-white/50 italic text-center font-mono">
        Sayısal grafik verisi bulunamadı.
      </div>
    );
  }

  // Find global min and max
  let allValues: number[] = [];
  series.forEach((s) => {
    allValues = allValues.concat(s.values || []);
  });
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  return (
    <div className="w-full space-y-4 p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-base font-medium tracking-tight text-[#0A0A0A] dark:text-white">
            {title}
          </h4>
          {y_axis_label && (
            <span className="text-[11px] font-mono text-black/40 dark:text-white/40">
              ({y_axis_label})
            </span>
          )}
        </div>
      )}

      {/* Bar Chart Visualization */}
      {chart_type === 'bar' ? (
        <div className="space-y-6 pt-2">
          {x_labels.map((label, xIdx) => (
            <div key={xIdx} className="space-y-1.5">
              <div className="text-xs font-semibold text-black/75 dark:text-white/75 font-mono">
                {label}
              </div>
              <div className="space-y-1">
                {series.map((s, sIdx) => {
                  const val = s.values[xIdx] ?? 0;
                  const pct = Math.min(100, Math.max(4, ((val - minVal) / range) * 100));
                  return (
                    <div key={sIdx} className="flex items-center gap-3 text-xs">
                      <span className="w-24 truncate text-[11px] text-black/50 dark:text-white/50 font-mono">
                        {s.name}
                      </span>
                      <div className="flex-1 h-5 bg-black/[0.04] dark:bg-white/[0.06] rounded-full overflow-hidden flex items-center p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-[#0A0A0A] dark:bg-white flex items-center justify-end pr-2"
                          style={{
                            width: `${pct}%`,
                          }}
                        >
                          <span className="text-[10px] font-mono font-bold text-white dark:text-[#0A0A0A]">
                            {typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(2)) : val}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Line / Metric Table Visualization */
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-xs text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-black/[0.08] dark:border-white/[0.1] text-black/60 dark:text-white/60 font-mono text-[11px]">
                <th className="py-2 px-3">Metrik / Koşul</th>
                {x_labels.map((xl, i) => (
                  <th key={i} className="py-2 px-3 text-right">
                    {xl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series.map((s, sIdx) => (
                <tr
                  key={sIdx}
                  className="border-b border-black/[0.04] dark:border-white/[0.06] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <td className="py-2.5 px-3 font-semibold text-[#0A0A0A] dark:text-white font-mono">
                    {s.name}
                  </td>
                  {s.values.map((v, vIdx) => (
                    <td key={vIdx} className="py-2.5 px-3 text-right font-mono text-black/80 dark:text-white/80">
                      {typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(3)) : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
        {series.map((s, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-[11px] font-mono text-black/60 dark:text-white/60">
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#0A0A0A] dark:bg-white"
            />
            <span>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
