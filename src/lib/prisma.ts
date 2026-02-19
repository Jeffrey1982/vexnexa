import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const baseClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });

/**
 * Helper: injects `deletedAt: null` into a where clause unless the caller
 * already references `deletedAt` (e.g. admin soft-delete recovery queries).
 */
function withSoftDeleteFilter<W extends Record<string, unknown>>(
  where?: W
): W & { deletedAt: null } | { deletedAt: null } {
  if (where && "deletedAt" in where) {
    return where as W & { deletedAt: null };
  }
  return { ...where, deletedAt: null } as W & { deletedAt: null };
}

/**
 * Builds the standard soft-delete query overrides for a single model.
 * Intercepts findMany, findFirst, findFirstOrThrow, count to exclude
 * soft-deleted records by default.
 */
function softDeleteQueryOverrides() {
  return {
    async findMany({ args, query }: { args: { where?: Record<string, unknown> }; query: (args: unknown) => unknown }) {
      args.where = withSoftDeleteFilter(args.where as Record<string, unknown> | undefined);
      return query(args);
    },
    async findFirst({ args, query }: { args: { where?: Record<string, unknown> }; query: (args: unknown) => unknown }) {
      args.where = withSoftDeleteFilter(args.where as Record<string, unknown> | undefined);
      return query(args);
    },
    async findFirstOrThrow({ args, query }: { args: { where?: Record<string, unknown> }; query: (args: unknown) => unknown }) {
      args.where = withSoftDeleteFilter(args.where as Record<string, unknown> | undefined);
      return query(args);
    },
    async count({ args, query }: { args: { where?: Record<string, unknown> }; query: (args: unknown) => unknown }) {
      args.where = withSoftDeleteFilter(args.where as Record<string, unknown> | undefined);
      return query(args);
    },
  };
}

// Extend the base client with soft-delete query filters for all 7 models
export const prisma = baseClient.$extends({
  query: {
    user: softDeleteQueryOverrides(),
    site: softDeleteQueryOverrides(),
    scan: softDeleteQueryOverrides(),
    team: softDeleteQueryOverrides(),
    blogPost: softDeleteQueryOverrides(),
    supportTicket: softDeleteQueryOverrides(),
    manualAudit: softDeleteQueryOverrides(),
  },
}) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = baseClient;