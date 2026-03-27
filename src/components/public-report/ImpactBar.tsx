interface ImpactBarProps {
  label: string;
  count: number;
  color: 'red' | 'orange' | 'amber' | 'slate';
}

const colorMap: Record<string, { bg: string; fill: string; text: string }> = {
  red: { bg: 'bg-red-100 dark:bg-red-500/10', fill: 'bg-red-500', text: 'text-red-700 dark:text-red-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-500/10', fill: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-500/10', fill: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  slate: { bg: 'bg-slate-100 dark:bg-slate-500/10', fill: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400' },
};

export function ImpactBar({ label, count, color }: ImpactBarProps) {
  const c = colorMap[color] || colorMap.slate;

  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm font-medium w-20 ${c.text}`}>{label}</span>
      <div className={`flex-1 h-2 rounded-full ${c.bg}`}>
        {count > 0 && (
          <div
            className={`h-2 rounded-full ${c.fill} transition-all duration-500`}
            style={{ width: `${Math.min(100, count * 10)}%` }}
          />
        )}
      </div>
      <span className="text-sm font-semibold text-gray-700 dark:text-foreground w-8 text-right">{count}</span>
    </div>
  );
}
