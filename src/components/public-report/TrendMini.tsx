interface TrendMiniProps {
  history: Array<{
    id: string;
    score: number | null;
    issues_total: number;
    published_at: string | Date;
  }>;
}

export function TrendMini({ history }: TrendMiniProps) {
  const sorted = [...history].reverse();
  const maxScore = 100;
  const barHeight = 40;

  if (sorted.length < 2) return null;

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-muted-foreground mb-4">
        Score trend across the last {sorted.length} scans
      </p>
      <div className="flex items-end gap-2" style={{ height: barHeight + 24 }}>
        {sorted.map((entry, i) => {
          const score = entry.score ?? 0;
          const height = Math.max(4, (score / maxScore) * barHeight);
          const isLatest = i === sorted.length - 1;
          const date = new Date(entry.published_at);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          let barColor = 'bg-gray-300 dark:bg-white/20';
          if (score >= 80) barColor = 'bg-emerald-500';
          else if (score >= 50) barColor = 'bg-amber-500';
          else barColor = 'bg-red-500';

          if (isLatest) barColor += ' ring-2 ring-primary/30';

          return (
            <div key={entry.id} className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <span className="text-[10px] font-medium text-gray-500 dark:text-muted-foreground">
                {score}
              </span>
              <div
                className={`w-full max-w-[32px] rounded-t ${barColor} transition-all duration-300`}
                style={{ height }}
                title={`Score: ${score} on ${dateStr}`}
              />
              <span className="text-[9px] text-gray-400 dark:text-muted-foreground truncate w-full text-center">
                {dateStr}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
