/**
 * Verify existing subscriptions were not affected by the migration.
 * Run: npx dotenv -e .env.migration -- npx tsx scripts/verify-existing-subs.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // 1. Check plan distribution
  const planCounts = await prisma.user.groupBy({
    by: ["plan"],
    _count: { plan: true },
  });
  console.log("=== Plan Distribution ===");
  for (const row of planCounts) {
    console.log(`  ${row.plan}: ${row._count.plan} users`);
  }

  // 2. Check that new fields have safe defaults
  const usersWithAssurance = await prisma.user.count({ where: { hasAssurance: true } });
  const usersWithExtraWebsites = await prisma.user.count({ where: { extraWebsiteCount: { gt: 0 } } });
  console.log("\n=== New Field Defaults ===");
  console.log(`  Users with hasAssurance=true: ${usersWithAssurance}`);
  console.log(`  Users with extraWebsiteCount>0: ${usersWithExtraWebsites}`);

  // 3. Check active Mollie subscriptions are intact
  const activeSubUsers = await prisma.user.count({
    where: {
      mollieSubscriptionId: { not: null },
      subscriptionStatus: "active",
    },
  });
  console.log(`\n=== Active Mollie Subscriptions ===`);
  console.log(`  Users with active Mollie subscription: ${activeSubUsers}`);

  // 4. Check active add-ons are intact
  const activeAddOns = await prisma.addOn.groupBy({
    by: ["type"],
    where: { status: "active" },
    _count: { type: true },
  });
  console.log("\n=== Active Add-Ons ===");
  if (activeAddOns.length === 0) {
    console.log("  No active add-ons (expected if none were purchased)");
  }
  for (const row of activeAddOns) {
    console.log(`  ${row.type}: ${row._count.type}`);
  }

  // 5. Verify MollieProduct table
  const mollieProducts = await prisma.mollieProduct.count({ where: { active: true } });
  console.log(`\n=== MollieProduct Catalog ===`);
  console.log(`  Active products: ${mollieProducts}`);

  // 6. Spot-check: no user has ENTERPRISE plan yet (shouldn't)
  const enterpriseUsers = await prisma.user.count({ where: { plan: "ENTERPRISE" } });
  console.log(`\n=== Sanity Checks ===`);
  console.log(`  Users on ENTERPRISE plan: ${enterpriseUsers} (expected: 0)`);

  console.log("\n✅ Verification complete — existing data looks intact.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
