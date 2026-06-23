/**
 * IndexNow — instantly notify Bing, Yandex and other participating engines
 * when content is published or updated. (Google does not consume IndexNow, but
 * Bing powers Copilot and ChatGPT search, so this widens reach quickly.)
 *
 * The key file lives at /public/<KEY>.txt and is served from the site root,
 * which proves ownership to the IndexNow endpoint.
 */
import { SITE_URL } from "@/lib/marketing-seo";

const INDEXNOW_KEY = "e6dd65d208d817e494e7f822e4db115d";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function host(): string {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "vexnexa.com";
  }
}

/**
 * Submit one or more absolute URLs to IndexNow. Best-effort: never throws, so
 * callers can fire-and-forget without affecting the main request.
 */
export async function pingIndexNow(urls: string[]): Promise<void> {
  const urlList = urls.filter((u) => typeof u === "string" && u.startsWith("http"));
  if (urlList.length === 0) return;

  try {
    await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: host(),
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
  } catch (err) {
    // Indexing notifications are non-critical — log and move on.
    console.warn("[indexnow] ping failed:", err instanceof Error ? err.message : err);
  }
}
