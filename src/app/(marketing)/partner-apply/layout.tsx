import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founding Agency Program Application",
  description:
    "Apply for the VexNexa Founding Agency Program: 12 months of the Agency plan for free, then a permanent 30% founding discount. Limited spots; applications reviewed within 24 hours.",
  openGraph: {
    title: "Founding Agency Program Application — VexNexa",
    description:
      "Apply for a founding spot: a free year of Agency-level access, white-label client reports, and direct product input. Manually reviewed within 24 hours.",
    url: "https://vexnexa.com/partner-apply",
  },

  robots: { index: true, follow: true },
};

export default function PartnerApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
