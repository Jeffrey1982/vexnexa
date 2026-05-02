import Link from 'next/link';
import { getFaviconFromUrl } from '@/lib/format';
import { ScoreRing } from './ScoreRing';
import { ImpactBar } from './ImpactBar';
import { ViolationCard } from './ViolationCard';
import { ReportCTA } from './ReportCTA';
import { EAAReadinessSection } from './EAAReadinessSection';
import { StandardsTrustBar } from '@/components/marketing/StandardsTrustBar';
import { TrendMini } from './TrendMini';

interface PublicReportContentProps {
  report: any;
  history: any[];
  normalizedDomain: string;
  isCanonical: boolean;
}

function formatReportDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getScoreLabel(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10' };
  if (score >= 70) return { label: 'Good', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-500/10' };
  if (score >= 50) return { label: 'Needs Improvement', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-500/10' };
  if (score >= 30) return { label: 'Poor', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-500/10' };
  return { label: 'Critical', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-500/10' };
}

export function PublicReportContent({ report, history, normalizedDomain, isCanonical }: PublicReportContentProps) {
  const score = report.score ?? 0;
  const scoreInfo = getScoreLabel(score);
  const faviconUrl = getFaviconFromUrl(`https://${normalizedDomain}`);
  const violations: any[] = report.top_violations || [];
  const summary = report.summary || {};
  const scanDate = formatReportDate(report.published_at || report.created_at);
  const totalIssues = report.issues_total || 0;

  return (
    <div className="bg-gray-50 dark:bg-[var(--surface-0)]">
      {/* Hero Section */}
      <section className="bg-white dark:bg-[var(--surface-1)] border-b border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            {/* Google favicon URLs are dynamic per scanned domain; keep this as a plain eager image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={faviconUrl}
              alt=""
              width={32}
              height={32}
              className="rounded"
              loading="eager"
            />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-foreground tracking-tight">
                Accessibility Report for {normalizedDomain}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-muted-foreground">
                Last scanned on {scanDate} &middot; Scope: automated scan of selected pages
              </p>
            </div>
          </div>

          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className={`rounded-2xl p-6 ${scoreInfo.bgColor} flex flex-col items-center justify-center`}>
              <ScoreRing score={score} size={120} />
              <p className={`mt-3 text-lg font-semibold ${scoreInfo.color}`}>{scoreInfo.label}</p>
              <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">Accessibility Score</p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[var(--surface-2)] border border-gray-200 dark:border-white/[0.06] p-6">
              <h2 className="text-sm font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider mb-4">Issues by Severity</h2>
              <div className="space-y-3">
                <ImpactBar label="Critical" count={report.impact_critical || 0} color="red" />
                <ImpactBar label="Serious" count={report.impact_serious || 0} color="orange" />
                <ImpactBar label="Moderate" count={report.impact_moderate || 0} color="amber" />
                <ImpactBar label="Minor" count={report.impact_minor || 0} color="slate" />
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-muted-foreground">
                {totalIssues} total issue{totalIssues !== 1 ? 's' : ''} detected
              </p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[var(--surface-2)] border border-gray-200 dark:border-white/[0.06] p-6">
              <h2 className="text-sm font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider mb-4">Compliance</h2>
              <div className="space-y-4">
                {report.wcag_aa_compliance !== null && report.wcag_aa_compliance !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-foreground">WCAG 2.1 AA</span>
                      <span className="text-gray-500 dark:text-muted-foreground">{Math.round(report.wcag_aa_compliance)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, report.wcag_aa_compliance)}%` }} />
                    </div>
                  </div>
                )}
                {report.wcag_aaa_compliance !== null && report.wcag_aaa_compliance !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-foreground">WCAG 2.1 AAA</span>
                      <span className="text-gray-500 dark:text-muted-foreground">{Math.round(report.wcag_aaa_compliance)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, report.wcag_aaa_compliance)}%` }} />
                    </div>
                  </div>
                )}
                {report.total_scans > 1 && (
                  <p className="text-xs text-gray-400 dark:text-muted-foreground mt-2">
                    This domain has been scanned {report.total_scans} times
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Was Checked */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4">What Was Checked</h2>
        <div className="bg-white dark:bg-[var(--surface-1)] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-6">
          <p className="text-gray-700 dark:text-foreground/80 leading-relaxed">
            This report is based on an automated accessibility scan of <strong>{normalizedDomain}</strong> using
            axe-core, the industry-standard accessibility testing engine. The scan checks for violations of
            the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA and AAA, covering areas such as
            color contrast, keyboard navigation, form labels, image alt text, ARIA attributes, and more.
          </p>
          <p className="text-gray-600 dark:text-foreground/70 leading-relaxed mt-3">
            <strong>Scope:</strong> This is an automated scan of selected pages and does not represent a full
            manual accessibility audit. Some accessibility issues can only be identified through human review.
          </p>
        </div>
      </section>

      {/* What This Means */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4">What This Means</h2>
        <div className="bg-white dark:bg-[var(--surface-1)] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-6">
          {score >= 80 ? (
            <p className="text-gray-700 dark:text-foreground/80 leading-relaxed">
              <strong>{normalizedDomain}</strong> demonstrates strong accessibility practices with a score of{' '}
              <strong>{score}/100</strong>. While no automated scan can guarantee full compliance, this site
              appears to follow many WCAG best practices. Regular monitoring is recommended to maintain these
              standards.
            </p>
          ) : score >= 50 ? (
            <p className="text-gray-700 dark:text-foreground/80 leading-relaxed">
              <strong>{normalizedDomain}</strong> has some accessibility issues that should be addressed.
              With a score of <strong>{score}/100</strong>, there are opportunities for improvement,
              particularly in areas marked as critical or serious. Fixing these issues can improve the
              experience for users with disabilities and reduce legal risk.
            </p>
          ) : (
            <p className="text-gray-700 dark:text-foreground/80 leading-relaxed">
              <strong>{normalizedDomain}</strong> has significant accessibility issues that need attention.
              With a score of <strong>{score}/100</strong>, several critical barriers were detected that
              may prevent users with disabilities from accessing content. We recommend prioritizing fixes
              for critical and serious issues first.
            </p>
          )}
        </div>
      </section>

      {/* Top Findings */}
      {violations.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4">
            Top Findings
          </h2>
          <div className="space-y-3">
            {violations.slice(0, 8).map((v: any, i: number) => (
              <ViolationCard key={`${v.id}-${i}`} violation={v} />
            ))}
          </div>
          {violations.length > 8 && (
            <p className="mt-4 text-sm text-gray-500 dark:text-muted-foreground">
              And {violations.length - 8} more issue{violations.length - 8 !== 1 ? 's' : ''} detected...
            </p>
          )}
        </section>
      )}

      <EAAReadinessSection
        score={score}
        scannedDomain={normalizedDomain}
        issueCounts={{
          critical: report.impact_critical,
          serious: report.impact_serious,
          moderate: report.impact_moderate,
          minor: report.impact_minor,
          total: totalIssues,
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <StandardsTrustBar
          variant="compact"
          showHeading={false}
          inset
          className="bg-white/70 dark:bg-[var(--surface-1)]/90 border-gray-200 dark:border-white/[0.08]"
        />
      </div>

      {/* Score Trend (if history available) */}
      {history.length > 1 && isCanonical && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4">Score History</h2>
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-6">
            <TrendMini history={history} />
          </div>
        </section>
      )}

      {/* WCAG Explainer */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4">Understanding WCAG</h2>
        <div className="bg-white dark:bg-[var(--surface-1)] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-foreground mb-2">What is WCAG?</h3>
              <p className="text-gray-600 dark:text-foreground/70 text-sm leading-relaxed">
                The Web Content Accessibility Guidelines (WCAG) are an internationally recognized set of
                recommendations for making web content more accessible to people with disabilities. WCAG 2.1
                Level AA is the most commonly referenced standard for legal compliance.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-foreground mb-2">Why It Matters</h3>
              <p className="text-gray-600 dark:text-foreground/70 text-sm leading-relaxed">
                Over 1 billion people worldwide live with some form of disability. Making your website
                accessible isn&apos;t just good practice — it&apos;s increasingly a legal requirement under regulations
                like the European Accessibility Act (EAA), ADA, and Section 508.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Fix */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4">How to Fix These Issues</h2>
        <div className="bg-white dark:bg-[var(--surface-1)] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-red-600 dark:text-red-400 font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-foreground mb-1">Fix Critical First</h3>
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                Address critical and serious issues first — they have the biggest impact on users.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-foreground mb-1">Rescan Regularly</h3>
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                Accessibility issues can reappear with code changes. Regular scanning catches regressions early.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-foreground mb-1">Monitor Continuously</h3>
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                Set up automated monitoring to stay compliant and catch issues before users do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <ReportCTA normalizedDomain={normalizedDomain} />

      {/* Internal Links */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/wcag-scan" className="text-sm text-gray-500 dark:text-muted-foreground hover:text-primary transition-colors underline underline-offset-2">
            Free WCAG Scanner
          </Link>
          <span className="text-gray-300 dark:text-white/20">&middot;</span>
          <Link href="/website-accessibility-checker" className="text-sm text-gray-500 dark:text-muted-foreground hover:text-primary transition-colors underline underline-offset-2">
            Website Accessibility Checker
          </Link>
          <span className="text-gray-300 dark:text-white/20">&middot;</span>
          <Link href="/wcag-compliance-report" className="text-sm text-gray-500 dark:text-muted-foreground hover:text-primary transition-colors underline underline-offset-2">
            WCAG Compliance Reports
          </Link>
          <span className="text-gray-300 dark:text-white/20">&middot;</span>
          <Link href="/white-label-accessibility-reports" className="text-sm text-gray-500 dark:text-muted-foreground hover:text-primary transition-colors underline underline-offset-2">
            White-Label Reports
          </Link>
          <span className="text-gray-300 dark:text-white/20">&middot;</span>
          <Link href="/eaa-compliance-monitoring" className="text-sm text-gray-500 dark:text-muted-foreground hover:text-primary transition-colors underline underline-offset-2">
            EAA Compliance
          </Link>
        </div>
      </section>

      {/* Trust Footer */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            This report was generated by an automated accessibility scanner powered by VexNexa.
            Automated scans can identify many common WCAG violations but do not replace a comprehensive
            manual audit by an accessibility professional. Results should be used as a starting point for
            improving web accessibility. Last updated: {scanDate}.
          </p>
          <p className="text-xs text-gray-400 dark:text-muted-foreground mt-2">
            Scanned by <Link href="/" className="text-primary hover:underline">VexNexa</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
