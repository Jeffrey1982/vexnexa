"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Star } from "lucide-react"
import Image from "next/image"

interface TestimonialItem {
  quote: string
  author: string
  role: string
  company: string
  avatar?: string
  verified?: boolean
}

interface TestimonialProps {
  items: TestimonialItem[]
  layout?: "grid" | "carousel"
  className?: string
}

export function Testimonial({ items, layout = "grid", className }: TestimonialProps) {
  if (layout === "carousel") {
    // Simplified carousel - in production, use a proper carousel library
    return (
      <div className={cn("space-y-8", className)}>
        {items.slice(0, 1).map((item, index) => (
          <TestimonialCard key={index} item={item} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("grid gap-8 md:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item, index) => (
        <TestimonialCard key={index} item={item} index={index} />
      ))}
    </div>
  )
}

function TestimonialCard({ item, index = 0 }: { item: TestimonialItem; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-white p-6 rounded-xl shadow-soft-sm hover:shadow-soft-md transition-shadow"
    >
      <div className="flex items-center space-x-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="w-4 h-4 fill-primary text-primary"
            aria-hidden="true"
          />
        ))}
      </div>
      <blockquote className="text-charcoal mb-4 leading-relaxed">
        "{item.quote}"
      </blockquote>
      <div className="flex items-center">
        {item.avatar ? (
          <Image
            src={item.avatar}
            alt={item.author}
            width={40}
            height={40}
            className="rounded-full mr-3"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-3">
            {item.author.charAt(0)}
          </div>
        )}
        <div>
          <div className="flex items-center">
            <span className="font-semibold text-charcoal">{item.author}</span>
            {item.verified && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Verified
              </span>
            )}
          </div>
          <div className="text-sm text-steel-600">
            {item.role} at {item.company}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
