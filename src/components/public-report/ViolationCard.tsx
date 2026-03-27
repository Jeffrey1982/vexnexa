interface ViolationCardProps {
  violation: {
    id: string;
    impact: string;
    help: string;
    description: string;
    helpUrl: string;
    tags: string[];
    nodeCount: number;
  };
}

const impactColors: Record<string, { badge: string; border: string }> = {
  critical: { badge: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300', border: 'border-l-red-500' },
  serious: { badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300', border: 'border-l-orange-500' },
  moderate: { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300', border: 'border-l-amber-500' },
  minor: { badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300', border: 'border-l-slate-400' },
};

export function ViolationCard({ violation }: ViolationCardProps) {
  const impact = violation.impact || 'minor';
  const colors = impactColors[impact] || impactColors.minor;
  const wcagTags = (violation.tags || []).filter((t: string) => t.startsWith('wcag'));

  return (
    <div className={`bg-white dark:bg-[var(--surface-1)] rounded-xl border border-gray-200 dark:border-white/[0.06] border-l-4 ${colors.border} p-4`}>
      <div className="flex flex-wrap items-start gap-2 mb-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.badge}`}>
          {impact}
        </span>
        {wcagTags.slice(0, 3).map((tag: string) => (
          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            {tag}
          </span>
        ))}
        {violation.nodeCount > 0 && (
          <span className="text-xs text-gray-400 dark:text-muted-foreground ml-auto">
            {violation.nodeCount} element{violation.nodeCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-foreground text-sm mb-1" style={{ overflowWrap: 'anywhere' }}>
        {violation.help}
      </h3>
      {violation.description && (
        <p className="text-sm text-gray-500 dark:text-muted-foreground line-clamp-2">
          {violation.description}
        </p>
      )}
      {violation.helpUrl && (
        <a
          href={violation.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
        >
          Learn how to fix this &rarr;
        </a>
      )}
    </div>
  );
}
