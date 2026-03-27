import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pilot Partner Application",
  description:
    "Apply for the exclusive VexNexa Pilot Partner Program: Business Plan access, white-label reports, priority support, and roadmap influence. Limited spots.",
  openGraph: {
    title: "Pilot Partner Application — VexNexa",
    description:
      "Secure your spot in the VexNexa Pilot Partner Program. Business Plan access, white-label reports, and direct product input.",
    url: "https://vexnexa.com/partner-apply",
  },
  alternates: { canonical: "https://vexnexa.com/partner-apply" },
  robots: { index: true, follow: true },
};

export default function PartnerApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
