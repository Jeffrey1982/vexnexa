import fetch from "node-fetch";

export async function isAllowedByRobots(siteRoot: string, path: string): Promise<boolean> {
  try {
    const robotsUrl = new URL("/robots.txt", siteRoot).toString();
    const res = await fetch(robotsUrl, { 
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return true; // geen robots: ga door
    const txt = await res.text();
    const lines = txt.split(/\r?\n/).map(l => l.trim());
    // Eenvoudige parser: Disallow: /pad
    const disallows = lines
      .filter(l => /^Disallow:/i.test(l))
      .map(l => l.split(":")[1]?.trim() || "")
      .filter(Boolean);

    // Als één van de disallows prefix matcht, blokkeer.
    return !disallows.some(d => path.startsWith(d));
  } catch {
    return true;
  }
}