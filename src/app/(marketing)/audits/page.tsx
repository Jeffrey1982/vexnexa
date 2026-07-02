import type { Metadata } from "next";
import { AuditsClient } from "./AuditsClient";

export const metadata: Metadata = {
  title: "Manual Accessibility Audits — Expert WCAG & EAA Review",
  description:
    "One-time expert accessibility audits and audit + monitoring bundles. WCAG 2.2 and EAA review by specialists, with reports, roadmaps, and implementation guidance.",
  openGraph: {
    title: "Manual Accessibility Audits — Expert WCAG & EAA Review | VexNexa",
    description:
      "One-time expert accessibility audits and audit + monitoring bundles. WCAG 2.2 and EAA review with reports, roadmaps, and implementation guidance.",
    url: "https://vexnexa.com/audits",
    type: "website",
  },
};

export default function AuditsPage() {
  return <AuditsClient />;
}
