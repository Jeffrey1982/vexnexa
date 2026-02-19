import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });

// NOTE: Soft-delete query filtering is DISABLED until the migration
// `prisma/migrations/20251204_add_soft_deletes/migration.sql` has been
// applied to the production database. Once the deletedAt columns exist,
// re-enable the $extends middleware from git history (commit 34ba8b3).

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;