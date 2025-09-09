export const PRICES = {
  STARTER: { amount: "19.00", currency: "EUR", interval: "1 month" },
  PRO:     { amount: "49.00", currency: "EUR", interval: "1 month" },
  BUSINESS:{ amount: "149.00",currency: "EUR", interval: "1 month" },
} as const

export type Entitlements = {
  sites: number; 
  pagesPerMonth: number; 
  users: number;
  pdf: boolean; 
  word: boolean; 
  schedule: boolean;
  integrations: string[]; 
  whiteLabel?: boolean;
}

export const ENTITLEMENTS: Record<"TRIAL"|"STARTER"|"PRO"|"BUSINESS", Entitlements> = {
  TRIAL:     { sites: 1,  pagesPerMonth: 100,   users: 1,  pdf: true,  word: false, schedule: false, integrations: [] },
  STARTER:   { sites: 1,  pagesPerMonth: 500,   users: 1,  pdf: true,  word: false, schedule: false, integrations: [] },
  PRO:       { sites: 5,  pagesPerMonth: 2000,  users: 5,  pdf: true,  word: true,  schedule: true,  integrations: ["slack","jira"] },
  BUSINESS:  { sites: 20, pagesPerMonth: 10000, users: 20, pdf: true,  word: true,  schedule: true,  integrations: ["slack","jira","teams"], whiteLabel: true },
}

export function planKeyFromString(p: string) {
  return (["TRIAL","STARTER","PRO","BUSINESS"] as const).includes(p as any) ? p as any : "TRIAL"
}

export function formatPrice(plan: keyof typeof PRICES) {
  const price = PRICES[plan]
  return `€${price.amount}/${price.interval.split(' ')[1]}`
}

export const PLAN_NAMES = {
  TRIAL: 'Trial',
  STARTER: 'Starter',
  PRO: 'Pro', 
  BUSINESS: 'Business'
} as const