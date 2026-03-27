interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 120 }: ScoreRingProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number): string => {
    if (s >= 90) return '#10b981';
    if (s >= 70) return '#22c55e';
    if (s >= 50) return '#f59e0b';
    if (s >= 30) return '#f97316';
    return '#ef4444';
  };

  const color = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          className="text-gray-200 dark:text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-foreground">{score}</span>
        <span className="text-xs text-gray-500 dark:text-muted-foreground">/100</span>
      </div>
    </div>
  );
}
