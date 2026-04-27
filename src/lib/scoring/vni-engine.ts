import type { ImageAnalysisResult } from "@/lib/ai-image-analysis";

type Impact = "minor" | "moderate" | "serious" | "critical";

export interface VniDesignMetrics {
  tapTargets: {
    total: number;
    failing: number;
    minWidth: number;
    minHeight: number;
  };
  fontReadability: {
    sampled: number;
    failing: number;
    averageFontSize: number;
    averageLineHeightRatio: number;
  };
  layoutStability: {
    cls: number;
  };
}

export interface VniColorMetrics {
  contrast: {
    sampled: number;
    failingNormal: number;
    failingProtanopia: number;
    failingDeuteranopia: number;
    failingTritanopia: number;
    averageContrast: number;
  };
  colorOnlySignals: {
    total: number;
    risky: number;
  };
}

export interface VniResult {
  score: number;
  tier: "Apex" | "Elite" | "Authority" | "Trusted" | "Watchlist";
  pillars: {
    wcagCompliance: number;
    aiContentIntegrity: number;
    performanceSpeed: number;
    colorBlindnessContrast: number;
    designQualityUx: number;
  };
  internal: {
    penalties: Record<string, number>;
    colorMetrics: VniColorMetrics;
    designMetrics: VniDesignMetrics;
  };
}

interface CalculateVniInput {
  axeScore: number;
  violations: Array<{ impact?: Impact | null; nodes?: unknown[] }>;
  aiContentChecks: ImageAnalysisResult[];
  totalPageWeightBytes: number;
  largestContentfulPaintMs: number;
  colorMetrics: VniColorMetrics;
  designMetrics: VniDesignMetrics;
}

const PILLAR_MAX = 500;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function toPillarScore(ratio: number) {
  return Math.round(PILLAR_MAX * clamp(ratio));
}

function getVniTier(score: number): VniResult["tier"] {
  if (score >= 2250) return "Apex";
  if (score >= 2000) return "Elite";
  if (score >= 1700) return "Authority";
  if (score >= 1300) return "Trusted";
  return "Watchlist";
}

function contrastRatio(foreground: [number, number, number], background: [number, number, number]) {
  const lum = ([r, g, b]: [number, number, number]) => {
    const linear = [r, g, b].map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const l1 = lum(foreground);
  const l2 = lum(background);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function simulateColorVision([r, g, b]: [number, number, number], type: "protanopia" | "deuteranopia" | "tritanopia"): [number, number, number] {
  const matrices = {
    protanopia: [
      [0.567, 0.433, 0],
      [0.558, 0.442, 0],
      [0, 0.242, 0.758],
    ],
    deuteranopia: [
      [0.625, 0.375, 0],
      [0.7, 0.3, 0],
      [0, 0.3, 0.7],
    ],
    tritanopia: [
      [0.95, 0.05, 0],
      [0, 0.433, 0.567],
      [0, 0.475, 0.525],
    ],
  }[type];

  return [
    Math.round(clamp((matrices[0][0] * r + matrices[0][1] * g + matrices[0][2] * b) / 255) * 255),
    Math.round(clamp((matrices[1][0] * r + matrices[1][1] * g + matrices[1][2] * b) / 255) * 255),
    Math.round(clamp((matrices[2][0] * r + matrices[2][1] * g + matrices[2][2] * b) / 255) * 255),
  ];
}

function parseRgb(value: string): [number, number, number] | null {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

export async function collectVniColorMetrics(page: any): Promise<VniColorMetrics> {
  const samples = await page.evaluate(() => {
    const parse = (value: string) => {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
    };

    const getOpaqueBackground = (element: Element) => {
      let current: Element | null = element;
      while (current) {
        const bg = getComputedStyle(current).backgroundColor;
        if (bg && !bg.includes("rgba(0, 0, 0, 0)") && bg !== "transparent") return bg;
        current = current.parentElement;
      }
      return "rgb(255, 255, 255)";
    };

    const textElements = Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const text = (element.textContent || "").trim();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && text.length > 0 && style.visibility !== "hidden" && style.display !== "none";
      })
      .slice(0, 250)
      .map((element) => {
        const style = getComputedStyle(element);
        return {
          color: style.color,
          backgroundColor: getOpaqueBackground(element),
        };
      });

    const colorOnlySignals = Array.from(document.querySelectorAll("[class], [role='alert'], [aria-invalid='true']"))
      .filter((element) => {
        const text = (element.textContent || "").trim();
        const className = String((element as HTMLElement).className || "");
        const style = getComputedStyle(element);
        const looksSemantic = /error|danger|success|warning|invalid|required/i.test(className) || element.getAttribute("role") === "alert" || element.getAttribute("aria-invalid") === "true";
        const hasNonColorCue = Boolean(element.querySelector("svg,img,[aria-label]")) || /^[!✓x×*]/i.test(text);
        const color = parse(style.color);
        const isRedOrGreen = color ? (color[0] > 150 && color[1] < 120) || (color[1] > 120 && color[0] < 120) : false;
        return (looksSemantic || isRedOrGreen) && !hasNonColorCue;
      }).length;

    return {
      textElements,
      colorOnlySignals,
      colorOnlyTotal: document.querySelectorAll("[class], [role='alert'], [aria-invalid='true']").length,
    };
  }).catch(() => ({ textElements: [], colorOnlySignals: 0, colorOnlyTotal: 0 }));

  let failingNormal = 0;
  let failingProtanopia = 0;
  let failingDeuteranopia = 0;
  let failingTritanopia = 0;
  let contrastTotal = 0;
  let sampled = 0;

  for (const sample of samples.textElements as Array<{ color: string; backgroundColor: string }>) {
    const fg = parseRgb(sample.color);
    const bg = parseRgb(sample.backgroundColor);
    if (!fg || !bg) continue;

    sampled += 1;
    const normal = contrastRatio(fg, bg);
    contrastTotal += normal;
    if (normal < 4.5) failingNormal += 1;
    if (contrastRatio(simulateColorVision(fg, "protanopia"), simulateColorVision(bg, "protanopia")) < 4.5) failingProtanopia += 1;
    if (contrastRatio(simulateColorVision(fg, "deuteranopia"), simulateColorVision(bg, "deuteranopia")) < 4.5) failingDeuteranopia += 1;
    if (contrastRatio(simulateColorVision(fg, "tritanopia"), simulateColorVision(bg, "tritanopia")) < 4.5) failingTritanopia += 1;
  }

  return {
    contrast: {
      sampled,
      failingNormal,
      failingProtanopia,
      failingDeuteranopia,
      failingTritanopia,
      averageContrast: sampled > 0 ? Number((contrastTotal / sampled).toFixed(2)) : 0,
    },
    colorOnlySignals: {
      total: Number(samples.colorOnlyTotal || 0),
      risky: Number(samples.colorOnlySignals || 0),
    },
  };
}

export async function collectVniDesignMetrics(page: any): Promise<VniDesignMetrics> {
  return page.evaluate(() => {
    const interactive = Array.from(document.querySelectorAll("a, button, input, select, textarea, [role='button'], [tabindex]:not([tabindex='-1'])"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });

    const readableText = Array.from(document.querySelectorAll("p, li, article, section, main, label, button, a"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const text = (element.textContent || "").trim();
        return rect.width > 0 && rect.height > 0 && text.length >= 20;
      })
      .slice(0, 200)
      .map((element) => {
        const style = getComputedStyle(element);
        const fontSize = parseFloat(style.fontSize || "0");
        const lineHeight = style.lineHeight === "normal" ? fontSize * 1.2 : parseFloat(style.lineHeight || "0");
        return {
          fontSize,
          lineHeightRatio: fontSize > 0 ? lineHeight / fontSize : 0,
        };
      });

    const layoutShiftEntries = performance.getEntriesByType("layout-shift") as any[];
    const cls = layoutShiftEntries
      .filter((entry) => !entry.hadRecentInput)
      .reduce((sum, entry) => sum + (entry.value || 0), 0);

    const failingTapTargets = interactive.filter((target) => target.width < 44 || target.height < 44);
    const failingFonts = readableText.filter((text) => text.fontSize < 16 || text.lineHeightRatio < 1.35);

    return {
      tapTargets: {
        total: interactive.length,
        failing: failingTapTargets.length,
        minWidth: interactive.length ? Math.round(Math.min(...interactive.map((target) => target.width))) : 0,
        minHeight: interactive.length ? Math.round(Math.min(...interactive.map((target) => target.height))) : 0,
      },
      fontReadability: {
        sampled: readableText.length,
        failing: failingFonts.length,
        averageFontSize: readableText.length ? Math.round(readableText.reduce((sum, text) => sum + text.fontSize, 0) / readableText.length) : 0,
        averageLineHeightRatio: readableText.length ? Number((readableText.reduce((sum, text) => sum + text.lineHeightRatio, 0) / readableText.length).toFixed(2)) : 0,
      },
      layoutStability: {
        cls: Number(cls.toFixed(3)),
      },
    };
  }).catch(() => ({
    tapTargets: { total: 0, failing: 0, minWidth: 0, minHeight: 0 },
    fontReadability: { sampled: 0, failing: 0, averageFontSize: 0, averageLineHeightRatio: 0 },
    layoutStability: { cls: 0 },
  }));
}

export function calculateVniScore(input: CalculateVniInput): VniResult {
  const criticalNodes = input.violations
    .filter((violation) => violation.impact === "critical")
    .reduce((sum, violation) => sum + Math.max(1, violation.nodes?.length || 1), 0);
  const seriousNodes = input.violations
    .filter((violation) => violation.impact === "serious")
    .reduce((sum, violation) => sum + Math.max(1, violation.nodes?.length || 1), 0);

  const wcagCriticalPenalty = Math.pow(0.72, criticalNodes) * Math.pow(0.9, seriousNodes);
  const wcagCompliance = toPillarScore((input.axeScore / 100) * wcagCriticalPenalty);

  const aiScores = input.aiContentChecks.filter((check) => !check.error).map((check) => check.score);
  const aiAccuracyPenalty = input.aiContentChecks.some((check) => check.isAccurate === false) ? 0.78 : 1;
  const aiContentIntegrity = toPillarScore((aiScores.length ? aiScores.reduce((sum, score) => sum + score, 0) / aiScores.length / 100 : 0.9) * aiAccuracyPenalty);

  const lcpPenalty = input.largestContentfulPaintMs <= 1200
    ? 1
    : input.largestContentfulPaintMs <= 2500
      ? clamp(1 - (input.largestContentfulPaintMs - 1200) / 2600, 0.5, 1)
      : Math.max(0.08, Math.exp(-(input.largestContentfulPaintMs - 2500) / 1900) * 0.55);
  const payloadPenalty = input.totalPageWeightBytes <= 1024 * 1024
    ? 1
    : input.totalPageWeightBytes <= 2.5 * 1024 * 1024
      ? clamp(1 - (input.totalPageWeightBytes - 1024 * 1024) / (4 * 1024 * 1024), 0.58, 1)
      : Math.max(0.08, Math.exp(-(input.totalPageWeightBytes - 2.5 * 1024 * 1024) / (2 * 1024 * 1024)) * 0.58);
  const performanceSpeed = toPillarScore(Math.min(lcpPenalty, payloadPenalty) * Math.sqrt(lcpPenalty * payloadPenalty));

  const contrast = input.colorMetrics.contrast;
  const contrastSampleBase = Math.max(1, contrast.sampled);
  const contrastFailureRate = Math.max(
    contrast.failingNormal,
    contrast.failingProtanopia,
    contrast.failingDeuteranopia,
    contrast.failingTritanopia
  ) / contrastSampleBase;
  const colorOnlyRate = input.colorMetrics.colorOnlySignals.risky / Math.max(1, input.colorMetrics.colorOnlySignals.total || input.colorMetrics.colorOnlySignals.risky);
  const colorBlindnessContrast = toPillarScore(Math.pow(1 - clamp(contrastFailureRate), 1.7) * Math.pow(1 - clamp(colorOnlyRate), 1.3));

  const tapFailureRate = input.designMetrics.tapTargets.failing / Math.max(1, input.designMetrics.tapTargets.total);
  const fontFailureRate = input.designMetrics.fontReadability.failing / Math.max(1, input.designMetrics.fontReadability.sampled);
  const clsPenalty = input.designMetrics.layoutStability.cls <= 0.1
    ? 1
    : input.designMetrics.layoutStability.cls <= 0.25
      ? 0.72
      : Math.max(0.18, 0.72 * Math.exp(-(input.designMetrics.layoutStability.cls - 0.25) * 3.8));
  const designQualityUx = toPillarScore(Math.pow(1 - clamp(tapFailureRate), 1.4) * Math.pow(1 - clamp(fontFailureRate), 1.2) * clsPenalty);

  const rawTotal = wcagCompliance + aiContentIntegrity + performanceSpeed + colorBlindnessContrast + designQualityUx;
  const globalCriticalPenalty = criticalNodes > 0 ? Math.pow(0.88, criticalNodes) : 1;
  const globalSpeedPenalty = input.largestContentfulPaintMs > 5000 || input.totalPageWeightBytes > 5 * 1024 * 1024 ? 0.86 : 1;
  const score = Math.round(clamp(rawTotal * globalCriticalPenalty * globalSpeedPenalty, 0, 2500));

  return {
    score,
    tier: getVniTier(score),
    pillars: {
      wcagCompliance,
      aiContentIntegrity,
      performanceSpeed,
      colorBlindnessContrast,
      designQualityUx,
    },
    internal: {
      penalties: {
        wcagCriticalPenalty: Number(wcagCriticalPenalty.toFixed(3)),
        lcpPenalty: Number(lcpPenalty.toFixed(3)),
        payloadPenalty: Number(payloadPenalty.toFixed(3)),
        globalCriticalPenalty: Number(globalCriticalPenalty.toFixed(3)),
        globalSpeedPenalty,
      },
      colorMetrics: input.colorMetrics,
      designMetrics: input.designMetrics,
    },
  };
}
