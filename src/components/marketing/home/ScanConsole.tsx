"use client";

import Link from "@/components/marketing/MarketingLink";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, FileCheck2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import s from "./home.module.css";

export type Severity = "critical" | "serious" | "moderate" | "minor";
export type Finding = { name: string; impact: Severity; ref?: string };
export type ConsoleState =
  | { phase: "scanning"; url: string }
  | { phase: "result"; url: string; isDemo: boolean; score: number; counts: Record<Severity, number>; total: number; findings: Finding[] }
  | { phase: "error"; url: string; kind: "rate" | "generic"; retryHref: string };
const severities: Severity[] = ["critical", "serious", "moderate", "minor"];

export function ScanConsole({ state }: { state: ConsoleState }) {
  const t = useTranslations("hero");
  const b = useTranslations("brandHome");
  const result = state.phase === "result" ? state : null;
  const scanning = state.phase === "scanning";
  const host = state.url.replace(/^https?:\/\//, "");
  const severityLabel = (severity: Severity) => t(`severity${severity.charAt(0).toUpperCase()}${severity.slice(1)}` as "severityCritical");

  return (
    <figure className={s.console} aria-busy={scanning}>
      <figcaption className={s.consoleBar}><span><FileCheck2 aria-hidden="true" />{b("reportLabel")}</span><span className={s.consoleTag}>{result?.isDemo ? b("demoLabel") : scanning ? t("console.scanningTag") : state.phase === "error" ? "WCAG 2.2" : b("resultReady")}</span></figcaption>
      <div className={s.consoleBody}>
        <div className={s.consoleTitle}><p>WCAG 2.2 AA</p><h2>{host}</h2></div>
        <div role="status" aria-live="polite" aria-atomic="true" className={s.resultStatus}>
          {scanning ? <><Loader2 className="animate-spin" aria-hidden="true" />{t("console.progress1")}</> : result ? <><span className={s.statusDot} data-clear={result.total === 0} aria-hidden="true" />{result.total === 0 ? b("noIssues") : t("console.issuesShort", { count: result.total })}<span className={s.score}>{result.score}<small>/ 100</small></span></> : null}
        </div>
        {state.phase === "error" ? <div className={s.scanError} role="alert"><p>{state.kind === "rate" ? t("console.errorRateLimit") : t("console.errorGeneric")}</p><Link className={s.consoleLink} href={state.kind === "rate" ? "/auth/register" : state.retryHref}>{state.kind === "rate" ? t("console.createAccount") : t("console.retry")}<ArrowRight aria-hidden="true" /></Link></div> : <>
          <dl className={s.severityList}>{severities.map((severity) => <div key={severity} data-severity={severity}><dt>{severityLabel(severity)}</dt><dd>{result ? result.counts[severity] : "·"}</dd></div>)}</dl>
          <div className={s.findingsHeading}><span>{t("console.topFindings")}</span><span>WCAG</span></div>
          <ul className={s.findings}>
            {(result?.findings ?? []).map((finding, i) => <li key={`${finding.name}-${i}`}>
              {result?.isDemo && i === 0 ? <details className={s.findingDetails}><summary><span className={s.findingNumber}>01</span><span>{finding.name}<small>{finding.ref}</small></span><ChevronDown aria-hidden="true" /></summary><div className={s.findingExpanded}><p>{b("findingBody")}</p><code>&lt;button aria-label=&quot;Search&quot;&gt;</code><p>{b("recommendation")}</p></div></details> : <div className={s.findingRow}><span className={s.findingNumber}>{String(i + 1).padStart(2, "0")}</span><span>{finding.name}<small>{finding.ref ?? severityLabel(finding.impact)}</small></span><ArrowUpRight aria-hidden="true" /></div>}
            </li>)}
            {scanning && [1, 2, 3].map((n) => <li className={s.scanPlaceholder} key={n} aria-hidden="true"><span /><span /></li>)}
          </ul>
          {result && !result.isDemo && <Link className={s.consoleLink} href="/auth/register">{t("console.fullReport")}<ArrowRight aria-hidden="true" /></Link>}
        </>}
      </div>
      <div className={s.consoleFooter}><span><Check aria-hidden="true" />axe-core</span><span>WCAG 2.2 AA</span><span>PDF / DOCX</span></div>
    </figure>
  );
}
