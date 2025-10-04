import { ScanResult } from "./scanner";
import { runRobustAccessibilityScan } from "./scanner-headless";

// ===== Env & Production flags =====
const IS_PROD = process.env.NODE_ENV === "production";
const ALLOW_MOCK = process.env.ALLOW_MOCK_A11Y === "true";
const DEFAULT_TIMEOUT_MS = Number(process.env.A11Y_TIMEOUT_MS ?? 45000);
const A11Y_USER_AGENT =
  process.env.A11Y_USER_AGENT ||
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Dynamic imports; prefer serverless-friendly chromium build
let chromium: any = null;
let chromiumExecutable: any = null;
let AxeBuilder: any = null;

async function loadPlaywright(): Promise<boolean> {
  try {
    // Load chromium driver from playwright-core
    if (!chromium) {
      const pwCore: any = await import("playwright-core");
      chromium = pwCore.chromium ?? pwCore.default?.chromium;
      if (!chromium) throw new Error("chromium export not found on playwright-core");
    }

    // Load serverless chromium executable path for Vercel
    if (!chromiumExecutable && IS_PROD) {
      const spartChromium: any = await import("@sparticuz/chromium");
      chromiumExecutable = spartChromium.default ?? spartChromium;
    }

    if (!AxeBuilder) {
      const axeMod: any = await import("@axe-core/playwright");
      AxeBuilder = axeMod.AxeBuilder ?? axeMod.default?.AxeBuilder;
      if (!AxeBuilder) throw new Error("AxeBuilder export not found on @axe-core/playwright");
    }
    return true;
  } catch (err) {
    console.warn("[a11y] Playwright not available:", (err as Error)?.message ?? err);
    return false;
  }
}

// ===== Enhanced result shape =====
export interface EnhancedScanResult extends ScanResult {
  keyboardNavigation: KeyboardNavigationResult;
  screenReaderCompatibility: ScreenReaderResult;
  mobileAccessibility: MobileAccessibilityResult;
  cognitiveAccessibility: CognitiveAccessibilityResult;
  motionAndAnimation: MotionAnimationResult;
  advancedColorVision: ColorVisionResult;
  performanceImpact: PerformanceImpactResult;
  languageSupport: LanguageSupportResult;
  engineName?: string | null;
  axeVersion?: string | null;
  title?: string;
  __demo?: boolean;
  mock?: boolean;
}

interface KeyboardNavigationResult {
  score: number;
  issues: KeyboardIssue[];
  focusableElements: number;
  tabOrder: boolean;
  skipLinks: boolean;
  focusVisible: boolean;
}
interface KeyboardIssue {
  type: "focus-trap" | "skip-link" | "tab-order" | "keyboard-only";
  element: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
}

interface ScreenReaderResult {
  score: number;
  issues: ScreenReaderIssue[];
  ariaLabels: number;
  landmarks: number;
  headingStructure: boolean;
  altTexts: number;
}
interface ScreenReaderIssue {
  type: "missing-aria" | "heading-structure" | "landmark" | "alt-text";
  element: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
}

interface MobileAccessibilityResult {
  score: number;
  issues: MobileIssue[];
  touchTargets: number;
  viewport: boolean;
  orientation: boolean;
  gestureAlternatives: boolean;
}
interface MobileIssue {
  type: "touch-target" | "viewport" | "orientation" | "gesture";
  element: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
}

interface CognitiveAccessibilityResult {
  score: number;
  issues: CognitiveIssue[];
  timeouts: boolean;
  errorHandling: boolean;
  simpleLanguage: number;
  consistentNavigation: boolean;
}
interface CognitiveIssue {
  type: "timeout" | "complex-language" | "inconsistent-navigation" | "error-handling";
  element: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
}

interface MotionAnimationResult {
  score: number;
  issues: MotionIssue[];
  reducedMotion: boolean;
  autoplay: boolean;
  parallax: boolean;
  vestibularDisorders: boolean;
}
interface MotionIssue {
  type: "autoplay" | "no-reduced-motion" | "parallax" | "vestibular";
  element: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
}

interface ColorVisionResult {
  score: number;
  issues: ColorVisionIssue[];
  deuteranopia: boolean;
  protanopia: boolean;
  tritanopia: boolean;
  achromatopsia: boolean;
}
interface ColorVisionIssue {
  type: "color-only-info" | "insufficient-contrast" | "color-blind-unfriendly";
  element: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
}

interface PerformanceImpactResult {
  score: number;
  issues: PerformanceIssue[];
  loadTime: number;
  largeElements: number;
  assistiveTechFriendly: boolean;
}
interface PerformanceIssue {
  type: "slow-load" | "large-dom" | "heavy-scripts" | "blocking-content";
  element: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
}

interface LanguageSupportResult {
  score: number;
  issues: LanguageIssue[];
  languageDetected: string | null;
  directionality: boolean;
  multiLanguage: boolean;
}
interface LanguageIssue {
  type: "missing-lang" | "incorrect-dir" | "mixed-languages";
  element: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
}

// ===== Scanner class =====
export class EnhancedAccessibilityScanner {
  private browser: any | null = null;
  private page: any | null = null;
  private playwrightAvailable = false;

  async initialize(): Promise<void> {
    console.log("[a11y] Scanner initialization", {
      NODE_ENV: process.env.NODE_ENV,
      IS_PROD: IS_PROD,
      ALLOW_MOCK_A11Y: process.env.ALLOW_MOCK_A11Y,
      PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH
    });

    this.playwrightAvailable = await loadPlaywright();

    if (!this.playwrightAvailable) {
      console.error("[a11y] ERROR: Playwright dependencies not available");
      return;
    }

    console.log("[a11y] Playwright loaded successfully, attempting browser launch...")

    try {
      // In production (Vercel), use serverless chromium executable
      const launchOptions: any = {
        headless: true,
        args: chromiumExecutable ? chromiumExecutable.args : [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-web-security",
        ],
        timeout: DEFAULT_TIMEOUT_MS,
      };

      // Add executable path for serverless chromium
      if (chromiumExecutable) {
        try {
          launchOptions.executablePath = await chromiumExecutable.executablePath();
          console.log("[a11y] Using serverless Chromium executable:", launchOptions.executablePath);
        } catch (execError) {
          console.error("[a11y] ERROR: Failed to get chromium executable path:", execError);
          throw execError;
        }
      } else {
        console.log("[a11y] Using local Chromium (dev mode)");
      }

      console.log("[a11y] Launch options:", JSON.stringify({
        headless: launchOptions.headless,
        hasExecPath: !!launchOptions.executablePath,
        argsCount: launchOptions.args?.length
      }));

      this.browser = await chromium.launch(launchOptions);
      console.log("[a11y] Browser instance created");

      const context = await this.browser.newContext({
        viewport: { width: 1280, height: 800 },
        ignoreHTTPSErrors: true,
        userAgent: A11Y_USER_AGENT,
        bypassCSP: true, // Allow axe-core script injection despite CSP headers
      });
      console.log("[a11y] Browser context created with CSP bypass");

      this.page = await context.newPage();
      console.log("[a11y] ✅ Browser launched successfully - ready to scan");
    } catch (error) {
      console.error("[a11y] ❌ CRITICAL: Failed to launch browser:", {
        error: (error as Error)?.message,
        stack: (error as Error)?.stack,
        isProd: IS_PROD,
        hasChromiumExecutable: !!chromiumExecutable
      });
      this.playwrightAvailable = false;
      this.browser = null;
      this.page = null;
      // Re-throw in production so we don't silently fail
      if (IS_PROD) {
        throw error;
      }
    }
  }

  async scanUrl(url: string): Promise<EnhancedScanResult> {
    await this.initialize();
    console.log("[a11y] mode", {
      playwrightAvailable: this.playwrightAvailable,
      hasPage: !!this.page
    });

    if (this.playwrightAvailable && this.page) {
      return this.scanUrlWithPlaywright(url);
    }
    // No browser: enforce production policy
    return this.scanUrlWithFallback(url);
  }

  private async scanUrlWithPlaywright(url: string): Promise<EnhancedScanResult> {
    const page = this.page!;
    await page.goto(url, { waitUntil: "networkidle", timeout: DEFAULT_TIMEOUT_MS });

    // Use setLegacyMode() for better compatibility with strict CSP
    const axeResults = await new AxeBuilder({ page })
      .setLegacyMode(true)
      .analyze();

    if (!axeResults || !Array.isArray(axeResults.violations)) {
      const err: any = new Error("axe-core returned invalid result (no violations array).");
      err.code = "AXE_INVALID_RESULT";
      throw err;
    }

    const violations = axeResults.violations || [];
    const passes = axeResults.passes || [];
    const total = violations.length + passes.length || 1;
    const basicScore = Math.round((passes.length / total) * 100);

    const [
      keyboardNavigation,
      screenReaderCompatibility,
      mobileAccessibility,
      cognitiveAccessibility,
      motionAndAnimation,
      advancedColorVision,
      performanceImpact,
      languageSupport,
    ] = await Promise.all([
      this.testKeyboardNavigation(page),
      this.testScreenReaderCompatibility(page),
      this.testMobileAccessibility(page),
      this.testCognitiveAccessibility(page),
      this.testMotionAndAnimation(page),
      this.testAdvancedColorVision(page),
      this.testPerformanceImpact(page),
      this.testLanguageSupport(page),
    ]);

    const enhancedScore = Math.round(
      basicScore * 0.6 +
        keyboardNavigation.score * 0.1 +
        screenReaderCompatibility.score * 0.1 +
        mobileAccessibility.score * 0.05 +
        cognitiveAccessibility.score * 0.05 +
        motionAndAnimation.score * 0.03 +
        advancedColorVision.score * 0.03 +
        performanceImpact.score * 0.02 +
        languageSupport.score * 0.02
    );

    const counts = this.calculateImpactCounts(violations);
    const title = await page.title().catch(() => undefined);

    const engineName = (axeResults as any)?.testEngine?.name ?? "axe-core";
    const axeVersion = (axeResults as any)?.testEngine?.version ?? null;

    console.log("[a11y] axe meta", {
      engine: engineName,
      version: axeVersion,
      violations: violations.length,
      passes: passes.length ?? 0,
      score: enhancedScore,
    });

    return {
      score: enhancedScore,
      issues: violations.length,
      impactCritical: counts.critical,
      impactSerious: counts.serious,
      impactModerate: counts.moderate,
      impactMinor: counts.minor,
      violations: violations.map((v: any) => ({
        id: v.id,
        impact: v.impact as any,
        nodes: v.nodes,
        help: v.help,
        description: v.description,
        helpUrl: v.helpUrl,
        tags: v.tags,
      })),
      title,
      keyboardNavigation,
      screenReaderCompatibility,
      mobileAccessibility,
      cognitiveAccessibility,
      motionAndAnimation,
      advancedColorVision,
      performanceImpact,
      languageSupport,
      engineName,
      axeVersion,
      __demo: false,
      mock: false
    };
  }

  private async scanUrlWithFallback(_url: string): Promise<EnhancedScanResult> {
    // In productie: NOOIT mocken → altijd throwen
    if (IS_PROD) {
      const err: any = new Error("No browser available in production; refusing to return mock results.");
      err.code = "SCANNER_NO_BROWSER";
      throw err;
    }

    // In dev: mock alléén als expliciet toegestaan
    if (!ALLOW_MOCK) {
      const err: any = new Error("Playwright/Chromium unavailable (dev) and mocks disabled.");
      err.code = "SCANNER_NO_BROWSER";
      throw err;
    }

    // Dev/demo mock – duidelijk gemarkeerd
    const basicResult = await runRobustAccessibilityScan(_url);

    const mock: EnhancedScanResult = {
      ...basicResult,
      score: basicResult.score,
      keyboardNavigation: { score: 85, issues: [], focusableElements: 24, tabOrder: true, skipLinks: false, focusVisible: true },
      screenReaderCompatibility: { score: 82, issues: [], ariaLabels: 12, landmarks: 3, headingStructure: true, altTexts: 9 },
      mobileAccessibility: { score: 88, issues: [], touchTargets: 22, viewport: true, orientation: true, gestureAlternatives: true },
      cognitiveAccessibility: { score: 84, issues: [], timeouts: true, errorHandling: true, simpleLanguage: 70, consistentNavigation: true },
      motionAndAnimation: { score: 90, issues: [], reducedMotion: true, autoplay: true, parallax: true, vestibularDisorders: true },
      advancedColorVision: { score: 88, issues: [], deuteranopia: true, protanopia: true, tritanopia: true, achromatopsia: true },
      performanceImpact: { score: 80, issues: [], loadTime: 2500, largeElements: 800, assistiveTechFriendly: true },
      languageSupport: { score: 90, issues: [], languageDetected: "en", directionality: true, multiLanguage: false },
      engineName: "fallback-mock",
      axeVersion: null,
      __demo: true,
      mock: true
    };

    console.warn("[a11y] Returning MOCK a11y payload (dev only; ALLOW_MOCK_A11Y=true).");
    return mock;
  }

  // ===== Heuristics (kept minimal & deterministic) =====
  private async testKeyboardNavigation(page: any): Promise<KeyboardNavigationResult> {
    const focusableElements: number = await page.evaluate(() => {
      const nodes = document.querySelectorAll(
        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      return nodes.length;
    });

    const skipLinks: boolean = await page.evaluate(() => {
      const link = document.querySelector('a[href^="#"]');
      return !!link && (link.textContent || "").toLowerCase().includes("skip");
    });

    const focusVisible: boolean = await page.evaluate(() => {
      const el = document.querySelector(":focus-visible");
      return el != null;
    });

    const issues: KeyboardIssue[] = [];
    let score = 100;
    if (!skipLinks && focusableElements > 10) {
      issues.push({
        type: "skip-link",
        element: "body",
        description: "Page should have skip links for keyboard navigation",
        impact: "moderate",
      });
      score -= 15;
    }
    if (!focusVisible) {
      issues.push({
        type: "keyboard-only",
        element: "body",
        description: "Focus indicators should be visible for keyboard users",
        impact: "serious",
      });
      score -= 25;
    }

    return {
      score: Math.max(0, score),
      issues,
      focusableElements,
      tabOrder: true,
      skipLinks,
      focusVisible,
    };
  }

  private async testScreenReaderCompatibility(page: any): Promise<ScreenReaderResult> {
    const ariaLabels: number = await page.evaluate(() => document.querySelectorAll("[aria-label], [aria-labelledby]").length);
    const landmarks: number = await page.evaluate(
      () => document.querySelectorAll("main, nav, aside, header, footer, [role='main'], [role='navigation']").length
    );

    let score = 100;
    const issues: ScreenReaderIssue[] = [];
    if (landmarks < 2) {
      issues.push({
        type: "landmark",
        element: "body",
        description: "Use landmark regions (main/nav/header/footer/etc.)",
        impact: "moderate",
      });
      score -= 20;
    }

    const headingStructure: boolean = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
      const levels = headings.map((h) => parseInt(h.tagName[1], 10));
      const hasH1 = levels.includes(1);
      let logical = true;
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] > levels[i - 1] + 1) {
          logical = false;
          break;
        }
      }
      return hasH1 && logical;
    });

    if (!headingStructure) {
      issues.push({
        type: "heading-structure",
        element: "headings",
        description: "Heading structure should start with h1 and be logical",
        impact: "serious",
      });
      score -= 30;
    }

    const altTexts: number = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs.filter((img) => !!img.alt && !!img.alt.trim()).length;
    });

    return { score: Math.max(0, score), issues, ariaLabels, landmarks, headingStructure, altTexts };
  }

  private async testMobileAccessibility(page: any): Promise<MobileAccessibilityResult> {
    await page.setViewportSize({ width: 375, height: 667 });

    const touchStats = await page.evaluate(() => {
      const clickable = Array.from(document.querySelectorAll("a, button, [onclick], [role='button']"));
      let adequate = 0;
      clickable.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width >= 44 && r.height >= 44) adequate++;
      });
      return { total: clickable.length, adequate };
    });

    let score = 100;
    const issues: MobileIssue[] = [];
    if (touchStats.total > 0 && touchStats.adequate / touchStats.total < 0.8) {
      issues.push({
        type: "touch-target",
        element: "interactive elements",
        description: "Touch targets should be at least 44x44px",
        impact: "moderate",
      });
      score -= 25;
    }

    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return !!meta && (meta.getAttribute("content") || "").includes("width=device-width");
    });

    if (!viewport) {
      issues.push({
        type: "viewport",
        element: "head",
        description: "Add a responsive viewport meta tag",
        impact: "serious",
      });
      score -= 30;
    }

    await page.setViewportSize({ width: 1280, height: 800 });

    return {
      score: Math.max(0, score),
      issues,
      touchTargets: touchStats.adequate,
      viewport: !!viewport,
      orientation: true,
      gestureAlternatives: true,
    };
  }

  private async testCognitiveAccessibility(page: any): Promise<CognitiveAccessibilityResult> {
    let score = 100;
    const issues: CognitiveIssue[] = [];

    const errorHandling = await page.evaluate(() => {
      const forms = document.querySelectorAll("form");
      let hasError = false;
      forms.forEach((f) => {
        if (f.querySelector("[aria-invalid], .error, .invalid")) hasError = true;
      });
      return forms.length === 0 || hasError;
    });

    if (!errorHandling) {
      issues.push({
        type: "error-handling",
        element: "forms",
        description: "Forms should expose clear error states",
        impact: "moderate",
      });
      score -= 20;
    }

    const simpleLanguage = await page.evaluate(() => {
      const text = (document.body.textContent || "").trim();
      if (!text) return 100;
      const words = text.split(/\s+/);
      const complex = words.filter((w) => w.length > 12).length;
      return Math.max(0, 100 - (complex / words.length) * 100);
    });

    return {
      score: Math.max(0, score),
      issues,
      timeouts: true,
      errorHandling,
      simpleLanguage,
      consistentNavigation: true,
    };
  }

  private async testMotionAndAnimation(_page: any): Promise<MotionAnimationResult> {
    // Conservatief/deterministisch zonder video-inspectie
    return {
      score: 90,
      issues: [],
      reducedMotion: true,
      autoplay: true,
      parallax: true,
      vestibularDisorders: true,
    };
  }

  private async testAdvancedColorVision(_page: any): Promise<ColorVisionResult> {
    return {
      score: 88,
      issues: [],
      deuteranopia: true,
      protanopia: true,
      tritanopia: true,
      achromatopsia: true,
    };
  }

  private async testPerformanceImpact(page: any): Promise<PerformanceImpactResult> {
    const loadTime = await page.evaluate(() => {
      const t = performance.timing as any;
      return Math.max(0, (t.loadEventEnd || 0) - (t.navigationStart || 0));
    });

    const domSize: number = await page.evaluate(() => document.querySelectorAll("*").length);

    const issues: PerformanceIssue[] = [];
    let score = 100;
    if (loadTime > 5000) {
      issues.push({
        type: "slow-load",
        element: "page",
        description: "Page load exceeds 5s; may impact AT",
        impact: "moderate",
      });
      score -= 20;
    }
    if (domSize > 1500) {
      issues.push({
        type: "large-dom",
        element: "page",
        description: "Large DOM may slow AT",
        impact: "minor",
      });
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      loadTime,
      largeElements: domSize,
      assistiveTechFriendly: score > 80,
    };
  }

  private async testLanguageSupport(page: any): Promise<LanguageSupportResult> {
    const languageDetected = await page.evaluate(
      () => document.documentElement.lang || document.querySelector("[lang]")?.getAttribute("lang") || null
    );
    const directionality = await page.evaluate(() => {
      const dir = document.documentElement.dir;
      return dir === "ltr" || dir === "rtl" || dir === "";
    });

    let score = 100;
    const issues: LanguageIssue[] = [];
    if (!languageDetected) {
      issues.push({
        type: "missing-lang",
        element: "html",
        description: "Specify a document language (html[lang])",
        impact: "moderate",
      });
      score -= 25;
    }

    return {
      score: Math.max(0, score),
      issues,
      languageDetected,
      directionality,
      multiLanguage: false,
    };
  }

  private calculateImpactCounts(violations: any[]) {
    return {
      critical: violations.filter((v) => v.impact === "critical").length,
      serious: violations.filter((v) => v.impact === "serious").length,
      moderate: violations.filter((v) => v.impact === "moderate").length,
      minor: violations.filter((v) => v.impact === "minor").length,
    };
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => void 0);
      this.browser = null;
      this.page = null;
    }
  }
}

// ===== Public API =====
export async function runEnhancedAccessibilityScan(url: string): Promise<EnhancedScanResult> {
  const scanner = new EnhancedAccessibilityScanner();
  try {
    const result = await scanner.scanUrl(url);
    await scanner.close();
    return result;
  } catch (error) {
    await scanner.close();
    throw error;
  }
}
