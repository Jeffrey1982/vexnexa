import { ENTITLEMENTS } from "./plans"
import { prisma } from "../prisma"

export function getEntitlements(plan: keyof typeof ENTITLEMENTS) {
  return ENTITLEMENTS[plan]
}

export async function assertWithinLimits(opts: {
  userId: string
  action: "scan" | "export_pdf" | "export_word" | "schedule"
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

  // Usage limits
  if (["scan","export_pdf","export_word"].includes(opts.action)) {
    let usage = await prisma.usage.findUnique({ 
      where: { userId_period: { userId: user.id, period } } 
    })
    if (!usage) {
      usage = await prisma.usage.create({ 
        data: { userId: user.id, period } 
      })
    }
    
    if (usage.pages >= ent.pagesPerMonth) {
      const e: any = new Error(`Maandelijkse paginalimiet bereikt voor jouw ${plan.toLowerCase()} plan.`)
      e.code = "LIMIT_REACHED"; 
      e.limit = ent.pagesPerMonth
      e.current = usage.pages
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