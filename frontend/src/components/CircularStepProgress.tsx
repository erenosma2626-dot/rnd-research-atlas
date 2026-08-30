import React from 'react';

interface CircularStepProgressProps {
  currentStageIndex: number; // 0 to 4 (or 5 for done)
  totalStages?: number; // default 5
  size?: number;
}

export const CircularStepProgress: React.FC<CircularStepProgressProps> = ({
  currentStageIndex,
  totalStages = 5,
  size = 180,
}) => {
  const strokeWidth = 10;
  const center = size / 2;
  const radius = center - strokeWidth - 6;
  const circumference = 2 * Math.PI * radius;

  // Segment calculations: 5 segments with subtle gap
  const segmentAngle = 360 / totalStages;
  const gapAngle = 5; // degrees gap between segments
  const effectiveAngle = segmentAngle - gapAngle;

  const segmentLength = (effectiveAngle / 360) * circumference;

  // Generate 5 segment paths/circles
  const segments = Array.from({ length: totalStages }, (_, index) => {
    const isCompleted = index < currentStageIndex;
    const isCurrent = index === currentStageIndex;

    // Start angle for each segment (offset by -90 deg to start at top)
    const startAngle = index * segmentAngle - 90 + gapAngle / 2;

    // Convert start angle to dashoffset:
    // strokeDasharray = `${segmentLength} ${circumference - segmentLength}`
    // Rotate each segment individually
    return (
      <circle
        key={index}
        cx={center}
        cy={center}
        r={radius}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
        className={`transition-all duration-500 ease-out ${
          isCompleted
            ? 'stroke-[#0A0A0A] dark:stroke-white opacity-100'
            : isCurrent
            ? 'stroke-[#0A0A0A] dark:stroke-white opacity-85 animate-pulse'
            : 'stroke-black/10 dark:stroke-white/10 opacity-100'
        }`}
        transform={`rotate(${startAngle} ${center} ${center})`}
      />
    );
  });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-black/[0.04] dark:text-white/[0.05]"
        />

        {/* 5 Segmented slices */}
        {segments}
      </svg>

      {/* Center Animated Spinner / Step Counter */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[#0A0A0A] dark:text-white shadow-xs">
          <svg className="w-6 h-6 animate-spin text-[#0A0A0A] dark:text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </div>
        <span className="text-[11px] font-mono font-medium text-black/50 dark:text-white/50 mt-2">
          {Math.min(currentStageIndex + 1, totalStages)} / {totalStages}
        </span>
      </div>
    </div>
  );
};
