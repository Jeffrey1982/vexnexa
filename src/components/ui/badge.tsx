import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        trust:
          "border-transparent bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary-dark)]",
        critical:
          "border-transparent bg-[var(--color-critical-bg)] text-[var(--color-critical-fg)]",
        serious:
          "border-transparent bg-[var(--color-serious-bg)] text-[var(--color-serious-fg)]",
        moderate:
          "border-transparent bg-[var(--color-moderate-bg)] text-[var(--color-moderate-fg)]",
        minor:
          "border-transparent bg-[var(--color-minor-bg)] text-[var(--color-minor-fg)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
