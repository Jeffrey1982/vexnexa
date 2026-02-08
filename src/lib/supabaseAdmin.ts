import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const supabaseUrl: string | undefined =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const supabaseServiceKey: string | undefined =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error(
        "Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL environment variable."
      );
    }
    if (!supabaseServiceKey) {
      throw new Error(
        "Missing SUPABASE_SERVICE_ROLE_KEY environment variable."
      );
    }

    _client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _client;
}

/**
 * Supabase admin client using the service-role key.
 * Lazy-initialized so it doesn't throw during Next.js build-time page collection.
 * Server-only – never import this in client components.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin: SupabaseClient = new Proxy({} as any, {
  get(_target: unknown, prop: string | symbol): unknown {
    const client = getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
