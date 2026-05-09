import dynamic from "next/dynamic";
import Script from "next/script";
import { Hero } from "@/components/marketing/home/Hero";
import { EnterpriseTrustBar } from "@/components/marketing/home/EnterpriseTrustBar";
import { HashRedirect } from "@/components/marketing/home/HashRedirect";
import { HomeFAQ } from "@/components/marketing/home/HomeFAQ";

const VisibilityHook = dynamic(
  () =>
    import("@/components/marketing/home/VisibilityHook").then(
      (m) => m.VisibilityHook
    ),
  { ssr: true }
);

const EnterpriseFeatures = dynamic(
  () =>
    import("@/components/marketing/home/EnterpriseFeatures").then(
      (m) => m.EnterpriseFeatures
    ),
  { ssr: true }
);

const EnterpriseConversionPanel = dynamic(
  () =>
    import("@/components/marketing/home/EnterpriseConversionPanel").then(
      (m) => m.EnterpriseConversionPanel
    ),
  { ssr: true }
);

const LatestBlogSection = dynamic(
  () =>
    import("@/components/marketing/home/LatestBlogSection").then(
      (m) => m.LatestBlogSection
    ),
  { ssr: true }
);

function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VexNexa",
    description:
      "White-label WCAG monitoring for agencies and EU-facing teams. Scan websites, catch regressions, deliver branded reports.",
    url: "https://vexnexa.com",
    logo: "https://vexnexa.com/brand/vexnexa-v-mark.png",
    sameAs: ["https://twitter.com/vexnexa"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: "https://vexnexa.com/contact",
    },
  };

  return (
    <Script
      id="home-organization-json-ld"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <HashRedirect />
      <JsonLd />
      <div className="vn-enterprise-theme bg-background text-foreground antialiased">
        <Hero />
        <EnterpriseTrustBar />
        <VisibilityHook />
        <EnterpriseFeatures />
        <EnterpriseConversionPanel />
        <LatestBlogSection />
        <HomeFAQ />
      </div>
    </>
  );
}
