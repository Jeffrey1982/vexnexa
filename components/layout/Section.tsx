import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  container?: boolean
  background?: "default" | "white" | "gradient" | "grid"
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ children, container = true, background = "default", className, ...props }, ref) => {
    const bgClasses = {
      default: "bg-offwhite",
      white: "bg-white",
      gradient: "bg-gradient-radial",
      grid: "bg-grid-subtle",
    }

    return (
      <section
        ref={ref}
        className={cn(
          "py-16 md:py-24 lg:py-32",
          bgClasses[background],
          className
        )}
        {...props}
      >
        {container ? (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {children}
          </div>
        ) : (
          children
        )}
      </section>
    )
  }
)
Section.displayName = "Section"
