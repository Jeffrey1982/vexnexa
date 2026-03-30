import Link from 'next/link';

export default function ReportNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-foreground mb-4">
          Report Not Found
        </h1>
        <p className="text-gray-600 dark:text-muted-foreground mb-8">
          We don&apos;t have a public accessibility report for this domain yet.
          Try scanning it first to generate a report.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/wcag-scan"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Scan a Website
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white dark:bg-[var(--surface-2)] border border-gray-300 dark:border-white/10 text-gray-700 dark:text-foreground font-medium hover:bg-gray-50 dark:hover:bg-[var(--surface-3)] transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
