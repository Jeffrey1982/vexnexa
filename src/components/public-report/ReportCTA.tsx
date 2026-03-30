import Link from 'next/link';

interface ReportCTAProps {
  normalizedDomain: string;
}

export function ReportCTA({ normalizedDomain }: ReportCTAProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-2xl border border-primary/20 p-8 sm:p-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-foreground mb-3">
          Want to improve your accessibility score?
        </h2>
        <p className="text-gray-600 dark:text-muted-foreground max-w-2xl mx-auto mb-8">
          VexNexa provides continuous WCAG monitoring, branded reports, and actionable remediation
          guidance for agencies and compliance teams.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/wcag-scan"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Rescan {normalizedDomain}
          </Link>
          <Link
            href="/sample-report"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white dark:bg-[var(--surface-2)] border border-gray-300 dark:border-white/10 text-gray-700 dark:text-foreground font-medium hover:bg-gray-50 dark:hover:bg-[var(--surface-3)] transition-colors"
          >
            View Sample Report
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white dark:bg-[var(--surface-2)] border border-gray-300 dark:border-white/10 text-gray-700 dark:text-foreground font-medium hover:bg-gray-50 dark:hover:bg-[var(--surface-3)] transition-colors"
          >
            Start Monitoring
          </Link>
        </div>
      </div>
    </section>
  );
}
