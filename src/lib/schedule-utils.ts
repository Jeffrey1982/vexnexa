/**
 * Assurance Scheduling utilities.
 * Calculates nextRunAt based on frequency, days, time, and timezone.
 * Pure functions — no DB or side effects.
 */

export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ScheduleConfig {
  frequency: Frequency;
  daysOfWeek: number[]; // 0-6 (Sun-Sat), used for WEEKLY
  dayOfMonth: number | null; // 1-31, used for MONTHLY
  timeOfDay: string; // "HH:MM"
  timezone: string; // IANA timezone
  startsAt: Date;
  endsAt: Date | null;
}

/**
 * Parse HH:MM string into hours and minutes.
 */
export function parseTime(timeOfDay: string): { hours: number; minutes: number } {
  const [h, m] = timeOfDay.split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
}

/**
 * Get the current time in a specific timezone as a Date-like object.
 * Returns a Date in UTC that represents the wall-clock time in the given timezone.
 */
function getWallClockDate(date: Date, timezone: string): Date {
  const str = date.toLocaleString('en-US', { timeZone: timezone });
  return new Date(str);
}

/**
 * Build a Date for a given wall-clock time in a timezone.
 * We construct the target time in the timezone, then convert to UTC.
 */
function buildTargetDate(
  baseDate: Date,
  hours: number,
  minutes: number,
  timezone: string
): Date {
  // Get the offset between UTC and the timezone at the base date
  const utcStr = baseDate.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = baseDate.toLocaleString('en-US', { timeZone: timezone });
  const utcDate = new Date(utcStr);
  const tzDate = new Date(tzStr);
  const offsetMs = tzDate.getTime() - utcDate.getTime();

  // Build the target wall-clock time
  const target = new Date(baseDate);
  target.setUTCHours(hours, minutes, 0, 0);

  // Subtract the offset to convert from wall-clock to UTC
  return new Date(target.getTime() - offsetMs);
}

/**
 * Calculate the next run time from a given reference point (usually now).
 * Returns a UTC Date.
 */
export function calculateNextRunAt(
  config: ScheduleConfig,
  fromDate: Date = new Date()
): Date {
  const { frequency, daysOfWeek, dayOfMonth, timeOfDay, timezone, startsAt, endsAt } = config;
  const { hours, minutes } = parseTime(timeOfDay);

  // Get wall-clock "now" in the schedule's timezone
  const wallNow = getWallClockDate(fromDate, timezone);

  let nextRun: Date;

  if (frequency === 'DAILY') {
    // Next occurrence is today at timeOfDay, or tomorrow if already past
    const todayTarget = new Date(wallNow);
    todayTarget.setHours(hours, minutes, 0, 0);

    if (todayTarget.getTime() <= wallNow.getTime()) {
      todayTarget.setDate(todayTarget.getDate() + 1);
    }
    nextRun = buildTargetDate(fromDate, todayTarget.getHours(), todayTarget.getMinutes(), timezone);
    // Adjust the date
    const dayDiff = Math.ceil((todayTarget.getTime() - wallNow.getTime()) / (24 * 60 * 60 * 1000));
    if (dayDiff > 0) {
      nextRun = new Date(nextRun.getTime() + dayDiff * 24 * 60 * 60 * 1000);
    }
    // Simpler approach: just add days
    nextRun = buildDailyNext(fromDate, hours, minutes, timezone);
  } else if (frequency === 'WEEKLY') {
    nextRun = buildWeeklyNext(fromDate, daysOfWeek, hours, minutes, timezone);
  } else {
    // MONTHLY
    nextRun = buildMonthlyNext(fromDate, dayOfMonth || 1, hours, minutes, timezone);
  }

  // Ensure nextRun is not before startsAt
  if (nextRun.getTime() < startsAt.getTime()) {
    // Recalculate from startsAt
    return calculateNextRunAt(config, new Date(startsAt.getTime() - 1));
  }

  // If past endsAt, return endsAt (caller should disable)
  if (endsAt && nextRun.getTime() > endsAt.getTime()) {
    return endsAt;
  }

  return nextRun;
}

function buildDailyNext(fromDate: Date, hours: number, minutes: number, timezone: string): Date {
  const wallNow = getWallClockDate(fromDate, timezone);
  const todayTarget = new Date(wallNow);
  todayTarget.setHours(hours, minutes, 0, 0);

  if (todayTarget.getTime() <= wallNow.getTime()) {
    todayTarget.setDate(todayTarget.getDate() + 1);
  }

  return buildTargetDate(
    new Date(fromDate.getTime() + (todayTarget.getTime() - wallNow.getTime())),
    hours,
    minutes,
    timezone
  );
}

function buildWeeklyNext(
  fromDate: Date,
  daysOfWeek: number[],
  hours: number,
  minutes: number,
  timezone: string
): Date {
  if (daysOfWeek.length === 0) {
    // Default to Monday
    return buildWeeklyNext(fromDate, [1], hours, minutes, timezone);
  }

  const wallNow = getWallClockDate(fromDate, timezone);
  const currentDay = wallNow.getDay();
  const currentTime = wallNow.getHours() * 60 + wallNow.getMinutes();
  const targetTime = hours * 60 + minutes;

  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

  // Find next day that is either later today (if time hasn't passed) or a future day
  let bestDaysAhead = 8; // More than 7 means not found

  for (const day of sortedDays) {
    let daysAhead = (day - currentDay + 7) % 7;
    if (daysAhead === 0 && currentTime >= targetTime) {
      daysAhead = 7; // Same day but time passed, go to next week
    }
    if (daysAhead === 0 && currentTime < targetTime) {
      daysAhead = 0; // Today, time hasn't passed
    }
    if (daysAhead < bestDaysAhead) {
      bestDaysAhead = daysAhead;
    }
  }

  if (bestDaysAhead > 7) bestDaysAhead = 7;

  const targetDate = new Date(wallNow);
  targetDate.setDate(targetDate.getDate() + bestDaysAhead);
  targetDate.setHours(hours, minutes, 0, 0);

  return buildTargetDate(
    new Date(fromDate.getTime() + bestDaysAhead * 24 * 60 * 60 * 1000),
    hours,
    minutes,
    timezone
  );
}

function buildMonthlyNext(
  fromDate: Date,
  dayOfMonth: number,
  hours: number,
  minutes: number,
  timezone: string
): Date {
  const wallNow = getWallClockDate(fromDate, timezone);
  const currentTime = wallNow.getHours() * 60 + wallNow.getMinutes();
  const targetTime = hours * 60 + minutes;

  // Clamp dayOfMonth to valid range
  const clampedDay = Math.min(Math.max(dayOfMonth, 1), 28);

  let targetMonth = wallNow.getMonth();
  let targetYear = wallNow.getFullYear();

  if (
    wallNow.getDate() > clampedDay ||
    (wallNow.getDate() === clampedDay && currentTime >= targetTime)
  ) {
    // Move to next month
    targetMonth++;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear++;
    }
  }

  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const finalDay = Math.min(clampedDay, daysInTargetMonth);

  const targetDate = new Date(targetYear, targetMonth, finalDay, hours, minutes, 0, 0);
  const diffMs = targetDate.getTime() - wallNow.getTime();

  return buildTargetDate(
    new Date(fromDate.getTime() + diffMs),
    hours,
    minutes,
    timezone
  );
}

/**
 * Generate a windowKey for idempotency.
 * Format: "YYYY-MM-DDTHH:MM" in the schedule's timezone.
 */
export function generateWindowKey(runDate: Date, timezone: string): string {
  const wall = getWallClockDate(runDate, timezone);
  const y = wall.getFullYear();
  const m = String(wall.getMonth() + 1).padStart(2, '0');
  const d = String(wall.getDate()).padStart(2, '0');
  const h = String(wall.getHours()).padStart(2, '0');
  const min = String(wall.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

/**
 * Build the email subject line for a scheduled report.
 */
export function buildReportSubject(domain: string, date: Date): string {
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Accessibility Monitoring Report — ${domain} — ${dateStr}`;
}

/**
 * Build the email HTML body for a scheduled report.
 */
export function buildReportEmailHtml(params: {
  domain: string;
  score: number;
  previousScore?: number | null;
  reportDate: Date;
  manageUrl: string;
}): string {
  const { domain, score, previousScore, reportDate, manageUrl } = params;
  const dateStr = reportDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const changeHtml =
    previousScore != null
      ? `<p style="color:#4B5563;font-size:14px;margin:8px 0;">
           Previous score: <strong>${previousScore}/100</strong>
           (${score > previousScore ? '📈 +' : score < previousScore ? '📉 ' : ''}${score - previousScore} points)
         </p>`
      : '';

  const scoreColor = score >= 90 ? '#16a34a' : score >= 70 ? '#ca8a04' : '#dc2626';

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#D45A00;color:white;width:48px;height:48px;border-radius:10px;line-height:48px;font-size:20px;font-weight:bold;">V</div>
        <h1 style="color:#1F2937;font-size:22px;margin:12px 0 4px;">Accessibility Monitoring Report</h1>
        <p style="color:#6B7280;font-size:14px;margin:0;">${domain} — ${dateStr}</p>
      </div>

      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
        <p style="color:#6B7280;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Accessibility Score</p>
        <p style="font-size:48px;font-weight:bold;color:${scoreColor};margin:0;">${score}<span style="font-size:20px;color:#9CA3AF">/100</span></p>
        ${changeHtml}
      </div>

      <p style="color:#4B5563;font-size:14px;line-height:1.6;">
        Your scheduled accessibility scan for <strong>${domain}</strong> has completed.
        The full report is attached as a PDF.
      </p>

      <hr style="margin:24px 0;border:none;border-top:1px solid #E5E7EB;">

      <p style="color:#9CA3AF;font-size:12px;text-align:center;">
        <a href="${manageUrl}" style="color:#0F5C5C;text-decoration:none;">Manage schedule</a> ·
        <a href="${manageUrl}?unsubscribe=true" style="color:#9CA3AF;text-decoration:none;">Unsubscribe</a>
      </p>
      <p style="color:#9CA3AF;font-size:11px;text-align:center;margin-top:8px;">
        VexNexa · vexnexa.com · Privacy-first WCAG scanning
      </p>
    </div>
  `;
}

/**
 * Build plain text version of the report email.
 */
export function buildReportEmailText(params: {
  domain: string;
  score: number;
  previousScore?: number | null;
  reportDate: Date;
  manageUrl: string;
}): string {
  const { domain, score, previousScore, reportDate, manageUrl } = params;
  const dateStr = reportDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  let text = `Accessibility Monitoring Report\n${domain} — ${dateStr}\n\n`;
  text += `Score: ${score}/100\n`;
  if (previousScore != null) {
    const diff = score - previousScore;
    text += `Previous: ${previousScore}/100 (${diff >= 0 ? '+' : ''}${diff})\n`;
  }
  text += `\nThe full report is attached as a PDF.\n`;
  text += `\n---\nManage schedule: ${manageUrl}\n`;
  return text;
}
