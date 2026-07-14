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
        ? `${scanFact}. Begin met kritieke en ernstige bevindingen: die hebben meestal de grootste gebruikersimpact. Bekijk je volledige rapport: ${input.appUrl}/auth/register?utm_source=nurture&utm_campaign=scan_priority`
        : `${scanFact}. Start with critical and serious findings because they usually have the greatest user impact. View your full report: ${input.appUrl}/auth/register?utm_source=nurture&utm_campaign=scan_priority`,
    };
  }

  if (input.step === 2) {
    return {
      subject: nl ? "Van een losse scan naar aantoonbare voortgang" : "From a one-off scan to evidence of progress",
      body: nl
        ? `Een score is een momentopname. VexNexa bewaart bevindingen en trends zodat je na elke release kunt aantonen wat verbeterde of terugviel. Bekijk een voorbeeldrapport: ${input.appUrl}/sample-report?utm_source=nurture&utm_campaign=evidence`
        : `A score is a snapshot. VexNexa keeps findings and trends so you can show what improved or regressed after each release. View a sample report: ${input.appUrl}/sample-report?utm_source=nurture&utm_campaign=evidence`,
    };
  }

  return {
    subject: nl ? "Wil je dit automatisch voor klantsites laten draaien?" : "Want this to run automatically for client sites?",
    body: nl
      ? `Voor bureaus kan VexNexa scans, regressies en white-label rapportage doorlopend afhandelen. Bekijk het pilotprogramma: ${input.appUrl}/pilot-partner-program?utm_source=nurture&utm_campaign=pilot`
      : `For agencies, VexNexa can continuously handle scans, regressions, and white-label reporting. See the pilot program: ${input.appUrl}/pilot-partner-program?utm_source=nurture&utm_campaign=pilot`,
  };
}

