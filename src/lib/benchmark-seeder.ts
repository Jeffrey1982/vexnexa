import { prisma } from "./prisma";

export async function seedIndustryBenchmarks() {
  console.log("Seeding industry benchmarks...");

  const benchmarks = [
    {
      industry: "ecommerce",
      category: null,
      avgScore: 75.2,
      avgCritical: 3.1,
      avgSerious: 7.8,
      avgModerate: 12.4,
      avgMinor: 18.6,
      avgWcagAA: 68.3,
      avgWcagAAA: 45.7,
      sampleSize: 2847
    },
    {
      industry: "healthcare",
      category: null,
      avgScore: 82.1,
      avgCritical: 2.3,
      avgSerious: 5.9,
      avgModerate: 9.7,
      avgMinor: 14.2,
      avgWcagAA: 78.5,
      avgWcagAAA: 62.1,
      sampleSize: 1234
    },
    {
      industry: "education",
      category: null,
      avgScore: 79.4,
      avgCritical: 2.8,
      avgSerious: 6.5,
      avgModerate: 10.9,
      avgMinor: 16.3,
      avgWcagAA: 74.2,
      avgWcagAAA: 55.8,
      sampleSize: 1567
    },
    {
      industry: "government",
      category: null,
      avgScore: 87.9,
      avgCritical: 1.4,
      avgSerious: 3.2,
      avgModerate: 6.1,
      avgMinor: 9.8,
      avgWcagAA: 85.7,
      avgWcagAAA: 71.3,
      sampleSize: 892
    },
    {
      industry: "finance",
      category: null,
      avgScore: 81.6,
      avgCritical: 2.1,
      avgSerious: 5.3,
      avgModerate: 8.9,
      avgMinor: 13.7,
      avgWcagAA: 76.8,
      avgWcagAAA: 58.4,
      sampleSize: 1045
    },
    {
      industry: "media",
      category: null,
      avgScore: 73.8,
      avgCritical: 3.7,
      avgSerious: 8.9,
      avgModerate: 14.2,
      avgMinor: 21.4,
      avgWcagAA: 65.9,
      avgWcagAAA: 41.2,
      sampleSize: 1823
    },
    {
      industry: "technology",
      category: null,
      avgScore: 77.3,
      avgCritical: 2.9,
      avgSerious: 7.1,
      avgModerate: 11.6,
      avgMinor: 17.8,
      avgWcagAA: 71.5,
      avgWcagAAA: 48.9,
      sampleSize: 3156
    },
    {
      industry: "nonprofit",
      category: null,
      avgScore: 71.2,
      avgCritical: 4.1,
      avgSerious: 9.7,
      avgModerate: 15.8,
      avgMinor: 23.4,
      avgWcagAA: 62.7,
      avgWcagAAA: 38.5,
      sampleSize: 967
    },
    {
      industry: "travel",
      category: null,
      avgScore: 74.6,
      avgCritical: 3.4,
      avgSerious: 8.2,
      avgModerate: 13.1,
      avgMinor: 19.8,
      avgWcagAA: 67.1,
      avgWcagAAA: 43.6,
      sampleSize: 1378
    },
    {
      industry: "general",
      category: null,
      avgScore: 76.8,
      avgCritical: 2.9,
      avgSerious: 7.4,
      avgModerate: 11.8,
      avgMinor: 17.6,
      avgWcagAA: 70.9,
      avgWcagAAA: 49.7,
      sampleSize: 15234
    }
  ];

  for (const benchmark of benchmarks) {
    // Use findFirst and upsert separately to handle nullable category
    const existing = await prisma.benchmark.findFirst({
      where: {
        industry: benchmark.industry,
        category: benchmark.category
      }
    });

    if (existing) {
      await prisma.benchmark.update({
        where: { id: existing.id },
        data: {
          avgScore: benchmark.avgScore,
          avgCritical: benchmark.avgCritical,
          avgSerious: benchmark.avgSerious,
          avgModerate: benchmark.avgModerate,
          avgMinor: benchmark.avgMinor,
          avgWcagAA: benchmark.avgWcagAA,
          avgWcagAAA: benchmark.avgWcagAAA,
          sampleSize: benchmark.sampleSize,
          lastUpdated: new Date()
        }
      });
    } else {
      await prisma.benchmark.create({
        data: {
          industry: benchmark.industry,
          category: benchmark.category,
            avgScore: benchmark.avgScore,
          avgCritical: benchmark.avgCritical,
          avgSerious: benchmark.avgSerious,
          avgModerate: benchmark.avgModerate,
          avgMinor: benchmark.avgMinor,
          avgWcagAA: benchmark.avgWcagAA,
          avgWcagAAA: benchmark.avgWcagAAA,
          sampleSize: benchmark.sampleSize
        }
      });
    }
  }

  console.log(`Seeded ${benchmarks.length} industry benchmarks`);
}

// Function to update benchmarks based on real scan data
export async function updateBenchmarksFromScans() {
  console.log("Updating benchmarks from real scan data...");

  // This would analyze your actual scan data to generate benchmarks
  // For now, it's a placeholder that could be run periodically

  const allScans = await prisma.scan.findMany({
    where: {
      status: "done",
      score: { not: null }
    },
    select: {
      score: true,
      impactCritical: true,
      impactSerious: true,
      impactModerate: true,
      impactMinor: true,
      wcagAACompliance: true,
      wcagAAACompliance: true,
      site: {
        select: {
          url: true
        }
      }
    }
  });

  if (allScans.length === 0) {
    console.log("No scans found for benchmark generation");
    return;
  }

  // Calculate overall averages
  const avgScore = allScans.reduce((sum, scan) => sum + (scan.score || 0), 0) / allScans.length;
  const avgCritical = allScans.reduce((sum, scan) => sum + (scan.impactCritical || 0), 0) / allScans.length;
  const avgSerious = allScans.reduce((sum, scan) => sum + (scan.impactSerious || 0), 0) / allScans.length;
  const avgModerate = allScans.reduce((sum, scan) => sum + (scan.impactModerate || 0), 0) / allScans.length;
  const avgMinor = allScans.reduce((sum, scan) => sum + (scan.impactMinor || 0), 0) / allScans.length;

  const wcagScans = allScans.filter(scan => scan.wcagAACompliance !== null);
  const avgWcagAA = wcagScans.length > 0
    ? wcagScans.reduce((sum, scan) => sum + (scan.wcagAACompliance || 0), 0) / wcagScans.length
    : 0;
  const avgWcagAAA = wcagScans.length > 0
    ? wcagScans.reduce((sum, scan) => sum + (scan.wcagAAACompliance || 0), 0) / wcagScans.length
    : 0;

  // Update general benchmark using findFirst/update pattern
  const existingGeneral = await prisma.benchmark.findFirst({
    where: {
      industry: "tutusporta_users",
      category: null
    }
  });

  if (existingGeneral) {
    await prisma.benchmark.update({
      where: { id: existingGeneral.id },
      data: {
        avgScore: Math.round(avgScore * 10) / 10,
        avgCritical: Math.round(avgCritical * 10) / 10,
        avgSerious: Math.round(avgSerious * 10) / 10,
        avgModerate: Math.round(avgModerate * 10) / 10,
        avgMinor: Math.round(avgMinor * 10) / 10,
        avgWcagAA: Math.round(avgWcagAA * 10) / 10,
        avgWcagAAA: Math.round(avgWcagAAA * 10) / 10,
        sampleSize: allScans.length,
        lastUpdated: new Date()
      }
    });
  } else {
    await prisma.benchmark.create({
      data: {
        industry: "tutusporta_users",
        category: null,
        avgScore: Math.round(avgScore * 10) / 10,
        avgCritical: Math.round(avgCritical * 10) / 10,
        avgSerious: Math.round(avgSerious * 10) / 10,
        avgModerate: Math.round(avgModerate * 10) / 10,
        avgMinor: Math.round(avgMinor * 10) / 10,
        avgWcagAA: Math.round(avgWcagAA * 10) / 10,
        avgWcagAAA: Math.round(avgWcagAAA * 10) / 10,
        sampleSize: allScans.length
      }
    });
  }

  console.log(`Updated TutusPorta users benchmark with ${allScans.length} scans`);
  console.log(`Average score: ${Math.round(avgScore)}, Critical issues: ${Math.round(avgCritical * 10) / 10}`);
}