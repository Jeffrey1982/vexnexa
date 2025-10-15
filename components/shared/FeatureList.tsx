"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

interface FeatureListProps {
  features: Feature[]
  columns?: 2 | 3 | 4
  className?: string
}

export function FeatureList({ features, columns = 3, className }: FeatureListProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div className={cn("grid gap-8", gridCols[columns], className)}>
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="flex flex-col"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
            <feature.icon className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold text-charcoal mb-2">
            {feature.title}
          </h3>
          <p className="text-steel-600 leading-relaxed">
            {feature.description}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
