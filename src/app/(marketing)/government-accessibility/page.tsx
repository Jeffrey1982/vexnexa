import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GovernmentContent } from "./GovernmentContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("governmentPage.meta");
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    // canonical + hreflang are provided per-locale by the marketing layout
    openGraph: {
      title,
      description,
      type: "website",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

async function GovernmentJsonLd() {
  const t = await getTranslations("governmentPage");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "VexNexa Accessibility Monitoring for Government",
        serviceType: "Web accessibility monitoring",
        provider: { "@id": "https://vexnexa.com/#organization" },
        areaServed: "EU",
        description: t("meta.description"),
        audience: { "@type": "Audience", audienceType: "Government & public sector" },
      },
      {
        "@type": "FAQPage",
        mainEntity: [1, 2, 3, 4].map((n) => ({
          "@type": "Question",
          name: t(`faq.q${n}`),
          acceptedAnswer: { "@type": "Answer", text: t(`faq.a${n}`) },
        })),
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function GovernmentAccessibilityPage() {
  return (
    <>
      <GovernmentJsonLd />
      <GovernmentContent />
    </>
  );
}
