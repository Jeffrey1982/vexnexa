import { PartnerApplyView } from "@/components/partner-apply/PartnerApplyView";

function parseSpotsLeft(): number {
  const raw = process.env.NEXT_PUBLIC_PILOT_PARTNER_SPOTS_LEFT;
  const n = parseInt(raw ?? "9", 10);
  if (!Number.isFinite(n) || n < 0) return 9;
  return Math.min(99, n);
}

export default function PartnerApplyPage() {
  const spotsLeft = parseSpotsLeft();
  return <PartnerApplyView spotsLeft={spotsLeft} />;
}
