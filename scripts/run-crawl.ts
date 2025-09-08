#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";
import { runCrawl } from "../src/lib/crawler";

const prisma = new PrismaClient();

async function main() {
  const crawlId = process.argv[2];
  
  if (!crawlId) {
    console.error("Usage: npm run worker:crawl <crawlId>");
    process.exit(1);
  }

  console.log(`Starting crawl ${crawlId}...`);

  try {
    await runCrawl(crawlId);
    console.log(`Crawl ${crawlId} completed successfully`);
  } catch (error) {
    console.error(`Crawl ${crawlId} failed:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(async (error) => {
  console.error('Unhandled error:', error);
  await prisma.$disconnect();
  process.exit(1);
});