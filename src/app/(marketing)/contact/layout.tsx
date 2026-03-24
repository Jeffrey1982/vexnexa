import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — VexNexa",
  description:
    "Questions about plans, white-label reporting, agency workflows, or multi-site monitoring? Talk to us and we'll help you find the right setup.",
  openGraph: {
    title: "Contact — VexNexa",
    description:
      "Questions about plans, white-label reporting, or how VexNexa fits your workflow? We'll help you get to the right setup quickly.",
    url: "https://vexnexa.com/contact",
  },
  alternates: { canonical: "https://vexnexa.com/contact" },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
