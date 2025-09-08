import { ImpactLevel } from "./axe-types";

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatImpact(impact: ImpactLevel): string {
  return impact.charAt(0).toUpperCase() + impact.slice(1);
}

export function getFaviconFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch {
    return '/favicon.ico';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "emerald";
  if (score >= 50) return "amber";
  return "red";
}

export function getImpactColor(impact: ImpactLevel): {
  bg: string;
  text: string;
  border: string;
} {
  switch (impact) {
    case "critical":
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200",
      };
    case "serious":
      return {
        bg: "bg-orange-100",
        text: "text-orange-800",
        border: "border-orange-200",
      };
    case "moderate":
      return {
        bg: "bg-amber-100",
        text: "text-amber-800",
        border: "border-amber-200",
      };
    case "minor":
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
      };
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization for display purposes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

export function calculateDuration(startDate: Date | string, endDate?: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = endDate ? (typeof endDate === 'string' ? new Date(endDate) : endDate) : new Date();
  
  const diffMs = end.getTime() - start.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 60) {
    return `${diffSeconds}s`;
  }
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ${diffSeconds % 60}s`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h ${diffMinutes % 60}m`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}