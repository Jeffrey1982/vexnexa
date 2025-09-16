import { chromium, Browser } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import * as fs from "fs";
import path from "path";
import { runRobustAccessibilityScan } from "./scanner-headless";

// Types for crawler compatibility
type AxeViolation = {
  id: string;
  impact?: "minor" | "moderate" | "serious" | "critical";
  nodes: any[];
  help: string;
  description: string;
};

export type ScanResult = {
  score: number;            // 0..100 (eenvoudige scoring)
  issues: number;
  impactCritical: number;
  impactSerious: number;
  impactModerate: number;
  impactMinor: number;
  violations: AxeViolation[];
  title?: string;
};

// Legacy type for existing API compatibility
export type ScanOutput = {
  score: number;
  axe: any;
  summary: any;
};

// Als er al een scoreFromAxe bestaat in het project, gebruik die.
// Anders gebruiken we deze eenvoudige fallback implementatie.
let localScoreFromAxe = (r: any) => {
  const violations = r?.violations?.length ?? 0;
  const passes = r?.passes?.length ?? 0;
  const total = violations + passes || 1;
  const score = Math.max(0, Math.round((passes / total) * 100));
  return { score, summary: { violations, passes, total } };
};
try {
  // Dynamisch importeren als het project al een scorer heeft
  // eslint-disable-next-line
  const maybe = require("@/lib/scoring");
  if (maybe?.scoreFromAxe) localScoreFromAxe = maybe.scoreFromAxe;
} catch {}

async function analyzeWithAxeBuilder(page: any) {
  const results = await new AxeBuilder({ page }).analyze();
  return results;
}

async function analyzeWithUmd(page: any) {
  try {
    // Probeer eerst lokale axe-core via fs.readFileSync
    const axePath = require.resolve("axe-core/axe.min.js");
    const axeContent = fs.readFileSync(axePath, "utf-8");
    await page.addScriptTag({ content: axeContent });
  } catch (e) {
    // Fallback naar CDN als lokale file niet werkt
    await page.addScriptTag({ 
      url: "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js" 
    });
  }

  const results = await page.evaluate(async () => {
    // @ts-ignore
    return await (window as any).axe.run();
  });
  return results;
}

// New named export for crawler
export async function scanUrl(url: string): Promise<ScanResult> {
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      "--no-sandbox", 
      "--disable-setuid-sandbox", 
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--single-process",
      "--no-zygote"
    ],
    timeout: 60000,
  });
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Inject axe-core vanuit node_modules
    try {
      const axePath = path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js");
      await page.addScriptTag({ path: axePath });
    } catch {
      // Fallback to content injection
      const axePath = require.resolve("axe-core/axe.min.js");
      const axeContent = fs.readFileSync(axePath, "utf-8");
      await page.addScriptTag({ content: axeContent });
    }

    const res: any = await page.evaluate(async () => {
      // @ts-ignore
      return await (window as any).axe.run(document, {
        resultTypes: ["violations"],
        // Minder zware rules optioneel hier tunen
      });
    });

    const violations: AxeViolation[] = res.violations ?? [];
    const counts = {
      critical: violations.filter(v => v.impact === "critical").length,
      serious:  violations.filter(v => v.impact === "serious").length,
      moderate: violations.filter(v => v.impact === "moderate").length,
      minor:    violations.filter(v => v.impact === "minor").length,
    };
    const issues = violations.length;

    // naive score: 100 - weighted issues
    const penalty = counts.critical*10 + counts.serious*5 + counts.moderate*2 + counts.minor;
    const score = Math.max(0, 100 - Math.min(90, penalty));

    const title = await page.title().catch(() => undefined);

    return {
      score, issues,
      impactCritical: counts.critical,
      impactSerious: counts.serious,
      impactModerate: counts.moderate,
      impactMinor: counts.minor,
      violations,
      title,
    };
  } finally {
    await browser.close();
  }
}

// Legacy export for existing API compatibility
export async function runAccessibilityScan(url: string): Promise<ScanOutput> {
  let browser: Browser | null = null;
  try {
    // Try different launch configurations based on environment
    const isWindows = process.platform === 'win32';
    const launchOptions = {
      headless: true,
      timeout: 60000,
      args: isWindows ? [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
        "--no-first-run",
        "--no-default-browser-check"
      ] : [
        "--no-sandbox",
        "--disable-setuid-sandbox", 
        "--disable-dev-shm-usage"
      ]
    };
    
    browser = await chromium.launch(launchOptions);
    const ctx = await browser.newContext({ 
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
    });
    const page = await ctx.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    await page.goto(url, { waitUntil: "networkidle" });

    let axeResults: any;
    try {
      axeResults = await analyzeWithAxeBuilder(page);
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      const wantsUmd = process.env.USE_AXE_UMD === "1";
      if (wantsUmd || msg.includes("exports is not defined")) {
        axeResults = await analyzeWithUmd(page);
      } else {
        throw e;
      }
    }

    const { score, summary } = localScoreFromAxe(axeResults);
    return { score, axe: axeResults, summary };
  } catch (error: any) {
    // If browser fails, try headless fallback
    console.warn('Browser scan failed, trying headless fallback:', error.message);
    try {
      const headlessResult = await runRobustAccessibilityScan(url);
      // Convert to legacy format
      return {
        score: headlessResult.score,
        axe: {
          violations: headlessResult.violations,
          passes: [], // Headless doesn't track passes
          fallback: true,
          originalError: error.message
        },
        summary: {
          violations: headlessResult.issues,
          passes: 0,
          total: headlessResult.issues,
          fallback: true
        }
      };
    } catch (fallbackError: any) {
      console.error('Both browser and headless scans failed:', fallbackError.message);
      return {
        score: 0,
        axe: { violations: [], passes: [], error: error.message, fallbackError: fallbackError.message },
        summary: { violations: 0, passes: 0, total: 0, error: error.message }
      };
    }
  } finally {
    try {
      await browser?.close();
    } catch (closeError) {
      console.warn('Failed to close browser:', closeError);
    }
  }
}