import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BfsgContent } from "./BfsgContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("bfsgPage.meta");
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

async function BfsgJsonLd() {
  const t = await getTranslations("bfsgPage");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "VexNexa BFSG Accessibility Monitoring",
        serviceType: "Web accessibility monitoring",
        provider: { "@id": "https://vexnexa.com/#organization" },
        areaServed: "DE",
        description: t("meta.description"),
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

export default async function BfsgCompliancePage() {
  return (
    <>
      <BfsgJsonLd />
      <BfsgContent />
    </>
  );
}
