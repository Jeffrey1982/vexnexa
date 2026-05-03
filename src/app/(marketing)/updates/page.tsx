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
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdatesSignupForm } from "@/components/marketing/UpdatesSignupForm";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { StatusUpdate } from "@prisma/client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("updates.metadata");
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "https://vexnexa.com/updates",
    },
    robots: { index: true, follow: true },
  };
}

export const dynamic = "force-dynamic";

/**
 * The icon assigned to each fallback product update — mirrors the original
 * design but lookup keys are stable so translations can drive the copy.
 */
const FALLBACK_PRODUCT_ICONS = [Sparkles, ShieldCheck, Megaphone] as const;

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

function formatPublicDate(value: Date | null, locale: string, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

/**
 * Map a DB status string (`Resolved`, `Fixed`, `Investigating`, …) to a
 * translated label. Falls back to the raw value if a translation is missing,
 * so a newly added admin status never breaks the page.
 */
function makeStatusTranslator(t: Awaited<ReturnType<typeof getTranslations>>) {
  return (raw: string | null | undefined): string => {
    if (!raw) return "";
    try {
      const translated = t(`statusLabels.${raw}` as never);
      if (typeof translated === "string" && translated.length > 0) {
        return translated;
      }
    } catch {
      // next-intl throws on unknown keys; fall through to the raw value.
    }
    return raw;
  };
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
  const t = await getTranslations("updates");
  const locale = await getLocale();
  const translateStatus = makeStatusTranslator(t);

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

  // Status component grid — the names are translated, the tone stays "ok"
  // until a real incident arrives (would be flipped server-side).
  const components = [
    { key: "publicWebsite", tone: "ok" as const },
    { key: "accessibilityScanner", tone: "ok" as const },
    { key: "reportsAndExports", tone: "ok" as const },
    { key: "billingAndCheckout", tone: "ok" as const },
    { key: "emailDelivery", tone: "ok" as const },
  ];

  const fallbackDate = t("dateRecently");

  // Known issues — dynamic from DB, with a translated fallback when empty.
  const knownIssues =
    activePublicIssues.length > 0
      ? activePublicIssues.map((issue) => ({
          title: issue.title,
          status: translateStatus(issue.publicStatus),
          severity: translateStatus(issue.severity) || issue.severity,
          date: formatPublicDate(issue.publishedAt ?? issue.updatedAt, locale, fallbackDate),
          body: issue.summary,
        }))
      : [
          {
            title: t("knownIssues.fallbackTitle"),
            status: t("knownIssues.fallbackStatus"),
            severity: t("knownIssues.fallbackSeverity"),
            date: fallbackDate,
            body: t("knownIssues.fallbackBody"),
          },
        ];

  // Recent fixes — dynamic when present, otherwise translated example items.
  const recentFixes =
    dynamicFixes.length > 0
      ? dynamicFixes.map((fix) => ({
          title: fix.title,
          status:
            fix.publicStatus === "Resolved"
              ? translateStatus("Fixed")
              : translateStatus(fix.publicStatus),
          date: formatPublicDate(fix.publishedAt ?? fix.updatedAt, locale, fallbackDate),
          body: fix.summary,
        }))
      : [0, 1, 2].map((i) => ({
          title: t(`recentFixes.items.${i}.title`),
          status: t(`recentFixes.items.${i}.status`),
          date: fallbackDate,
          body: t(`recentFixes.items.${i}.body`),
        }));

  // Product updates — same pattern: dynamic or translated fallback.
  const productUpdates =
    dynamicProductUpdates.length > 0
      ? dynamicProductUpdates.map((update, idx) => ({
          title: update.title,
          body: update.summary,
          icon: FALLBACK_PRODUCT_ICONS[idx % FALLBACK_PRODUCT_ICONS.length],
        }))
      : [0, 1, 2].map((i) => ({
          title: t(`productUpdates.items.${i}.title`),
          body: t(`productUpdates.items.${i}.body`),
          icon: FALLBACK_PRODUCT_ICONS[i],
        }));

  const policyRules = [0, 1, 2, 3].map((i) => t(`policy.rules.${i}`));
  const issueStateLabels = [
    t("issueStates.investigating"),
    t("issueStates.fixInProgress"),
    t("issueStates.monitoring"),
    t("issueStates.resolved"),
  ];

  return (
    <main className="bg-background">
      <section className="border-b border-border/60 bg-[linear-gradient(180deg,hsl(var(--muted))_0%,hsl(var(--background))_100%)]">
        <div className="container mx-auto grid gap-10 px-4 py-14 lg:grid-cols-[1fr_380px] lg:py-20">
          <div className="max-w-4xl">
            <Badge variant="outline" className="bg-background/80">
              {t("hero.badge")}
            </Badge>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {t("hero.subtitle")}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/contact?subject=issue-report">
                  {t("hero.reportIssueCta")}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/methodology">{t("hero.methodologyCta")}</Link>
              </Button>
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold">{t("aside.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("aside.subtitle")}</p>
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
          {components.map((component) => {
            const name = t(`components.${component.key}` as never);
            return (
              <div key={component.key} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <StatusDot tone={component.tone} />
                  <span className="text-sm font-medium text-teal-700">
                    {t("components.operational")}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-card-foreground">{name}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto grid gap-8 px-4 pb-14 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section aria-labelledby="known-issues-heading">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 id="known-issues-heading" className="font-display text-2xl font-bold">
                  {t("knownIssues.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("knownIssues.subtitle")}
                </p>
              </div>
              <Badge variant="secondary">{t("knownIssues.currentBadge")}</Badge>
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
                    <p className="mt-4 text-xs text-muted-foreground">
                      {t("knownIssues.lastChecked")}: {issue.date}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section aria-labelledby="recent-fixes-heading">
            <div className="mb-4">
              <h2 id="recent-fixes-heading" className="font-display text-2xl font-bold">
                {t("recentFixes.title")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("recentFixes.subtitle")}
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
                {t("policy.title")}
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
                {t("issueStates.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {issueStateLabels.map((state) => (
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
            <h2 className="font-display text-2xl font-bold">{t("productUpdates.title")}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("productUpdates.subtitle")}
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
