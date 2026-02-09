export const PRICES = {
  STARTER:    { amount: "24.99",  currency: "EUR", interval: "1 month" },
  PRO:        { amount: "59.99",  currency: "EUR", interval: "1 month" },
  BUSINESS:   { amount: "129.00", currency: "EUR", interval: "1 month" },
  ENTERPRISE: { amount: "299.00", currency: "EUR", interval: "1 month" },
} as const

// Overflow pricing - charges when plan limits are exceeded
export const OVERFLOW_PRICING = {
  extraPage: { amount: 0.002, currency: "EUR", unit: "page/month", description: "Extra pages above plan" },
  extraSite: { amount: 2.00, currency: "EUR", unit: "site/month", description: "Extra websites above plan" },
  extraUser: { amount: 1.00, currency: "EUR", unit: "user/month", description: "Extra users above plan" },
} as const

export type Entitlements = {
  sites: number; 
  pagesPerMonth: number; 
  users: number;
  pdf: boolean; 
  word: boolean; 
  schedule: boolean;
  crawl: boolean;
  integrations: string[]; 
  whiteLabel?: boolean;
  historyMonths: number;
  prioritySupport?: boolean;
  sla?: boolean;
  accountManager?: boolean;
}

export const ENTITLEMENTS: Record<"TRIAL"|"STARTER"|"PRO"|"BUSINESS"|"ENTERPRISE", Entitlements> = {
  TRIAL:      { sites: 1,  pagesPerMonth: 100,    users: 1,  pdf: true,  word: false, schedule: false, crawl: false, integrations: [],                          historyMonths: 1 },
  STARTER:    { sites: 1,  pagesPerMonth: 500,    users: 1,  pdf: true,  word: false, schedule: false, crawl: true,  integrations: [],                          historyMonths: 6 },
  PRO:        { sites: 3,  pagesPerMonth: 5000,   users: 5,  pdf: true,  word: true,  schedule: true,  crawl: true,  integrations: ["slack","jira"],             historyMonths: 12, prioritySupport: true },
  BUSINESS:   { sites: 10, pagesPerMonth: 25000,  users: 15, pdf: true,  word: true,  schedule: true,  crawl: true,  integrations: ["slack","jira","teams"],     historyMonths: 24, whiteLabel: true, prioritySupport: true },
  ENTERPRISE: { sites: 25, pagesPerMonth: 100000, users: 999,pdf: true,  word: true,  schedule: true,  crawl: true,  integrations: ["slack","jira","teams","api"],historyMonths: 36, whiteLabel: true, prioritySupport: true, sla: true, accountManager: true },
}

export function planKeyFromString(p: string) {
  return (["TRIAL","STARTER","PRO","BUSINESS","ENTERPRISE"] as const).includes(p as any) ? p as any : "TRIAL"
}

export function formatPrice(plan: keyof typeof PRICES) {
  const price = PRICES[plan]
  return `€${price.amount}/${price.interval.split(' ')[1]}`
}

export const PLAN_NAMES = {
  TRIAL: 'Trial',
  STARTER: 'Starter',
  PRO: 'Pro', 
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
} as const