import Link from "@/components/marketing/MarketingLink";
import { ArrowRight, Check, FileText, ScanLine, Activity } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { FAQ } from "@/components/marketing/FAQ";
import { Hero } from "@/components/marketing/home/Hero";
import { FoundingProgramBanner } from "@/components/marketing/home/FoundingProgramBanner";
import { FounderNote } from "@/components/marketing/home/FounderNote";
import { RecoveryRedirect } from "@/components/marketing/home/RecoveryRedirect";
import { TrackedCTA } from "@/components/marketing/TrackedCTA";
import s from "@/components/marketing/home/home.module.css";

// Keep the marketing narrative on the server; only interactions need hydration.
export default async function HomePage() {
  const [t, faq] = await Promise.all([getTranslations("brandHome"), getTranslations("home.faqSection")]);
  const faqItems = [1, 2, 3, 4, 5, 6].map((n) => ({ question: faq(`q${n}.question`), answer: faq(`q${n}.answer`) }));
  const schema = {
    "@context": "https://schema.org", "@type": "SoftwareApplication", "@id": "https://vexnexa.com/#software",
    name: "VexNexa", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: "https://vexnexa.com",
    description: "WCAG monitoring, accessibility reports, and regression alerts for agencies and digital teams.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: "Free accessibility scan available" },
  };
  return (
    <div className={s.home}>
      <RecoveryRedirect />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <Hero />
      <div className={s.capabilities}><div className={s.wrap}>
        <p>{t("workspaceLabel")}</p>
        <ul><li><ScanLine aria-hidden="true" />WCAG 2.2</li><li><FileText aria-hidden="true" />PDF / DOCX</li><li><Check aria-hidden="true" />White-label</li><li><Activity aria-hidden="true" />{t("proofMonitor")}</li></ul>
      </div></div>

      <section className={`${s.wrap} ${s.workflow}`} aria-labelledby="workflow-heading">
        <div className={s.sectionIntro}><p className={s.eyebrow}>{t("workflowEyebrow")}</p><h2 id="workflow-heading">{t("workflowTitle")}</h2><p className={s.body}>{t("workflowIntro")}</p></div>
        <ol className={s.steps}>{[1, 2, 3].map((n) => <li key={n}><span className={s.stepNumber}>0{n}</span><div><h3>{t(`step${n}Title`)}</h3><p>{t(`step${n}Body`)}</p></div></li>)}</ol>
      </section>

      <section className={s.reportSection} aria-labelledby="report-heading">
        <div className={`${s.wrap} ${s.reportGrid}`}>
          <div className={s.reportArtwork}>
            <div className={s.reportBacksheet} aria-hidden="true" />
            <article className={s.paperReport} aria-label={t("reportSample")}>
              <header><span className={s.agencyMark} aria-hidden="true">a.</span><span>{t("proofReport")}</span><span className={s.paperFormat}>PDF / DOCX</span></header>
              <p className={s.paperKicker}>{t("reportLabel")} / 01</p><h3>{t("evidenceLabel")}</h3><p className={s.reportDomain}>example-client.com</p>
              <div className={s.paperRule} />
              <div className={s.findingMeta}><span>WCAG 4.1.2</span><span>{t("issueLabel")} 01</span></div>
              <h4>{t("findingTitle")}</h4><p>{t("findingBody")}</p>
              <div className={s.codeSample}><span aria-hidden="true">↳</span> &lt;button aria-label=&quot;Search&quot;&gt;</div>
              <h5>{t("recommendationLabel")}</h5><p>{t("recommendation")}</p>
              <footer><span>{t("reportSample")}</span><span>01 / 08</span></footer>
            </article>
          </div>
          <div className={s.reportText}><p className={s.eyebrow}>{t("reportEyebrow")}</p><h2 id="report-heading">{t("reportTitle")}</h2><p className={s.body}>{t("reportBody")}</p><Link className={s.textLink} href="/sample-report">{t("reportLink")}<ArrowRight aria-hidden="true" /></Link><p className={s.scopeNote}>{t("scopeNote")}</p></div>
        </div>
      </section>

      <section className={`${s.wrap} ${s.monitoring}`} aria-labelledby="monitoring-heading">
        <div><p className={s.eyebrow}>{t("monitoringEyebrow")}</p><h2 id="monitoring-heading">{t("monitoringTitle")}</h2><p className={s.body}>{t("monitoringBody")}</p><Link className={s.textLink} href="/accessibility-regression-testing">{t("monitoringLink")}<ArrowRight aria-hidden="true" /></Link></div>
        <figure className={s.trend}>
          <div className={s.trendHeader}><span>{t("proofMonitor")}</span><span className={s.sampleChip}>{t("reportSample")}</span></div>
          <svg viewBox="0 0 520 220" role="img" aria-label={t("chartLabel")}><g className={s.chartGrid}><path d="M20 40H500M20 100H500M20 160H500M20 210H500" /></g><path d="M22 168L100 144L180 151L260 92L340 104L420 58L498 31" className={s.trendLine} /><g className={s.chartPoints}><circle cx="22" cy="168" r="5" /><circle cx="260" cy="92" r="5" /><circle cx="498" cy="31" r="7" /></g></svg>
          <div className={s.trendLabels}><span>{t("statusBefore")}</span><span>{t("statusAfter")}</span></div><figcaption>{t("chartLabel")}</figcaption>
        </figure>
      </section>
      <div className={s.offer}><FoundingProgramBanner /></div>
      <div className={s.faq}><FAQ items={faqItems} /></div>
      <div className={s.founder}><FounderNote /></div>
      <section className={s.finalCta} aria-labelledby="final-heading"><div className={s.wrap}>
        <p className={s.eyebrow}>{t("finalEyebrow")}</p><div className={s.finalGrid}>
          <div><h2 id="final-heading">{t("finalTitle")}</h2><p>{t("finalBody")}</p></div>
          <div className={s.finalActions}><TrackedCTA href="/free-scan" event="homepage_cta_primary_click" eventProps={{ location: "final" }} className={s.primaryButton} size="lg">{t("finalPrimary")}<ArrowRight aria-hidden="true" /></TrackedCTA><Link className={s.textLink} href="/pricing">{t("finalSecondary")}<ArrowRight aria-hidden="true" /></Link></div>
        </div>
      </div></section>
    </div>
  );
}
