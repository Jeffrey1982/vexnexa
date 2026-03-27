import { prisma } from '@/lib/prisma';

/**
 * Max pilot partner seats (capacity). Remaining = this minus APPROVED applications.
 * Prefer server-only MAX_PILOT_SPOTS; NEXT_PUBLIC_MAX_PILOT_SPOTS also works on the server.
 */
export function getMaxPilotSpots(): number {
  const raw =
    process.env.MAX_PILOT_SPOTS ?? process.env.NEXT_PUBLIC_MAX_PILOT_SPOTS ?? '20';
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 20;
  return Math.min(999, n);
}

export async function getPilotPartnerRemaining(): Promise<{
  remaining: number;
  maxSpots: number;
  approvedCount: number;
}> {
  const maxSpots = getMaxPilotSpots();
  const approvedCount = await prisma.partnerApplication.count({
    where: { status: 'APPROVED' },
  });
  return {
    maxSpots,
    approvedCount,
    remaining: Math.max(0, maxSpots - approvedCount),
  };
}
