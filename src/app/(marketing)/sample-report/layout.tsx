import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sample Accessibility Report — See What VexNexa Delivers",
  description:
    "Browse a realistic WCAG accessibility report with severity-ranked issues, remediation guidance, and executive summary. See what your clients and stakeholders will receive.",
  openGraph: {
    title: "Sample Accessibility Report — VexNexa",
    description:
      "Browse a realistic WCAG report with prioritised issues, fix guidance, and scores. White-label available on Business and Enterprise plans.",
    url: "https://vexnexa.com/sample-report",
  },
  alternates: { canonical: "https://vexnexa.com/sample-report" },
};

export default function SampleReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
