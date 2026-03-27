import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLatestPublicReport, getPublicReportHistory } from '@/lib/public-reports';
import { slugToDomain, getPublicReportUrl } from '@/lib/domain-utils';
import { PublicReportContent } from '@/components/public-report/PublicReportContent';

interface PageProps {
  params: Promise<{ domain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain: slug } = await params;
  const normalizedDomain = slugToDomain(decodeURIComponent(slug));
  const report = await getLatestPublicReport(normalizedDomain);
  const canonicalUrl = getPublicReportUrl(normalizedDomain);

  if (!report) {
    return {
      title: `Accessibility Report for ${normalizedDomain} | VexNexa`,
      robots: { index: false, follow: true },
    };
  }

  const scoreText = report.score !== null ? `Score: ${report.score}/100. ` : '';
  const issueText = report.issues_total > 0 ? `${report.issues_total} issues found. ` : 'No issues found. ';

  return {
    title: `${normalizedDomain} Accessibility Report | VexNexa`,
    description: `Automated accessibility scan results for ${normalizedDomain}. ${scoreText}${issueText}Includes WCAG compliance analysis, issue breakdown by severity, and improvement recommendations.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${normalizedDomain} Accessibility Report | VexNexa`,
      description: `Automated accessibility scan results for ${normalizedDomain}. ${scoreText}${issueText}View the full report.`,
      url: canonicalUrl,
      siteName: 'VexNexa',
      type: 'article',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${normalizedDomain} Accessibility Report | VexNexa`,
      description: `Automated accessibility scan results for ${normalizedDomain}. ${scoreText}View the full report.`,
      creator: '@vexnexa',
    },
    robots: report.allow_indexing
      ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const } }
      : { index: false, follow: true },
  };
}

export const dynamic = 'force-dynamic';

export default async function PublicReportPage({ params }: PageProps) {
  const { domain: slug } = await params;
  const normalizedDomain = slugToDomain(decodeURIComponent(slug));
  const report = await getLatestPublicReport(normalizedDomain);

  if (!report) {
    notFound();
  }

  const history = await getPublicReportHistory(normalizedDomain, 10);

  return (
    <PublicReportContent
      report={report}
      history={history}
      normalizedDomain={normalizedDomain}
      isCanonical={true}
    />
  );
}
