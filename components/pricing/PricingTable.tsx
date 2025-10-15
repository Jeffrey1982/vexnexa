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
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-soft-sm">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "px-6 py-2 rounded-md text-sm font-medium transition-all",
              billingPeriod === "monthly"
                ? "bg-primary text-white shadow-soft-sm"
                : "text-charcoal hover:text-primary"
            )}
            aria-pressed={billingPeriod === "monthly"}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("quarterly")}
            className={cn(
              "px-6 py-2 rounded-md text-sm font-medium transition-all",
              billingPeriod === "quarterly"
                ? "bg-primary text-white shadow-soft-sm"
                : "text-charcoal hover:text-primary"
            )}
            aria-pressed={billingPeriod === "quarterly"}
          >
            Quarterly
            <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
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
          >
            <Card
              elevation={plan.popular ? "md" : "sm"}
              className={cn(
                "relative h-full flex flex-col",
                plan.popular && "border-2 border-primary"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6 flex-1">
                <h3 className="text-2xl font-bold text-charcoal mb-2">
                  {plan.name}
                </h3>
                <p className="text-steel-600 text-sm mb-6">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-charcoal">
                      {billingPeriod === "monthly" ? plan.price.monthly : plan.price.quarterly}
                    </span>
                    {plan.price.monthly !== "Custom" && (
                      <span className="text-steel-600 ml-2">
                        /{billingPeriod === "monthly" ? "mo" : "qtr"}
                      </span>
                    )}
                  </div>
                  {plan.limits && (
                    <p className="text-sm text-steel-600 mt-2">{plan.limits}</p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mr-3 mt-0.5" aria-hidden="true" />
                      <span className="text-sm text-charcoal">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 pt-0">
                <Button
                  variant={plan.popular ? "primary" : "ghost"}
                  className="w-full"
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
