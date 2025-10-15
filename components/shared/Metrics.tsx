"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Metric {
  value: string
  label: string
  highlighted?: boolean
}

interface MetricsProps {
  metrics: Metric[]
  layout?: "chips" | "grid"
  className?: string
}

export function Metrics({ metrics, layout = "chips", className }: MetricsProps) {
  if (layout === "chips") {
    return (
      <div className={cn("flex flex-wrap gap-3", className)}>
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border",
              metric.highlighted
                ? "bg-primary text-white border-primary"
                : "bg-white text-charcoal border-steel-300"
            )}
          >
            <span className="font-bold mr-2">{metric.value}</span>
            <span className={metric.highlighted ? "opacity-90" : "text-steel-600"}>
              {metric.label}
            </span>
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-8", className)}>
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="text-center"
        >
          <div className="text-4xl font-bold text-primary mb-2">
            {metric.value}
          </div>
          <div className="text-sm text-steel-600">{metric.label}</div>
        </motion.div>
      ))}
    </div>
  )
}
