import { PrismaClient } from "@prisma/client";

/**
 * Defensive DATABASE_URL builder.
 *
 * Supabase's Transaction Pooler (port 6543, `*.pooler.supabase.com`) multiplexes
 * physical connections across requests. Prisma's default named-prepared-statement
 * mode is incompatible with that — you'll see Postgres error 42P05
 * ("prepared statement \"s4\" already exists") on every other request.
 *
 * The fix is to set `?pgbouncer=true&connection_limit=1` on the connection
 * string. We append those flags here at runtime if they're missing, so a
 * misconfigured `DATABASE_URL` env var on Vercel can no longer break the app.
 *
 * Detection rule (intentionally conservative):
 *   - Host matches `*.pooler.supabase.com`, OR
 *   - Port is exactly 6543
 *
 * If neither matches we leave the URL untouched.
 */
function buildSafeDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    // Not a parseable URL — let Prisma surface its own error.
    return raw;
  }

  const host = url.hostname.toLowerCase();
  const port = url.port;
  const looksLikePooler =
    host.endsWith(".pooler.supabase.com") || port === "6543";

  if (!looksLikePooler) return raw;

  let mutated = false;

  if (!url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
    mutated = true;
  }
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "1");
    mutated = true;
  }

  if (mutated && process.env.NODE_ENV !== "test") {
    // Single-line warning so it shows up clearly in Vercel logs.
    console.warn(
      "[prisma] DATABASE_URL points at the Supabase Transaction Pooler but " +
        "is missing pgbouncer=true / connection_limit=1 — auto-applying both " +
        "to avoid Postgres error 42P05 (prepared statement already exists). " +
        "Recommended: set the flags directly on the env var so this code path " +
        "becomes a no-op."
    );
  }

  return url.toString();
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const baseClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
    datasourceUrl: buildSafeDatabaseUrl(),
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
