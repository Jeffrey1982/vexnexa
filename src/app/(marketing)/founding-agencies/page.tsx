import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FoundingProgramClosed } from "@/components/marketing/FoundingProgramClosed";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("agencyOffer");
  return {
    title: t("closedTitle"),
    description: t("closedDescription"),
    openGraph: {
      title: t("closedTitle"),
      description: t("closedDescription"),
      url: "https://vexnexa.com/founding-agencies",
    },
  };
}

export default function FoundingAgenciesPage() {
  return <FoundingProgramClosed />;
}
