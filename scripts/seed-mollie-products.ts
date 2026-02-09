/**
 * One-time script to seed the MollieProduct table.
 * Run: npx dotenv -e .env.migration -- npx tsx scripts/seed-mollie-products.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ProductDef {
  productType: string;
  productKey: string;
  prices: Array<{ interval: string; amount: number }>;
}

function buildProductDefs(): ProductDef[] {
  const TIER_PRICES: Record<string, { monthly: number; yearly: number }> = {
    STARTER:    { monthly: 24.99, yearly: 249 },
    PRO:        { monthly: 59.99, yearly: 599 },
    BUSINESS:   { monthly: 129,   yearly: 1299 },
    ENTERPRISE: { monthly: 299,   yearly: 2990 },
  };

  const ADDON_PRICES: Record<string, number> = {
    EXTRA_WEBSITE_1:  15,
    EXTRA_WEBSITE_5:  59,
    EXTRA_WEBSITE_10: 99,
    ASSURANCE_STARTER: 9,
    ASSURANCE_PRO:     19,
    PAGE_PACK_25K:    19,
    PAGE_PACK_100K:   79,
    PAGE_PACK_250K:   179,
  };

  const defs: ProductDef[] = [];

  for (const [key, prices] of Object.entries(TIER_PRICES)) {
    defs.push({
      productType: "tier",
      productKey: key,
      prices: [
        { interval: "monthly", amount: prices.monthly },
        { interval: "yearly",  amount: prices.yearly },
      ],
    });
  }

  for (const [key, amount] of Object.entries(ADDON_PRICES)) {
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
