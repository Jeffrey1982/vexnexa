/**
 * One-time script to seed the MollieProduct table.
 * Run: npx dotenv -e .env.migration -- npx tsx scripts/seed-mollie-products.ts
 *
 * Prices come from the pricing single source of truth
 * (src/lib/billing/pricing-config.ts + src/lib/pricing.ts) — never
 * hardcode amounts here.
 */
import { PrismaClient } from "@prisma/client";
import { PLAN_PRICES, type PlanKey } from "../src/lib/billing/pricing-config";
import {
  WEBSITE_PACK_PRICES,
  PAGE_PACK_PRICES,
  ASSURANCE_ADDON_PRICES,
} from "../src/lib/pricing";

const prisma = new PrismaClient();

interface ProductDef {
  productType: string;
  productKey: string;
  prices: Array<{ interval: string; amount: number }>;
}

function buildProductDefs(): ProductDef[] {
  // FREE has no Mollie product; every other plan is seeded so existing
  // subscriptions (incl. legacy STARTER and closed PIONEER) keep resolving.
  const tierKeys: PlanKey[] = ["STARTER", "PRO", "BUSINESS", "PIONEER", "ENTERPRISE"];

  const ADDON_PRICES: Record<string, number> = {
    EXTRA_WEBSITE_1: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_1,
    EXTRA_WEBSITE_5: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_5,
    EXTRA_WEBSITE_10: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_10,
    ASSURANCE_STARTER: ASSURANCE_ADDON_PRICES.STARTER ?? 0,
    ASSURANCE_PRO: ASSURANCE_ADDON_PRICES.PRO ?? 0,
    PAGE_PACK_25K: PAGE_PACK_PRICES.PAGE_PACK_25K,
    PAGE_PACK_100K: PAGE_PACK_PRICES.PAGE_PACK_100K,
    PAGE_PACK_250K: PAGE_PACK_PRICES.PAGE_PACK_250K,
  };

  const defs: ProductDef[] = [];

  for (const key of tierKeys) {
    defs.push({
      productType: "tier",
      productKey: key,
      prices: [
        { interval: "monthly", amount: PLAN_PRICES[key].monthly },
        { interval: "yearly",  amount: PLAN_PRICES[key].yearly },
      ],
    });
  }

  for (const [key, amount] of Object.entries(ADDON_PRICES)) {
    if (amount <= 0) continue;
    defs.push({
      productType: "addon",
      productKey: key,
      prices: [{ interval: "monthly", amount }],
    });
  }

  return defs;
}

async function main(): Promise<void> {
  const defs = buildProductDefs();
  let created = 0;
  let unchanged = 0;

  for (const def of defs) {
    for (const price of def.prices) {
      const existing = await prisma.mollieProduct.findFirst({
        where: { productKey: def.productKey, interval: price.interval, active: true },
      });

      if (existing) {
        const existingAmount = Number(existing.amount);
        if (existingAmount === price.amount) {
          unchanged++;
          console.log(`  SKIP ${def.productKey} ${price.interval} (already €${price.amount})`);
          continue;
        }
        // Deactivate old, create new
        await prisma.mollieProduct.update({
          where: { id: existing.id },
          data: { active: false },
        });
      }

      await prisma.mollieProduct.create({
        data: {
          productType: def.productType,
          productKey: def.productKey,
          interval: price.interval,
          amount: price.amount,
          active: true,
        },
      });
      created++;
      console.log(`  CREATE ${def.productKey} ${price.interval} €${price.amount}`);
    }
  }

  console.log(`\nDone: ${created} created, ${unchanged} unchanged`);

  const total = await prisma.mollieProduct.count({ where: { active: true } });
  console.log(`Total active MollieProduct records: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
