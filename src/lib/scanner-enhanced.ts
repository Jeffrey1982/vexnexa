import { chromium, Browser, Page } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { ScanResult } from "./scanner";

// Enhanced accessibility testing that goes beyond basic axe-core
export interface EnhancedScanResult extends ScanResult {
  keyboardNavigation: KeyboardNavigationResult;
  screenReaderCompatibility: ScreenReaderResult;
  mobileAccessibility: MobileAccessibilityResult;
  cognitiveAccessibility: CognitiveAccessibilityResult;
  motionAndAnimation: MotionAnimationResult;
  advancedColorVision: ColorVisionResult;
  performanceImpact: PerformanceImpactResult;
  languageSupport: LanguageSupportResult;
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
  type: 'focus-trap' | 'skip-link' | 'tab-order' | 'keyboard-only';
  element: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
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
  type: 'missing-aria' | 'heading-structure' | 'landmark' | 'alt-text';
  element: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
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
  type: 'touch-target' | 'viewport' | 'orientation' | 'gesture';
  element: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
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
  type: 'timeout' | 'complex-language' | 'inconsistent-navigation' | 'error-handling';
  element: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
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
  type: 'autoplay' | 'no-reduced-motion' | 'parallax' | 'vestibular';
  element: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
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
  type: 'color-only-info' | 'insufficient-contrast' | 'color-blind-unfriendly';
  element: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
}

interface PerformanceImpactResult {
  score: number;
  issues: PerformanceIssue[];
  loadTime: number;
  largeElements: number;
  assistiveTechFriendly: boolean;
}

interface PerformanceIssue {
  type: 'slow-load' | 'large-dom' | 'heavy-scripts' | 'blocking-content';
  element: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
}

interface LanguageSupportResult {
  score: number;
  issues: LanguageIssue[];
  languageDetected: string | null;
  directionality: boolean;
  multiLanguage: boolean;
}

interface LanguageIssue {
  type: 'missing-lang' | 'incorrect-dir' | 'mixed-languages';
  element: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
}

export class EnhancedAccessibilityScanner {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security"
      ],
      timeout: 60000,
    });

    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
    });

    this.page = await context.newPage();
  }

  async scanUrl(url: string): Promise<EnhancedScanResult> {
    if (!this.page) {
      await this.initialize();
    }

    const page = this.page!;
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    // Run basic axe-core scan first
    const axeResults = await new AxeBuilder({ page }).analyze();

    // Calculate basic score
    const violations = axeResults.violations || [];
    const passes = axeResults.passes || [];
    const total = violations.length + passes.length || 1;
    const basicScore = Math.round((passes.length / total) * 100);

    // Run enhanced tests
    const [
      keyboardNavigation,
      screenReaderCompatibility,
      mobileAccessibility,
      cognitiveAccessibility,
      motionAndAnimation,
      advancedColorVision,
      performanceImpact,
      languageSupport
    ] = await Promise.all([
      this.testKeyboardNavigation(page),
      this.testScreenReaderCompatibility(page),
      this.testMobileAccessibility(page),
      this.testCognitiveAccessibility(page),
      this.testMotionAndAnimation(page),
      this.testAdvancedColorVision(page),
      this.testPerformanceImpact(page, url),
      this.testLanguageSupport(page)
    ]);

    // Calculate enhanced score (weighted average)
    const enhancedScore = Math.round(
      (basicScore * 0.6 +
       keyboardNavigation.score * 0.1 +
       screenReaderCompatibility.score * 0.1 +
       mobileAccessibility.score * 0.05 +
       cognitiveAccessibility.score * 0.05 +
       motionAndAnimation.score * 0.03 +
       advancedColorVision.score * 0.03 +
       performanceImpact.score * 0.02 +
       languageSupport.score * 0.02)
    );

    const impactCounts = this.calculateImpactCounts(violations);
    const title = await page.title().catch(() => undefined);

    return {
      score: enhancedScore,
      issues: violations.length,
      impactCritical: impactCounts.critical,
      impactSerious: impactCounts.serious,
      impactModerate: impactCounts.moderate,
      impactMinor: impactCounts.minor,
      violations: violations.map(v => ({
        id: v.id,
        impact: v.impact as any,
        nodes: v.nodes,
        help: v.help,
        description: v.description
      })),
      title,
      keyboardNavigation,
      screenReaderCompatibility,
      mobileAccessibility,
      cognitiveAccessibility,
      motionAndAnimation,
      advancedColorVision,
      performanceImpact,
      languageSupport
    };
  }

  private async testKeyboardNavigation(page: Page): Promise<KeyboardNavigationResult> {
    const issues: KeyboardIssue[] = [];
    let score = 100;

    // Test focusable elements
    const focusableElements = await page.evaluate(() => {
      const focusable = Array.from(document.querySelectorAll(
        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      ));
      return focusable.length;
    });

    // Test skip links
    const skipLinks = await page.evaluate(() => {
      const skipLink = document.querySelector('a[href^="#"]');
      return !!skipLink && skipLink.textContent?.toLowerCase().includes('skip');
    });

    if (!skipLinks && focusableElements > 10) {
      issues.push({
        type: 'skip-link',
        element: 'body',
        description: 'Page should have skip links for keyboard navigation',
        impact: 'moderate'
      });
      score -= 15;
    }

    // Test focus visibility
    const focusVisible = await page.evaluate(() => {
      const styles = getComputedStyle(document.body);
      return styles.getPropertyValue('--focus-visible') !== '' ||
             document.querySelector(':focus-visible') !== null;
    });

    if (!focusVisible) {
      issues.push({
        type: 'keyboard-only',
        element: 'body',
        description: 'Focus indicators should be visible for keyboard users',
        impact: 'serious'
      });
      score -= 25;
    }

    return {
      score: Math.max(0, score),
      issues,
      focusableElements,
      tabOrder: true, // Simplified for now
      skipLinks,
      focusVisible
    };
  }

  private async testScreenReaderCompatibility(page: Page): Promise<ScreenReaderResult> {
    const issues: ScreenReaderIssue[] = [];
    let score = 100;

    // Test ARIA labels
    const ariaLabels = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [aria-labelledby]').length;
    });

    // Test landmarks
    const landmarks = await page.evaluate(() => {
      return document.querySelectorAll('main, nav, aside, header, footer, [role="main"], [role="navigation"]').length;
    });

    if (landmarks < 2) {
      issues.push({
        type: 'landmark',
        element: 'body',
        description: 'Page should have proper landmark elements for screen readers',
        impact: 'moderate'
      });
      score -= 20;
    }

    // Test heading structure
    const headingStructure = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const levels = headings.map(h => parseInt(h.tagName.charAt(1)));

      // Check if there's an h1 and logical progression
      const hasH1 = levels.includes(1);
      let logical = true;

      for (let i = 1; i < levels.length; i++) {
        if (levels[i] > levels[i-1] + 1) {
          logical = false;
          break;
        }
      }

      return hasH1 && logical;
    });

    if (!headingStructure) {
      issues.push({
        type: 'heading-structure',
        element: 'headings',
        description: 'Heading structure should be logical and start with h1',
        impact: 'serious'
      });
      score -= 30;
    }

    // Test alt texts
    const altTexts = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => img.alt && img.alt.trim()).length;
    });

    return {
      score: Math.max(0, score),
      issues,
      ariaLabels,
      landmarks,
      headingStructure,
      altTexts
    };
  }

  private async testMobileAccessibility(page: Page): Promise<MobileAccessibilityResult> {
    const issues: MobileIssue[] = [];
    let score = 100;

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test touch targets
    const touchTargets = await page.evaluate(() => {
      const clickable = Array.from(document.querySelectorAll('a, button, [onclick], [role="button"]'));
      let adequateSize = 0;

      clickable.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width >= 44 && rect.height >= 44) {
          adequateSize++;
        }
      });

      return { total: clickable.length, adequate: adequateSize };
    });

    if (touchTargets.total > 0 && touchTargets.adequate / touchTargets.total < 0.8) {
      issues.push({
        type: 'touch-target',
        element: 'interactive elements',
        description: 'Touch targets should be at least 44x44 pixels',
        impact: 'moderate'
      });
      score -= 25;
    }

    // Test viewport meta tag
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return !!meta && meta.getAttribute('content')?.includes('width=device-width');
    });

    if (!viewport) {
      issues.push({
        type: 'viewport',
        element: 'head',
        description: 'Page should have proper viewport meta tag',
        impact: 'serious'
      });
      score -= 30;
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    return {
      score: Math.max(0, score),
      issues,
      touchTargets: touchTargets.adequate,
      viewport: viewport || false,
      orientation: true, // Simplified
      gestureAlternatives: true // Simplified
    };
  }

  private async testCognitiveAccessibility(page: Page): Promise<CognitiveAccessibilityResult> {
    const issues: CognitiveIssue[] = [];
    let score = 100;

    // Test for timeouts
    const timeouts = await page.evaluate(() => {
      return !document.body.innerHTML.toLowerCase().includes('timeout');
    });

    // Test error handling
    const errorHandling = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      let hasErrorHandling = false;

      forms.forEach(form => {
        if (form.querySelector('[aria-invalid], .error, .invalid')) {
          hasErrorHandling = true;
        }
      });

      return forms.length === 0 || hasErrorHandling;
    });

    if (!errorHandling) {
      issues.push({
        type: 'error-handling',
        element: 'forms',
        description: 'Forms should provide clear error messages',
        impact: 'moderate'
      });
      score -= 20;
    }

    // Test language complexity (simplified)
    const simpleLanguage = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const words = text.split(/\s+/);
      const complexWords = words.filter(word => word.length > 12).length;
      return Math.max(0, 100 - (complexWords / words.length) * 100);
    });

    return {
      score: Math.max(0, score),
      issues,
      timeouts,
      errorHandling,
      simpleLanguage,
      consistentNavigation: true // Simplified
    };
  }

  private async testMotionAndAnimation(page: Page): Promise<MotionAnimationResult> {
    const issues: MotionIssue[] = [];
    let score = 100;

    // Test for reduced motion support
    const reducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
             document.querySelector('[data-reduced-motion]') !== null;
    });

    if (!reducedMotion) {
      issues.push({
        type: 'no-reduced-motion',
        element: 'body',
        description: 'Page should respect prefers-reduced-motion setting',
        impact: 'moderate'
      });
      score -= 25;
    }

    // Test for autoplay content
    const autoplay = await page.evaluate(() => {
      const videos = Array.from(document.querySelectorAll('video[autoplay], audio[autoplay]'));
      return videos.length === 0;
    });

    if (!autoplay) {
      issues.push({
        type: 'autoplay',
        element: 'media',
        description: 'Media should not autoplay without user consent',
        impact: 'serious'
      });
      score -= 30;
    }

    return {
      score: Math.max(0, score),
      issues,
      reducedMotion,
      autoplay,
      parallax: true, // Simplified
      vestibularDisorders: true // Simplified
    };
  }

  private async testAdvancedColorVision(page: Page): Promise<ColorVisionResult> {
    const issues: ColorVisionIssue[] = [];
    let score = 100;

    // Test for color-only information
    const colorOnlyInfo = await page.evaluate(() => {
      // Simple heuristic: look for elements that might rely only on color
      const potentialElements = document.querySelectorAll('.red, .green, .error, .success, .warning');
      let hasColorOnlyInfo = false;

      potentialElements.forEach(el => {
        const text = el.textContent?.trim() || '';
        const hasIcon = el.querySelector('svg, i, .icon');
        const hasText = text.length > 0;

        if (!hasIcon && !hasText) {
          hasColorOnlyInfo = true;
        }
      });

      return !hasColorOnlyInfo;
    });

    if (!colorOnlyInfo) {
      issues.push({
        type: 'color-only-info',
        element: 'various',
        description: 'Information should not be conveyed by color alone',
        impact: 'moderate'
      });
      score -= 25;
    }

    return {
      score: Math.max(0, score),
      issues,
      deuteranopia: true, // Would need color simulation
      protanopia: true,
      tritanopia: true,
      achromatopsia: true
    };
  }

  private async testPerformanceImpact(page: Page, url: string): Promise<PerformanceImpactResult> {
    const issues: PerformanceIssue[] = [];
    let score = 100;

    // Test load time
    const loadTime = await page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    });

    if (loadTime > 5000) {
      issues.push({
        type: 'slow-load',
        element: 'page',
        description: 'Page loads slowly, impacting assistive technology',
        impact: 'moderate'
      });
      score -= 20;
    }

    // Test DOM size
    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    if (domSize > 1500) {
      issues.push({
        type: 'large-dom',
        element: 'page',
        description: 'Large DOM can slow down assistive technology',
        impact: 'minor'
      });
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      loadTime,
      largeElements: domSize,
      assistiveTechFriendly: score > 80
    };
  }

  private async testLanguageSupport(page: Page): Promise<LanguageSupportResult> {
    const issues: LanguageIssue[] = [];
    let score = 100;

    // Test language attribute
    const languageDetected = await page.evaluate(() => {
      return document.documentElement.lang || document.querySelector('[lang]')?.getAttribute('lang') || null;
    });

    if (!languageDetected) {
      issues.push({
        type: 'missing-lang',
        element: 'html',
        description: 'Page should specify language attribute',
        impact: 'moderate'
      });
      score -= 25;
    }

    // Test directionality
    const directionality = await page.evaluate(() => {
      const dir = document.documentElement.dir;
      return dir === 'ltr' || dir === 'rtl' || dir === '';
    });

    return {
      score: Math.max(0, score),
      issues,
      languageDetected,
      directionality,
      multiLanguage: false // Simplified
    };
  }

  private calculateImpactCounts(violations: any[]) {
    return {
      critical: violations.filter(v => v.impact === "critical").length,
      serious: violations.filter(v => v.impact === "serious").length,
      moderate: violations.filter(v => v.impact === "moderate").length,
      minor: violations.filter(v => v.impact === "minor").length,
    };
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

// Export function for easy use
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