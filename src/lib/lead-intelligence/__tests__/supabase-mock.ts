import { vi, type Mock } from 'vitest';

export type QueryResult = { data?: any; error?: any; count?: number | null };
export type RecordedQuery = { table: string; query: Record<string, any> };

/** A finite response queue: an unexpected database call fails the unit test. */
export function queueSupabase(from: Mock, results: QueryResult[]): RecordedQuery[] {
  const calls: RecordedQuery[] = [];
  from.mockImplementation((table: string) => {
    const result = results[calls.length];
    if (!result) throw new Error(`Unexpected Supabase query: ${table}`);
    const query: Record<string, any> = {};
    for (const method of ['select', 'insert', 'upsert', 'update', 'eq', 'in', 'or', 'order', 'limit', 'gte', 'gt', 'lt', 'not', 'single', 'maybeSingle']) {
      query[method] = vi.fn(() => query);
    }
    query.then = (resolve: (value: QueryResult) => unknown, reject: (error: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null, ...result }).then(resolve, reject);
    calls.push({ table, query });
    return query;
  });
  return calls;
}
