import React from 'react';

export const DEFAULT_STAGE_LABELS = [
  'Belge Ayrıştırılıyor',
  'Formüller Çıkarılıyor',
  'İçerik Sınıflandırılıyor',
  'Dizine Ekleniyor',
  'Rapor Oluşturuluyor',
];

interface VerticalStepIndicatorProps {
  currentStageIndex: number; // 0 to 4
  stageLabels?: string[];
}

export const VerticalStepIndicator: React.FC<VerticalStepIndicatorProps> = ({
  currentStageIndex,
  stageLabels = DEFAULT_STAGE_LABELS,
}) => {
  return (
    <div className="flex flex-col space-y-0 font-sans">
      {stageLabels.map((label, index) => {
        const isCompleted = index < currentStageIndex;
        const isCurrent = index === currentStageIndex;
        const isLast = index === stageLabels.length - 1;

        return (
          <div key={index} className="flex flex-col">
            {/* Step Row: Dot & Label */}
            <div className="flex items-center gap-3.5">
              {/* Dot */}
              <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
                {isCompleted ? (
                  <div className="w-3.5 h-3.5 rounded-full bg-[#0A0A0A] dark:bg-white flex items-center justify-center text-[8px] text-white dark:text-[#0A0A0A] font-bold shadow-xs">
                    ✓
                  </div>
                ) : isCurrent ? (
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-5 h-5 rounded-full bg-black/10 dark:bg-white/20 animate-ping" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#0A0A0A] dark:bg-white shadow-xs" />
                  </div>
                ) : (
                  <div className="w-3 h-3 rounded-full border-2 border-black/15 dark:border-white/20 bg-transparent" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium tracking-tight transition-colors duration-300 ${
                  isCompleted
                    ? 'text-black/80 dark:text-white/80'
                    : isCurrent
                    ? 'text-[#0A0A0A] dark:text-white font-semibold'
                    : 'text-black/30 dark:text-white/30'
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connecting Bar (unless last item) */}
            {!isLast && (
              <div className="ml-[9px] w-[2px] h-6 my-1 relative bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                {isCompleted && (
                  <div className="absolute inset-0 bg-[#0A0A0A] dark:bg-white rounded-full" />
                )}
                {isCurrent && (
                  <div
                    key={currentStageIndex}
                    className="absolute top-0 left-0 w-full bg-[#0A0A0A] dark:bg-white rounded-full animate-pulse"
                    style={{
                      height: '100%',
                      animation: 'dropProgress 2.2s infinite ease-in-out',
                    }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes dropProgress {
          0% {
            top: 0%;
            height: 0%;
            opacity: 0.3;
          }
          50% {
            top: 0%;
            height: 100%;
            opacity: 1;
          }
          100% {
            top: 100%;
            height: 0%;
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
};
