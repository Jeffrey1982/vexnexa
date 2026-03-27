import { PartnerApplyView } from "@/components/partner-apply/PartnerApplyView";
import { getPilotPartnerRemaining } from "@/lib/pilot-partner";

export default async function PartnerApplyPage() {
  const { remaining } = await getPilotPartnerRemaining();
  return <PartnerApplyView remaining={remaining} />;
}
