import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Seeding benchmark data...");

  // Create sample benchmark data for different industries
  const benchmarks = [
    {
      industry: "ecommerce",
      category: null,
      avgScore: 72.5,
      avgCritical: 2.3,
      avgSerious: 4.7,
      avgModerate: 8.2,
      avgMinor: 12.5,
      avgWcagAA: 78.3,
      avgWcagAAA: 61.2,
      sampleSize: 150
    },
    {
      industry: "general",
      category: null,
      avgScore: 68.2,
      avgCritical: 3.1,
      avgSerious: 5.8,
      avgModerate: 9.4,
      avgMinor: 14.7,
      avgWcagAA: 74.6,
      avgWcagAAA: 58.9,
      sampleSize: 500
    },
    {
      industry: "healthcare",
      category: null,
      avgScore: 76.8,
      avgCritical: 1.8,
      avgSerious: 3.9,
      avgModerate: 6.7,
      avgMinor: 10.2,
      avgWcagAA: 82.1,
      avgWcagAAA: 67.4,
      sampleSize: 80
    },
    {
      industry: "education",
      category: null,
      avgScore: 71.3,
      avgCritical: 2.5,
      avgSerious: 4.2,
      avgModerate: 7.8,
      avgMinor: 11.9,
      avgWcagAA: 77.5,
      avgWcagAAA: 63.8,
      sampleSize: 120
    },
    {
      industry: "government",
      category: null,
      avgScore: 79.4,
      avgCritical: 1.2,
      avgSerious: 2.8,
      avgModerate: 5.1,
      avgMinor: 8.6,
      avgWcagAA: 85.7,
      avgWcagAAA: 73.2,
      sampleSize: 60
    }
  ];

  for (const benchmark of benchmarks) {
    await prisma.benchmark.create({
      data: benchmark
    });
    console.log(`✅ Created benchmark for ${benchmark.industry}`);
  }

  console.log("🎉 Benchmark seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding benchmarks:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });