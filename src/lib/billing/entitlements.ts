import { ENTITLEMENTS } from "./plans"
import { prisma } from "../prisma"
import { calculateExtraScans, calculateExtraSeats } from "./addons"

export function getEntitlements<P extends keyof typeof ENTITLEMENTS>(plan: P): (typeof ENTITLEMENTS)[P] {
  return ENTITLEMENTS[plan]
}

// Get total entitlements including add-ons
export async function getTotalEntitlements(userId: string): Promise<Record<string, any>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addOns: {
        where: { status: "active" }
      }
    }
  })

  if (!user) throw new Error("User not found")

  const plan = user.plan as keyof typeof ENTITLEMENTS
  const baseEntitlements = ENTITLEMENTS[plan]

  // Calculate add-ons
  const extraScans = calculateExtraScans(user.addOns)
  const extraSeats = calculateExtraSeats(user.addOns)

  return {
    ...baseEntitlements,
    pagesPerMonth: baseEntitlements.pagesPerMonth + extraScans,
    users: baseEntitlements.users + extraSeats,
    // Track what came from where for transparency
    base: {
      pagesPerMonth: baseEntitlements.pagesPerMonth,
      users: baseEntitlements.users,
    },
    addOns: {
      pagesPerMonth: extraScans,
      users: extraSeats,
    }
  }
}

function getIsoWeekPeriod(now: Date): string {
  const date: Date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day: number = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart: Date = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo: number = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  const year: number = date.getUTCFullYear()
  return `WEEK-${year}-${String(weekNo).padStart(2, '0')}`
}

export async function hasWeeklyFreeScanAvailable(userId: string, now?: Date): Promise<boolean> {
  const current: Date = now ?? new Date()
  const period: string = getIsoWeekPeriod(current)
  const usage = await prisma.usage.findUnique({
    where: { userId_period: { userId, period } }
  })
  const used: number = usage?.pages ?? 0
  return used < 1
}

export async function consumeWeeklyFreeScan(userId: string, now?: Date): Promise<void> {
  const current: Date = now ?? new Date()
  const period: string = getIsoWeekPeriod(current)

  await prisma.usage.upsert({
    where: { userId_period: { userId, period } },
    update: { pages: { increment: 1 } },
    create: { userId, period, pages: 1, sites: 0 },
  })
}

export async function assertWithinLimits(opts: {
  userId: string
  action: "scan" | "bulk_scan" | "export_pdf" | "export_word" | "schedule" | "crawl" | "white_label"
  pages?: number
  now?: Date
}): Promise<void> {
  const now = opts.now ?? new Date()
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`

  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    include: {
      addOns: {
        where: { status: "active" }
      }
    }
  })
  if (!user) throw new Error("User not found")

  const plan = user.plan as keyof typeof ENTITLEMENTS
  const baseEnt = ENTITLEMENTS[plan]

  // Calculate total entitlements including add-ons
  const extraScans = calculateExtraScans(user.addOns)
  const totalPagesPerMonth = baseEnt.pagesPerMonth + extraScans
  const ent = { ...baseEnt, pagesPerMonth: totalPagesPerMonth }

  // Feature gates
  if (opts.action === "export_word" && !ent.word) {
    const e: any = new Error("Upgrade required: Word export is niet beschikbaar op jouw plan.")
    e.code = "UPGRADE_REQUIRED"; e.feature = "word"
    throw e
  }
  if (opts.action === "schedule" && !ent.schedule) {
    const e: any = new Error("Upgrade required: Schedulen is niet beschikbaar op jouw plan.")
    e.code = "UPGRADE_REQUIRED"; e.feature = "schedule"
    throw e
  }
  if (opts.action === "crawl" && !ent.crawl) {
    const e: any = new Error("Upgrade required: Site crawling is alleen beschikbaar voor betaalde plannen.")
    e.code = "UPGRADE_REQUIRED"; e.feature = "crawl"
    throw e
  }
  if (opts.action === "bulk_scan" && !ent.crawl) {
    const e: any = new Error("Upgrade required: Bulk scanning is alleen beschikbaar voor betaalde plannen.")
    e.code = "UPGRADE_REQUIRED"; e.feature = "bulk_scan"
    throw e
  }
  if (opts.action === "white_label" && !ent.whiteLabel) {
    const e: any = new Error("Upgrade required: White labeling is alleen beschikbaar voor Business plannen.")
    e.code = "UPGRADE_REQUIRED"; e.feature = "whiteLabel"
    throw e
  }

  // Usage limits
  if (["scan","bulk_scan","export_pdf","export_word","crawl"].includes(opts.action)) {
    let usage = await prisma.usage.findUnique({
      where: { userId_period: { userId: user.id, period } }
    })
    if (!usage) {
      usage = await prisma.usage.create({
        data: { userId: user.id, period }
      })
    }

    if (usage.pages >= ent.pagesPerMonth) {
      // Different messages for TRIAL vs paid plans
      const isTrial = plan === "TRIAL";
      const message = isTrial
        ? `Free trial limit bereikt (${ent.pagesPerMonth} pages/maand). Upgrade naar een betaald plan om door te gaan met scannen.`
        : `Maandelijkse paginalimiet bereikt (${ent.pagesPerMonth} pages/maand). Upgrade naar een hoger plan, koop extra scans, of wacht tot volgende maand.`;

      const e: any = new Error(message)
      e.code = isTrial ? "TRIAL_LIMIT_REACHED" : "LIMIT_REACHED";
      e.limit = ent.pagesPerMonth
      e.current = usage.pages
      e.requiresUpgrade = isTrial
      throw e
    }
  }

  // Check trial expiration
  if (user.plan === "TRIAL" && user.trialEndsAt && user.trialEndsAt < now) {
    const e: any = new Error("Trial afgelopen. Upgrade om door te gaan.")
    e.code = "TRIAL_EXPIRED"
    throw e
  }
}

export async function addPageUsage(userId: string, pages: number): Promise<void> {
  const now: Date = new Date()
  const period: string = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`

  await prisma.usage.upsert({
    where: { userId_period: { userId, period } },
    update: { pages: { increment: pages } },
    create: { userId, period, pages }
  })
}

export async function addSiteUsage(userId: string): Promise<void> {
  const now: Date = new Date()
  const period: string = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`

  await prisma.usage.upsert({
    where: { userId_period: { userId, period } },
    update: { sites: { increment: 1 } },
    create: { userId, period, sites: 1, pages: 0 }
  })
}

export async function getCurrentUsage(userId: string): Promise<{ pages: number; sites: number; period: string }> {
  const now: Date = new Date()
  const period: string = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`

  const usage = await prisma.usage.findUnique({
    where: { userId_period: { userId, period } }
  })

  return {
    pages: usage?.pages || 0,
    sites: usage?.sites || 0,
    period
  }
}