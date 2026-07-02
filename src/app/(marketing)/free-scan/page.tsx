import type { Metadata } from "next";
import { Suspense } from "react";
import { FreeScanClient } from "./FreeScanClient";

export const metadata: Metadata = {
  title: "Free WCAG Scan — Instant Accessibility Check",
  description:
    "Run a free WCAG 2.2 scan on any page — no account needed. Get your accessibility score, issue counts by severity, and example findings in under a minute.",
  robots: {
    // Results view is parameterised and partially dynamic — keep it out of the index.
    index: false,
    follow: true,
  },
};

export default function FreeScanPage() {
  return (
    <Suspense>
      <FreeScanClient />
    </Suspense>
  );
}
