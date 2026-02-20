import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-[var(--vn-disabled-bg)] disabled:text-[var(--vn-disabled-fg)] disabled:opacity-100 disabled:shadow-none disabled:translate-y-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--vn-primary-aaa-btn)] text-[var(--vn-on-primary-aaa-btn)] shadow-elev2 hover:bg-[var(--vn-primary-aaa-btn-hover)] hover:shadow-elev3 hover:-translate-y-px",
        destructive:
          "bg-destructive text-destructive-foreground shadow-elev2 hover:bg-destructive/90 hover:shadow-elev3 hover:-translate-y-px",
        outline:
          "border border-[var(--vn-border)] bg-white dark:bg-[var(--surface-2)] dark:border-white/[0.08] text-foreground shadow-elev1 dark:shadow-none hover:bg-[var(--vn-muted)] dark:hover:bg-[var(--surface-3)] hover:border-[var(--vn-primary)] dark:hover:border-white/[0.12] hover:shadow-elev2 dark:hover:shadow-none hover:-translate-y-px",
        secondary:
          "glass shadow-elev2 hover:shadow-elev3 hover:-translate-y-px text-foreground",
        ghost: "hover:bg-[var(--vn-muted)] text-foreground hover:text-[var(--vn-primary)]",
        link: "text-[var(--vn-primary)] underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-r from-[var(--vn-primary-aaa-btn)] to-[var(--vn-accent)] text-[var(--vn-on-primary-aaa-btn)] shadow-elev3 hover:shadow-elev4 hover:-translate-y-px hover:from-[var(--vn-primary-aaa-btn-hover)] hover:to-[var(--vn-accent)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
