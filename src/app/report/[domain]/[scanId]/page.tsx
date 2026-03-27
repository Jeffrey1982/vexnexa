import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicReportByScanId } from '@/lib/public-reports';
import { slugToDomain, getPublicReportUrl } from '@/lib/domain-utils';
import { PublicReportContent } from '@/components/public-report/PublicReportContent';

interface PageProps {
  params: Promise<{ domain: string; scanId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain: slug, scanId } = await params;
  const normalizedDomain = slugToDomain(decodeURIComponent(slug));
  const canonicalUrl = getPublicReportUrl(normalizedDomain);
  const report = await getPublicReportByScanId(normalizedDomain, scanId);

  if (!report) {
    return {
      title: `Scan Report | VexNexa`,
      robots: { index: false, follow: true },
    };
  }

  return {
    title: `${normalizedDomain} Accessibility Report (Scan ${scanId.slice(0, 8)}) | VexNexa`,
    description: `Accessibility scan results for ${normalizedDomain}. Score: ${report.score ?? 'N/A'}/100.`,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function VersionedReportPage({ params }: PageProps) {
  const { domain: slug, scanId } = await params;
  const normalizedDomain = slugToDomain(decodeURIComponent(slug));
  const report = await getPublicReportByScanId(normalizedDomain, scanId);

  if (!report) {
    notFound();
  }

  return (
    <PublicReportContent
      report={report}
      history={[]}
      normalizedDomain={normalizedDomain}
      isCanonical={false}
    />
  );
}
