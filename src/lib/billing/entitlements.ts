import { ENTITLEMENTS } from "./plans"
import { prisma } from "../prisma"

export function getEntitlements(plan: keyof typeof ENTITLEMENTS) {
  return ENTITLEMENTS[plan]
}

export async function assertWithinLimits(opts: {
  userId: string
  action: "scan" | "bulk_scan" | "export_pdf" | "export_word" | "schedule" | "crawl" | "white_label"
  pages?: number
  now?: Date
}) {
  const now = opts.now ?? new Date()
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`

  const user = await prisma.user.findUnique({ where: { id: opts.userId } })
  if (!user) throw new Error("User not found")

  const plan = user.plan as keyof typeof ENTITLEMENTS
  const ent = ENTITLEMENTS[plan]

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
        : `Maandelijkse paginalimiet bereikt voor jouw ${plan.toLowerCase()} plan (${ent.pagesPerMonth} pages/maand). Upgrade naar een hoger plan of wacht tot volgende maand.`;

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

export async function addPageUsage(userId: string, pages: number) {
  const now = new Date()
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`

  await prisma.usage.upsert({
    where: { userId_period: { userId, period } },
    update: { pages: { increment: pages } },
    create: { userId, period, pages }
  })
}

export async function addSiteUsage(userId: string) {
  const now = new Date()
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`

  await prisma.usage.upsert({
    where: { userId_period: { userId, period } },
    update: { sites: { increment: 1 } },
    create: { userId, period, sites: 1, pages: 0 }
  })
}

export async function getCurrentUsage(userId: string) {
  const now = new Date()
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`

  const usage = await prisma.usage.findUnique({
    where: { userId_period: { userId, period } }
  })

  return {
    pages: usage?.pages || 0,
    sites: usage?.sites || 0,
    period
  }
}