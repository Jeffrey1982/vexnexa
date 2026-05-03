import { prisma } from "@/lib/prisma";

type AxeNode = {
  target?: string[];
  html?: string;
  impact?: string | null;
  failureSummary?: string;
  screenshotDataUrl?: string;
};

type AxeViolation = {
  id: string;
  impact?: string | null;
  help?: string;
  description?: string;
  helpUrl?: string;
  tags?: string[];
  pageUrl?: string;
  nodes?: AxeNode[];
  evidence?: {
    selector?: string;
    htmlSnippet?: string;
    failureSummary?: string;
    screenshotDataUrl?: string;
  };
};

const TERMINAL_STATUSES = new Set([
  "RESOLVED",
  "ACCEPTED_RISK",
  "FALSE_POSITIVE",
  "CLOSED",
]);

function priorityFromImpact(impact?: string | null) {
  switch (impact) {
    case "critical":
      return "CRITICAL";
    case "serious":
      return "HIGH";
    case "moderate":
      return "MEDIUM";
    default:
      return "LOW";
  }
}

function extractWcagCriteria(tags: string[] = []) {
  return tags
    .filter((tag) => /^wcag\d+/i.test(tag))
    .map((tag) => tag.toLowerCase())
    .filter((tag, index, all) => all.indexOf(tag) === index);
}

function groupViolations(violations: AxeViolation[]) {
  const grouped = new Map<string, AxeViolation>();

  for (const violation of violations) {
    if (!violation?.id) continue;

    const existing = grouped.get(violation.id);
    if (!existing) {
      grouped.set(violation.id, {
        ...violation,
        nodes: [...(violation.nodes ?? [])],
        tags: [...(violation.tags ?? [])],
      });
      continue;
    }

    existing.nodes = [...(existing.nodes ?? []), ...(violation.nodes ?? [])];
    existing.tags = Array.from(new Set([...(existing.tags ?? []), ...(violation.tags ?? [])]));
    existing.pageUrl ||= violation.pageUrl;
    existing.helpUrl ||= violation.helpUrl;
    existing.evidence ||= violation.evidence;
  }

  return [...grouped.values()];
}

function buildEvidence(violation: AxeViolation) {
  const firstNode = violation.nodes?.[0];
  const selector = violation.evidence?.selector || firstNode?.target?.join(", ") || null;
  const htmlSnippet = violation.evidence?.htmlSnippet || firstNode?.html || null;
  const failureSummary = violation.evidence?.failureSummary || firstNode?.failureSummary || null;
  const screenshotDataUrl = violation.evidence?.screenshotDataUrl || firstNode?.screenshotDataUrl || null;

  return {
    selector: selector ? selector.slice(0, 2000) : null,
    htmlSnippet: htmlSnippet ? htmlSnippet.slice(0, 4000) : null,
    failureSummary: failureSummary ? failureSummary.slice(0, 4000) : null,
    screenshotDataUrl,
  };
}

export async function syncScanIssuesFromViolations({
  scanId,
  createdById,
  fallbackPageUrl,
  violations,
}: {
  scanId: string;
  createdById: string;
  fallbackPageUrl: string;
  violations: AxeViolation[];
}) {
  const groupedViolations = groupViolations(violations);
  const existingIssues = await prisma.issue.findMany({
    where: { scanId },
    select: { id: true, violationId: true, status: true },
  });
  const existingByViolation = new Map(existingIssues.map((issue) => [issue.violationId, issue]));

  let created = 0;
  let updated = 0;

  for (const violation of groupedViolations) {
    const evidence = buildEvidence(violation);
    const wcagCriteria = extractWcagCriteria(violation.tags);
    const data = {
      title: (violation.help || violation.id).slice(0, 240),
      description: violation.description || null,
      priority: priorityFromImpact(violation.impact) as any,
      impact: violation.impact || null,
      wcagCriteria,
      helpUrl: violation.helpUrl || null,
      pageUrl: violation.pageUrl || fallbackPageUrl,
      selector: evidence.selector,
      htmlSnippet: evidence.htmlSnippet,
      failureSummary: evidence.failureSummary,
      screenshotDataUrl: evidence.screenshotDataUrl,
      estimatedHours: Math.max(1, Math.ceil((violation.nodes?.length || 1) / 4)),
    };

    const existing = existingByViolation.get(violation.id);

    if (existing) {
      await prisma.issue.update({
        where: { id: existing.id },
        data: TERMINAL_STATUSES.has(existing.status)
          ? {
              helpUrl: data.helpUrl,
              pageUrl: data.pageUrl,
              selector: data.selector,
              htmlSnippet: data.htmlSnippet,
              failureSummary: data.failureSummary,
              screenshotDataUrl: data.screenshotDataUrl,
            }
          : data,
      });
      updated += 1;
      continue;
    }

    const issue = await prisma.issue.create({
      data: {
        scanId,
        violationId: violation.id,
        createdById,
        ...data,
      },
      select: { id: true, priority: true },
    });

    await prisma.issueActivity.create({
      data: {
        issueId: issue.id,
        userId: createdById,
        action: "created_from_scan",
        newValue: `Created from scan evidence with priority ${issue.priority}`,
      },
    });
    created += 1;
  }

  return { created, updated, total: groupedViolations.length };
}
