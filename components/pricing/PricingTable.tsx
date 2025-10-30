"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface PricingPlan {
  name: string
  description: string
  price: {
    monthly: string
    quarterly: string
  }
  features: string[]
  cta: string
  ctaLink: string
  popular?: boolean
  limits?: string
}

interface PricingTableProps {
  plans: PricingPlan[]
  className?: string
}

export function PricingTable({ plans, className }: PricingTableProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "quarterly">("monthly")

  return (
    <div className={className}>
      {/* Billing Toggle */}
      <div className="flex justify-center mb-16">
        <div className="inline-flex items-center bg-gradient-to-br from-white to-steel-50 rounded-xl p-1.5 shadow-soft-md border border-steel-200">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200",
              billingPeriod === "monthly"
                ? "bg-gradient-to-br from-primary to-primary-600 text-white shadow-lg shadow-primary/25 scale-105"
                : "text-charcoal hover:text-primary hover:bg-white/50"
            )}
            aria-pressed={billingPeriod === "monthly"}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("quarterly")}
            className={cn(
              "px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 relative",
              billingPeriod === "quarterly"
                ? "bg-gradient-to-br from-primary to-primary-600 text-white shadow-lg shadow-primary/25 scale-105"
                : "text-charcoal hover:text-primary hover:bg-white/50"
            )}
            aria-pressed={billingPeriod === "quarterly"}
          >
            Quarterly
            <span className={cn(
              "ml-2 text-xs px-2.5 py-1 rounded-full font-medium transition-all",
              billingPeriod === "quarterly"
                ? "bg-white/20 text-white"
                : "bg-primary/10 text-primary"
            )}>
              Save 15%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 lg:grid-cols-4">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <Card
              elevation={plan.popular ? "md" : "sm"}
              className={cn(
                "relative h-full flex flex-col transition-all duration-300",
                plan.popular
                  ? "border-2 border-primary shadow-xl shadow-primary/10 bg-gradient-to-br from-white to-primary-50/30"
                  : "hover:shadow-xl hover:border-primary/30"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-primary to-primary-600 text-white text-xs font-bold px-6 py-1.5 rounded-full shadow-lg shadow-primary/30 border-2 border-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8 flex-1">
                <h3 className="text-2xl font-bold text-charcoal mb-3 tracking-tight">
                  {plan.name}
                </h3>
                <p className="text-steel-600 text-sm mb-8 leading-relaxed min-h-[40px]">
                  {plan.description}
                </p>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-charcoal tracking-tight bg-gradient-to-br from-charcoal to-charcoal-dark bg-clip-text">
                      {billingPeriod === "monthly" ? plan.price.monthly : plan.price.quarterly}
                    </span>
                    {plan.price.monthly !== "Custom" && (
                      <span className="text-steel-600 text-base font-medium ml-1">
                        /{billingPeriod === "monthly" ? "mo" : "qtr"}
                      </span>
                    )}
                  </div>
                  {plan.limits && (
                    <p className="text-sm text-steel-600 mt-3 font-medium">{plan.limits}</p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start group">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-primary/20 transition-colors">
                        <Check className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                      </div>
                      <span className="text-sm text-charcoal leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8 pt-0">
                <Button
                  variant={plan.popular ? "primary" : "ghost"}
                  className={cn(
                    "w-full transition-all duration-200",
                    plan.popular
                      ? "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                      : "hover:border-primary hover:text-primary"
                  )}
                  asChild
                >
                  <Link href={plan.ctaLink}>{plan.cta}</Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
