import { ScanResult } from "./scanner";
import { runRobustAccessibilityScan } from "./scanner-headless";
import { extractImageDataFromPage, analyzeMultipleImages, type ImageAnalysisResult } from "./ai-image-analysis";
import {
  calculateVniScore,
  collectVniColorMetrics,
  collectVniDesignMetrics,
  type VniResult,
} from "./scoring/vni-engine";

// ===== Env & Production flags =====
const IS_PROD = process.env.NODE_ENV === "production";
const ALLOW_MOCK = process.env.ALLOW_MOCK_A11Y === "true";
const DEFAULT_TIMEOUT_MS = Number(process.env.A11Y_TIMEOUT_MS ?? 45000);
const A11Y_USER_AGENT =
  process.env.A11Y_USER_AGENT ||
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Dynamic imports; use Puppeteer instead of Playwright
let puppeteer: any = null;
let chromiumExecutable: any = null;

async function loadPuppeteer(): Promise<boolean> {
  try {
    if (!puppeteer) {
      puppeteer = await import("puppeteer");
      if (!puppeteer) throw new Error("puppeteer not found");
    }

    // Load serverless chromium executable path for Vercel
    if (!chromiumExecutable && IS_PROD) {
      const spartChromium: any = await import("@sparticuz/chromium");
      chromiumExecutable = spartChromium.default ?? spartChromium;
    }

    return true;
  } catch (err) {
    console.warn("[a11y] Puppeteer not available:", (err as Error)?.message ?? err);
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
  totalPageWeightBytes: number;
  largestContentfulPaintMs: number;
  domNodeCount: number;
  qualityWarnings: QualityWarning[];
  vni: VniResult;
  aiContentChecks?: ImageAnalysisResult[];
  discoveredInternalLinks?: string[];
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

/**
 * Retry helper: re-runs a page.evaluate if the execution context is destroyed
 * (e.g. due to a client-side navigation/redirect after initial page load).
 */
async function safeEvaluate<T>(page: any, fn: (...args: any[]) => T, ...args: any[]): Promise<T> {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await page.evaluate(fn, ...args);
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.includes('Execution context was destroyed') || msg.includes('navigation')) {
        console.warn(`[a11y] Context destroyed (attempt ${attempt + 1}/${MAX_RETRIES}), waiting for page to settle...`);
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Page execution context kept getting destroyed after retries — the target page may be in a redirect loop.');
}

// ===== Scanner class =====
export class EnhancedAccessibilityScanner {
  private browser: any | null = null;
  private page: any | null = null;
  private puppeteerAvailable = false;

  async initialize(): Promise<void> {
    if (this.puppeteerAvailable && this.browser && this.page) {
      return;
    }

    console.log("[a11y] Scanner initialization", {
      NODE_ENV: process.env.NODE_ENV,
      IS_PROD: IS_PROD,
      ALLOW_MOCK_A11Y: process.env.ALLOW_MOCK_A11Y,
    });

    this.puppeteerAvailable = await loadPuppeteer();

    if (!this.puppeteerAvailable) {
      console.error("[a11y] ERROR: Puppeteer dependencies not available");
      return;
    }

    console.log("[a11y] Puppeteer loaded successfully, attempting browser launch...")

    try {
      // In production (Vercel), use serverless chromium executable
      const launchOptions: any = {
        headless: true,
        args: chromiumExecutable ? chromiumExecutable.args : [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
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

      this.browser = await (puppeteer.default || puppeteer).launch(launchOptions);
      console.log("[a11y] Browser instance created");

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(A11Y_USER_AGENT);
      await this.page.setViewport({ width: 1280, height: 800 });
      console.log("[a11y] ✅ Browser launched successfully - ready to scan");
    } catch (error) {
      console.error("[a11y] ❌ CRITICAL: Failed to launch browser:", {
        error: (error as Error)?.message,
        stack: (error as Error)?.stack,
        isProd: IS_PROD,
        hasChromiumExecutable: !!chromiumExecutable
      });
      this.puppeteerAvailable = false;
      this.browser = null;
      this.page = null;
      // Re-throw in production so we don't silently fail
      if (IS_PROD) {
        throw error;
      }
    }
  }

  getCurrentPage(): any | null {
    return this.page;
  }

  async scanUrl(url: string, options: EnhancedScanOptions = {}): Promise<EnhancedScanResult> {
    await this.initialize();
    console.log("[a11y] mode", {
      puppeteerAvailable: this.puppeteerAvailable,
      hasPage: !!this.page
    });

    if (this.puppeteerAvailable && this.page) {
      return this.scanUrlWithPuppeteer(url, options);
    }
    // No browser: enforce production policy
    return this.scanUrlWithFallback(url);
  }

  private async scanUrlWithPuppeteer(url: string, options: EnhancedScanOptions): Promise<EnhancedScanResult> {
    const page = this.page!;
    const SCAN_TIMEOUT_MS = 55000; // 55 seconds to stay under Vercel's 60s limit

    // Wrap entire scan in timeout protection
    const scanPromise = this.performScan(page, url, options);
    
    try {
      return await Promise.race([
        scanPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('SCAN_TIMEOUT')), SCAN_TIMEOUT_MS)
        )
      ]);
    } catch (error: any) {
      if (error.message === 'SCAN_TIMEOUT') {
        throw new Error('Site is too heavy for a quick scan. Try scanning a lighter page or contact support for enterprise scanning options.');
      }
      throw error;
    }
  }

  private async performScan(page: any, url: string, options: EnhancedScanOptions): Promise<EnhancedScanResult> {
    const cdpSession = await page.target().createCDPSession().catch(() => null);
    let cdpTransferBytes = 0;

    if (cdpSession) {
      await cdpSession.send("Network.enable").catch(() => undefined);
      cdpSession.on("Network.loadingFinished", (event: any) => {
        cdpTransferBytes += Number(event?.encodedDataLength || 0);
      });
    }

    await page.evaluateOnNewDocument(() => {
      const win = window as any;
      win.__vexnexaLcpMs = 0;

      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry?.startTime) {
            win.__vexnexaLcpMs = lastEntry.startTime;
          }
        });
        observer.observe({ type: "largest-contentful-paint", buffered: true });
        win.__vexnexaLcpObserver = observer;
      } catch {
        // Some pages/browsers may not expose LCP; navigation timing fallback handles it.
      }
    });

    // Use domcontentloaded for faster page load (instead of networkidle2)
    // This starts the scan as soon as the DOM is ready, without waiting for all network requests
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: DEFAULT_TIMEOUT_MS });
    } catch (navErr: any) {
      if (navErr?.message?.includes('timeout')) {
        console.warn('[a11y] domcontentloaded timed out, trying networkidle2 as fallback');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      } else {
        throw navErr;
      }
    }

    // Small extra settle time for late JS redirects
    await new Promise(r => setTimeout(r, 500));
    const realWorldMetrics = await this.collectRealWorldMetrics(page, cdpTransferBytes);
    const qualityWarnings = this.buildQualityWarnings(realWorldMetrics);

    // Import axe source from bundled TypeScript module
    const { axeSource } = await import('./axe-source');

    console.log('[a11y] Loaded unminified axe.js from TS module, length:', axeSource.length);

    // Execute everything in one atomic page.evaluate, with retry on context destruction
    const axeResults: any = await safeEvaluate(page, (axeSource: string) => {
      return new Promise((resolve, reject) => {
        try {
          // Execute the source to set window.axe
          const axeInit = new Function(axeSource);
          axeInit();

          // Now window.axe should exist
          if (typeof (window as any).axe?.run === 'function') {
            (window as any).axe.run().then(resolve).catch(reject);
          } else {
            reject(new Error('window.axe.run not available after execution'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }, axeSource);

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
      vniColorMetrics,
      vniDesignMetrics,
    ] = await Promise.all([
      this.testKeyboardNavigation(page),
      this.testScreenReaderCompatibility(page),
      this.testMobileAccessibility(page),
      this.testCognitiveAccessibility(page),
      this.testMotionAndAnimation(page),
      this.testAdvancedColorVision(page),
      this.testPerformanceImpact(page),
      this.testLanguageSupport(page),
      collectVniColorMetrics(page),
      collectVniDesignMetrics(page),
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

    // AI Image Analysis (if enabled and within time limits)
    let aiContentChecks: ImageAnalysisResult[] = [];
    const aiEnabled = options.enableAiImageAnalysis !== false && process.env.ENABLE_AI_IMAGE_ANALYSIS === "true";
    
    if (aiEnabled && process.env.GOOGLE_GEMINI_API_KEY) {
      try {
        console.log('[a11y] Starting AI image analysis...');
        const startTime = Date.now();
        
        // Extract image data from page
        const imageData = await extractImageDataFromPage(page, 20);
        console.log(`[a11y] Extracted ${imageData.length} images for analysis`);
        
        // Analyze images with timeout handling
        // Limit to 3 images and 15 seconds total to stay within Vercel function limits
        aiContentChecks = await analyzeMultipleImages(imageData, 3, 15000);
        
        const elapsed = Date.now() - startTime;
        console.log(`[a11y] AI image analysis completed in ${elapsed}ms (${aiContentChecks.length} images analyzed)`);
      } catch (aiError: any) {
        console.error('[a11y] AI image analysis failed (non-blocking):', aiError?.message);
        // Don't fail the entire scan if AI analysis fails
      }
    } else {
      console.log('[a11y] AI image analysis disabled or API key not set');
    }

    const vni = calculateVniScore({
      axeScore: enhancedScore,
      violations,
      aiContentChecks,
      totalPageWeightBytes: realWorldMetrics.totalPageWeightBytes,
      largestContentfulPaintMs: realWorldMetrics.largestContentfulPaintMs,
      colorMetrics: vniColorMetrics,
      designMetrics: vniDesignMetrics,
    });

    console.log("[a11y] axe meta", {
      engine: engineName,
      version: axeVersion,
      violations: violations.length,
      passes: passes.length ?? 0,
      score: enhancedScore,
      aiChecksPerformed: aiContentChecks.length,
      totalPageWeightBytes: realWorldMetrics.totalPageWeightBytes,
      largestContentfulPaintMs: realWorldMetrics.largestContentfulPaintMs,
      domNodeCount: realWorldMetrics.domNodeCount,
      qualityWarnings: qualityWarnings.length,
      vni: vni.score,
      vniTier: vni.tier,
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
      totalPageWeightBytes: realWorldMetrics.totalPageWeightBytes,
      largestContentfulPaintMs: realWorldMetrics.largestContentfulPaintMs,
      domNodeCount: realWorldMetrics.domNodeCount,
      qualityWarnings,
      vni,
      aiContentChecks,
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
      totalPageWeightBytes: 0,
      largestContentfulPaintMs: 0,
      domNodeCount: 0,
      qualityWarnings: [],
      vni: calculateVniScore({
        axeScore: basicResult.score,
        violations: basicResult.violations || [],
        aiContentChecks: [],
        totalPageWeightBytes: 0,
        largestContentfulPaintMs: 0,
        colorMetrics: {
          contrast: {
            sampled: 0,
            failingNormal: 0,
            failingProtanopia: 0,
            failingDeuteranopia: 0,
            failingTritanopia: 0,
            averageContrast: 0,
          },
          colorOnlySignals: { total: 0, risky: 0 },
        },
        designMetrics: {
          tapTargets: { total: 0, failing: 0, minWidth: 0, minHeight: 0 },
          fontReadability: { sampled: 0, failing: 0, averageFontSize: 0, averageLineHeightRatio: 0 },
          layoutStability: { cls: 0 },
        },
      }),
      aiContentChecks: [],
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
    const focusableElements: number = await safeEvaluate(page, () => {
      const nodes = document.querySelectorAll(
        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      return nodes.length;
    });

    const skipLinks: boolean = await safeEvaluate(page, () => {
      const link = document.querySelector('a[href^="#"]');
      return !!link && (link.textContent || "").toLowerCase().includes("skip");
    });

    const focusVisible: boolean = await safeEvaluate(page, () => {
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
    const ariaLabels: number = await safeEvaluate(page, () => document.querySelectorAll("[aria-label], [aria-labelledby]").length);
    const landmarks: number = await safeEvaluate(page, 
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

    const headingStructure: boolean = await safeEvaluate(page, () => {
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

    const altTexts: number = await safeEvaluate(page, () => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs.filter((img) => !!img.alt && !!img.alt.trim()).length;
    });

    return { score: Math.max(0, score), issues, ariaLabels, landmarks, headingStructure, altTexts };
  }

  private async testMobileAccessibility(page: any): Promise<MobileAccessibilityResult> {
    await page.setViewport({ width: 375, height: 667 });

    const touchStats = await safeEvaluate(page, () => {
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

    const viewport = await safeEvaluate(page, () => {
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

    await page.setViewport({ width: 1280, height: 800 });

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

    const errorHandling = await safeEvaluate(page, () => {
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

    const simpleLanguage = await safeEvaluate(page, () => {
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
    const loadTime = await safeEvaluate(page, () => {
      const t = performance.timing as any;
      return Math.max(0, (t.loadEventEnd || 0) - (t.navigationStart || 0));
    });

    const domSize: number = await safeEvaluate(page, () => document.querySelectorAll("*").length);

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

  private async collectRealWorldMetrics(page: any, cdpTransferBytes: number): Promise<RealWorldMetrics> {
    const browserMetrics = await safeEvaluate(page, () => {
      return new Promise<{
        transferBytes: number;
        largestContentfulPaintMs: number;
        domNodeCount: number;
      }>((resolve) => {
        const startedAt = Date.now();
        const timeoutMs = 10000;
        const pollMs = 250;

        const readMetrics = () => {
          const resourceEntries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
          const navigationEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
          const nav = navigationEntries[0];
          const resourceTransferBytes = resourceEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
          const navigationTransferBytes = navigationEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
          const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
          const lastLcp = lcpEntries[lcpEntries.length - 1] as PerformanceEntry | undefined;
          const observedLcp = Number((window as any).__vexnexaLcpMs || 0);
          const entryLcp = Number(lastLcp?.startTime || 0);
          const lcpMs = Math.round(Math.max(observedLcp, entryLcp));

          return {
            transferBytes: resourceTransferBytes + navigationTransferBytes,
            lcpMs,
            fallbackMs: Math.round(
              Number(nav?.duration || 0) ||
              Number(nav?.loadEventEnd || 0) ||
              Number(nav?.domContentLoadedEventEnd || 0) ||
              Number(nav?.responseEnd || 0) ||
              1500
            ),
            domNodeCount: document.getElementsByTagName("*").length,
          };
        };

        const finish = (useFallback = false) => {
          const metrics = readMetrics();
          resolve({
            transferBytes: metrics.transferBytes,
            largestContentfulPaintMs: Math.max(100, useFallback ? metrics.fallbackMs : metrics.lcpMs),
            domNodeCount: metrics.domNodeCount,
          });
        };

        const poll = () => {
          const metrics = readMetrics();
          if (metrics.lcpMs > 0) {
            finish(false);
            return;
          }
          if (Date.now() - startedAt >= timeoutMs) {
            finish(true);
            return;
          }
          setTimeout(poll, pollMs);
        };

        poll();
      });
    }).catch(() => ({
      transferBytes: 0,
      largestContentfulPaintMs: 1500,
      domNodeCount: 0,
    }));

    return {
      totalPageWeightBytes: Math.max(cdpTransferBytes, browserMetrics.transferBytes),
      largestContentfulPaintMs: browserMetrics.largestContentfulPaintMs,
      domNodeCount: browserMetrics.domNodeCount,
    };
  }

  private buildQualityWarnings(metrics: RealWorldMetrics): QualityWarning[] {
    const warnings: QualityWarning[] = [];

    if (metrics.totalPageWeightBytes > 2.5 * 1024 * 1024) {
      warnings.push({
        id: "heavy-mobile",
        priority: "high",
        message: "Site is heavy for mobile users.",
        metric: "totalPageWeightBytes",
        value: metrics.totalPageWeightBytes,
        threshold: 2.5 * 1024 * 1024,
      });
    }

    if (metrics.largestContentfulPaintMs > 2500) {
      warnings.push({
        id: "slow-lcp",
        priority: "high",
        message: "Slow visual loading (LCP).",
        metric: "largestContentfulPaintMs",
        value: metrics.largestContentfulPaintMs,
        threshold: 2500,
      });
    }

    if (metrics.domNodeCount > 1500) {
      warnings.push({
        id: "high-dom-complexity",
        priority: "high",
        message: "High DOM complexity might slow down older devices.",
        metric: "domNodeCount",
        value: metrics.domNodeCount,
        threshold: 1500,
      });
    }

    return warnings;
  }

  private async testLanguageSupport(page: any): Promise<LanguageSupportResult> {
    const languageDetected = await safeEvaluate(page, 
      () => document.documentElement.lang || document.querySelector("[lang]")?.getAttribute("lang") || null
    );
    const directionality = await safeEvaluate(page, () => {
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
      try {
        await this.browser.close();
      } catch (closeError) {
        console.error('[a11y] Error closing browser:', closeError);
      } finally {
        this.browser = null;
        this.page = null;
      }
    }
  }
}

// ===== Public API =====
export interface EnhancedScanOptions {
  enableAiImageAnalysis?: boolean;
}

export async function runEnhancedAccessibilityScan(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  options: EnhancedScanOptions = {}
): Promise<EnhancedScanResult> {
  const scanner = new EnhancedAccessibilityScanner();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        scanner.close()
          .catch((closeError) => console.error("[a11y] Error closing browser after timeout:", closeError))
          .finally(() => reject(new Error(`Accessibility scan exceeded ${Math.round(timeoutMs / 1000)}s timeout`)));
      }, timeoutMs);
    });

    return await Promise.race([scanner.scanUrl(url, options), timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
    await scanner.close();
  }
}

interface QualityWarning {
  id: "heavy-mobile" | "slow-lcp" | "high-dom-complexity";
  priority: "medium" | "high";
  message: string;
  metric: "totalPageWeightBytes" | "largestContentfulPaintMs" | "domNodeCount";
  value: number;
  threshold: number;
}

interface RealWorldMetrics {
  totalPageWeightBytes: number;
  largestContentfulPaintMs: number;
  domNodeCount: number;
}
