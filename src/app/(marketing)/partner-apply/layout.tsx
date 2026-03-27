import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exclusive Pilot Partner Application",
  description:
    "Apply for the VexNexa Pilot Partner Program: full Business access, white-label reports, priority support, and roadmap influence. Limited spots; applications reviewed within 24 hours.",
  openGraph: {
    title: "Exclusive Pilot Partner Application — VexNexa",
    description:
      "Claim your spot: Business-level access, white-label client reports, and direct product input. Manually reviewed within 24 hours.",
    url: "https://vexnexa.com/partner-apply",
  },
  alternates: { canonical: "https://vexnexa.com/partner-apply" },
  robots: { index: true, follow: true },
};

export default function PartnerApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
