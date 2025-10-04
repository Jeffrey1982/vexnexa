import { seedWCAGAuditTemplates } from "../src/lib/audit-template-seeder";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Seeding audit templates...");

  await seedWCAGAuditTemplates();

  console.log("🎉 Audit template seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding audit templates:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
