import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComparisonContent } from "@/components/marketing/ComparisonContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("comparison.siteimprove.meta");
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title, description },
  };
}

async function SiteimproveJsonLd() {
  const t = await getTranslations("comparison.siteimprove");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3].map((n) => ({
      "@type": "Question",
      name: t(`faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`faq.a${n}`) },
    })),
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}

export default async function SiteimproveAlternativePage() {
  return (
    <>
      <SiteimproveJsonLd />
      <ComparisonContent
        competitor="siteimprove"
        otherHref="/accessibe-alternative"
        otherLabel="accessiBe alternative"
      />
    </>
  );
}
