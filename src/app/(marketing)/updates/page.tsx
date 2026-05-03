import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  GitBranch,
  Megaphone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdatesSignupForm } from "@/components/marketing/UpdatesSignupForm";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { StatusUpdate } from "@prisma/client";

export const metadata: Metadata = {
  title: "Status & Updates - VexNexa",
  description:
    "Follow VexNexa product updates, known issues, resolved fixes and reliability notes.",
  alternates: {
    canonical: "https://vexnexa.com/updates",
  },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

const components = [
  { name: "Public website", status: "Operational", tone: "ok" },
  { name: "Accessibility scanner", status: "Operational", tone: "ok" },
  { name: "Reports and exports", status: "Operational", tone: "ok" },
  { name: "Billing and checkout", status: "Operational", tone: "ok" },
  { name: "Email delivery", status: "Operational", tone: "ok" },
] as const;

const fallbackKnownIssues = [
  {
    title: "No active public issues",
    status: "Clear",
    severity: "Informational",
    date: "May 3, 2026",
    body: "There are currently no known user-facing issues that require a public workaround.",
  },
] as const;

const fallbackRecentFixes = [
  {
    title: "Service worker no longer handles external assets",
    date: "May 3, 2026",
    status: "Fixed",
    body: "The service worker now only caches VexNexa-owned requests and ignores third-party assets, preventing stale external-resource console noise.",
  },
  {
    title: "External badge removed from the footer",
    date: "May 2, 2026",
    status: "Fixed",
    body: "Removed a retired third-party badge from the public footer and cleaned up the copyright line.",
  },
  {
    title: "Issue lifecycle and evidence added to scan results",
    date: "May 2, 2026",
    status: "Released",
    body: "Scan findings can now carry selectors, page evidence, screenshots and workflow states for remediation tracking.",
  },
] as const;

const fallbackProductUpdates = [
  {
    title: "Sample report expanded",
    body: "The public report preview now shows workflow context, evidence examples and remediation-oriented issue detail.",
    icon: Sparkles,
  },
  {
    title: "Methodology and compliance pages added",
    body: "VexNexa now explains scan coverage, evidence handling, automation boundaries and compliance positioning more clearly.",
    icon: ShieldCheck,
  },
  {
    title: "Public communication channel launched",
    body: "Known issues and notable fixes now have a single public home for customers and pilot partners.",
    icon: Megaphone,
  },
] as const;

const policyRules = [
  "We publish user-facing bugs that can affect scans, reports, login, billing or delivery.",
  "We do not publish exploit details, customer data, credentials or internal infrastructure details.",
  "For active incidents, updates include impact, status, workaround when available and the next expected update.",
  "Major incidents may receive a short post-incident note after resolution.",
] as const;

async function getPublishedUpdates(): Promise<StatusUpdate[]> {
  try {
    return await prisma.statusUpdate.findMany({
      where: {
        isPublished: true,
        archivedAt: null,
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 50,
    });
  } catch (error) {
    console.error("[updates] failed to load status updates:", error);
    return [];
  }
}

function formatPublicDate(value: Date | null) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function StatusDot({ tone }: { tone: "ok" | "warning" }) {
  return (
    <span
      className={cn(
        "h-2.5 w-2.5 rounded-full",
        tone === "ok" ? "bg-teal-600" : "bg-amber-500"
      )}
      aria-hidden="true"
    />
  );
}

export default async function UpdatesPage() {
  const publishedUpdates = await getPublishedUpdates();
  const activePublicIssues = publishedUpdates.filter(
    (update) =>
      (update.type === "KNOWN_ISSUE" || update.type === "INCIDENT") &&
      !["Resolved", "Clear"].includes(update.publicStatus)
  );
  const dynamicFixes = publishedUpdates.filter(
    (update) =>
      update.type === "FIX" ||
      (update.type !== "PRODUCT_UPDATE" && ["Resolved", "Clear"].includes(update.publicStatus))
  );
  const dynamicProductUpdates = publishedUpdates.filter((update) => update.type === "PRODUCT_UPDATE");

  const knownIssues =
    activePublicIssues.length > 0
      ? activePublicIssues.map((issue) => ({
          title: issue.title,
          status: issue.publicStatus,
          severity: issue.severity,
          date: formatPublicDate(issue.publishedAt ?? issue.updatedAt),
          body: issue.summary,
        }))
      : fallbackKnownIssues;

  const recentFixes =
    dynamicFixes.length > 0
      ? dynamicFixes.map((fix) => ({
          title: fix.title,
          status: fix.publicStatus === "Resolved" ? "Fixed" : fix.publicStatus,
          date: formatPublicDate(fix.publishedAt ?? fix.updatedAt),
          body: fix.summary,
        }))
      : fallbackRecentFixes;

  const productUpdates =
    dynamicProductUpdates.length > 0
      ? dynamicProductUpdates.map((update) => ({
          title: update.title,
          body: update.summary,
          icon: Megaphone,
        }))
      : fallbackProductUpdates;

  return (
    <main className="bg-background">
      <section className="border-b border-border/60 bg-[linear-gradient(180deg,hsl(var(--muted))_0%,hsl(var(--background))_100%)]">
        <div className="container mx-auto grid gap-10 px-4 py-14 lg:grid-cols-[1fr_380px] lg:py-20">
          <div className="max-w-4xl">
            <Badge variant="outline" className="bg-background/80">
              Status & Updates
            </Badge>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Product updates, known issues and resolved fixes
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              A public place for VexNexa reliability notes. If something affects customers, we acknowledge it, track it, and show when it has been resolved.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/contact?subject=issue-report">
                  Report an issue
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/methodology">Read our methodology</Link>
              </Button>
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold">Stay informed</h2>
                <p className="text-sm text-muted-foreground">Get public status and release notes.</p>
              </div>
            </div>
            <div className="mt-5">
              <UpdatesSignupForm />
            </div>
          </aside>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 md:grid-cols-5">
          {components.map((component) => (
            <div key={component.name} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <StatusDot tone={component.tone} />
                <span className="text-sm font-medium text-teal-700">{component.status}</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-card-foreground">{component.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto grid gap-8 px-4 pb-14 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section aria-labelledby="known-issues-heading">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 id="known-issues-heading" className="font-display text-2xl font-bold">
                  Known issues
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Curated public issues that may affect customers or pilot partners.
                </p>
              </div>
              <Badge variant="secondary">Current</Badge>
            </div>

            <div className="space-y-4">
              {knownIssues.map((issue) => (
                <Card key={issue.title} className="rounded-lg">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <CheckCircle2 className="h-5 w-5 text-teal-600" aria-hidden="true" />
                        {issue.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{issue.status}</Badge>
                        <Badge variant="secondary">{issue.severity}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">{issue.body}</p>
                    <p className="mt-4 text-xs text-muted-foreground">Last checked: {issue.date}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section aria-labelledby="recent-fixes-heading">
            <div className="mb-4">
              <h2 id="recent-fixes-heading" className="font-display text-2xl font-bold">
                Recent fixes
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Public notes for visible bugs and quality improvements after they are resolved.
              </p>
            </div>

            <div className="space-y-4">
              {recentFixes.map((fix) => (
                <Card key={fix.title} className="rounded-lg">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">{fix.date}</p>
                        <h3 className="mt-1 font-semibold text-card-foreground">{fix.title}</h3>
                      </div>
                      <Badge variant="outline">{fix.status}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{fix.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                What we publish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                {policyRules.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-teal-600" aria-hidden="true" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />
                Issue states
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {["Investigating", "Fix in progress", "Monitoring", "Resolved"].map((state) => (
                <div key={state} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span>{state}</span>
                  <GitBranch className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </section>

      <section className="border-y border-border/60 bg-muted/40">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold">Product updates</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Not every update is an incident. This section tracks product progress that matters for customers.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {productUpdates.map((update) => {
              const Icon = update.icon;
              return (
                <Card key={update.title} className="rounded-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      {update.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">{update.body}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
