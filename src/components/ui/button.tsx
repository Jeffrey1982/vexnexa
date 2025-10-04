import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--tp-primary)] text-white shadow-elev2 hover:bg-[var(--tp-primary-hover)] hover:shadow-elev3 hover:-translate-y-px",
        destructive:
          "bg-destructive text-destructive-foreground shadow-elev2 hover:bg-destructive/90 hover:shadow-elev3 hover:-translate-y-px",
        outline:
          "border border-[var(--tp-border)] bg-white shadow-elev1 hover:bg-[var(--tp-muted)] hover:border-[var(--tp-primary)] hover:shadow-elev2 hover:-translate-y-px",
        secondary:
          "glass shadow-elev2 hover:shadow-elev3 hover:-translate-y-px text-[var(--tp-text)]",
        ghost: "hover:bg-[var(--tp-muted)] hover:text-[var(--tp-text)]",
        link: "text-[var(--tp-primary)] underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-r from-[var(--tp-primary)] to-[var(--tp-accent)] text-white shadow-elev3 hover:shadow-elev4 hover:-translate-y-px hover:from-[var(--tp-primary-hover)] hover:to-[var(--tp-accent)]",
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
