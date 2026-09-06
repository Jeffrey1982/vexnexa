import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("agencyOffer");
  return {
    title: t("closedTitle"),
    description: t("closedDescription"),
    openGraph: {
      title: t("closedTitle"),
      description: t("closedDescription"),
      url: "https://vexnexa.com/partner-apply",
    },
  };
}

export default function PartnerApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
