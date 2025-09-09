import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEV_USER_EMAIL ?? "dev@tutusporta.local";
  const siteUrl = process.env.SEED_SITE_URL ?? "https://example.com/";

  // user with trial plan
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { 
      email,
      plan: "TRIAL",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
  });

  // site
  const site = await prisma.site.upsert({
    where: { userId_url: { userId: user.id, url: siteUrl } },
    update: {},
    create: { userId: user.id, url: siteUrl },
  });

  // 1 dummy scan (zodat UI direct werkt)
  await prisma.scan.create({
    data: {
      siteId: site.id,
      status: "done",
      score: 72,
      issues: 3,
      impactCritical: 0,
      impactSerious: 1,
      impactModerate: 1,
      impactMinor: 1,
      raw: {
        summary: {
          counts: { violations: 3, passes: 50, incomplete: 1, inapplicable: 20 },
          top: [
            { id: "color-contrast", impact: "serious", help: "Elements must have sufficient color contrast", nodes: 3, sampleTargets: ["#hero h1"] },
            { id: "image-alt", impact: "moderate", help: "Images must have alternate text", nodes: 2, sampleTargets: ["img.logo"] }
          ]
        }
      }
    },
  });

  console.log("✅ Seed klaar:", { email, siteUrl });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});