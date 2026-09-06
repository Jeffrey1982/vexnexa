export const NURTURE_DELAYS_DAYS = [0, 3, 8] as const;

export type NurtureStep = 1 | 2 | 3;

export function selectDueNurtureStep(input: {
  consentedAt: Date | string;
  sentSteps: number[];
  now?: Date;
}): NurtureStep | null {
  const now = input.now ?? new Date();
  const consentedAt = new Date(input.consentedAt);
  if (Number.isNaN(consentedAt.getTime()) || consentedAt > now) return null;

  for (let index = 0; index < NURTURE_DELAYS_DAYS.length; index += 1) {
    const step = (index + 1) as NurtureStep;
    if (input.sentSteps.includes(step)) continue;
    const dueAt = consentedAt.getTime() + NURTURE_DELAYS_DAYS[index] * 86_400_000;
    return dueAt <= now.getTime() ? step : null;
  }
  return null;
}

export function buildNurtureMessage(input: {
  step: NurtureStep;
  locale: string;
  domain: string;
  score: number | null;
  totalIssues: number | null;
  appUrl: string;
}) {
  const nl = input.locale === "nl";
  const scanFact =
    input.score == null || input.totalIssues == null
      ? input.domain
      : nl
        ? `${input.domain} scoorde ${input.score}/100 met ${input.totalIssues} gevonden problemen`
        : `${input.domain} scored ${input.score}/100 with ${input.totalIssues} detected issues`;

  if (input.step === 1) {
    return {
      subject: nl ? `Je scan van ${input.domain}: de eerste prioriteit` : `Your ${input.domain} scan: the first priority`,
      body: nl
        ? `${scanFact}. Begin met kritieke en ernstige bevindingen: die hebben meestal de grootste gebruikersimpact. Dit zijn geautomatiseerde bevindingen, geen volledige audit. Bekijk je volledige rapport: ${input.appUrl}/auth/register?utm_source=nurture&utm_campaign=scan_priority`
        : `${scanFact}. Start with critical and serious findings because they usually have the greatest user impact. These are automated findings, not a complete audit. View your full report: ${input.appUrl}/auth/register?utm_source=nurture&utm_campaign=scan_priority`,
    };
  }

  if (input.step === 2) {
    return {
      subject: nl ? "Van een losse scan naar aantoonbare voortgang" : "From a one-off scan to evidence of progress",
      body: nl
        ? `Een score is een momentopname. Vergelijk resultaten van opeenvolgende geautomatiseerde scans om gevonden verbeteringen en terugkerende problemen te volgen. Bekijk een voorbeeldrapport: ${input.appUrl}/sample-report?utm_source=nurture&utm_campaign=evidence`
        : `A score is a snapshot. Compare results from successive automated scans to track detected improvements and recurring issues. View a sample report: ${input.appUrl}/sample-report?utm_source=nurture&utm_campaign=evidence`,
    };
  }

  return {
    subject: nl ? "Toegankelijkheidsrapporten onder je eigen bureaumerk" : "Accessibility reports under your agency's brand",
    body: nl
      ? `Met het betaalde Agency-plan gebruik je geautomatiseerde toegankelijkheidscontroles en white-label rapportage voor klantsites. Geautomatiseerde controles vinden niet alles en garanderen geen volledige toegankelijkheid of wettelijke naleving; menselijke beoordeling en herstel blijven nodig. Bekijk de mogelijkheden voor bureaus: ${input.appUrl}/for-agencies?utm_source=nurture&utm_campaign=agency`
      : `The paid Agency plan offers automated accessibility checks and white-label reporting for client sites. Automated checks do not find every issue or guarantee full accessibility or legal compliance; human review and remediation remain necessary. Explore the agency offering: ${input.appUrl}/for-agencies?utm_source=nurture&utm_campaign=agency`,
  };
}

