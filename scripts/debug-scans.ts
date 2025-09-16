import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔍 Debugging scan data...");

  // Get the latest scans
  const scans = await prisma.scan.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      site: true,
      page: true
    }
  });

  for (const scan of scans) {
    console.log("\n" + "=".repeat(50));
    console.log(`Scan ID: ${scan.id}`);
    console.log(`Site: ${scan.site.url}`);
    console.log(`Page: ${scan.page?.url || 'N/A'}`);
    console.log(`Score: ${scan.score}`);
    console.log(`Status: ${scan.status}`);
    console.log(`Issues: ${scan.issues}`);
    console.log(`Impact counts:`);
    console.log(`  Critical: ${scan.impactCritical}`);
    console.log(`  Serious: ${scan.impactSerious}`);
    console.log(`  Moderate: ${scan.impactModerate}`);
    console.log(`  Minor: ${scan.impactMinor}`);

    if (scan.raw) {
      const rawData = scan.raw as any;
      console.log(`Raw data structure:`);
      console.log(`  Has violations: ${!!rawData.violations}`);
      console.log(`  Violations count: ${rawData.violations?.length || 0}`);
      console.log(`  Has passes: ${!!rawData.passes}`);
      console.log(`  Passes count: ${rawData.passes?.length || 0}`);
      console.log(`  Has error: ${!!rawData.error}`);

      if (rawData.violations && rawData.violations.length > 0) {
        console.log(`Sample violations:`);
        rawData.violations.slice(0, 3).forEach((v: any, i: number) => {
          console.log(`    ${i + 1}. ${v.id} (${v.impact || 'no impact'}) - ${v.nodes?.length || 0} nodes`);
        });
      } else {
        console.log(`No violations found in raw data`);
      }

      if (rawData.error) {
        console.log(`Error in raw data: ${rawData.error}`);
      }
    } else {
      console.log(`No raw data available`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("Debug completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error debugging scans:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });