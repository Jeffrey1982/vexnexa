"use client";

import Link from "next/link";
import { Button, type ButtonProps } from "@/components/ui/button";
import { trackEvent, type FunnelEvent } from "@/lib/analytics-events";
import { cn } from "@/lib/utils";

interface TrackedCTAProps extends Omit<ButtonProps, "onClick" | "asChild"> {
  href: string;
  event: FunnelEvent;
  eventProps?: Record<string, string | number | boolean | undefined>;
  children: React.ReactNode;
}

export function TrackedCTA({
  href,
  event,
  eventProps,
  children,
  className,
  ...buttonProps
}: TrackedCTAProps) {
  return (
    <Button asChild className={cn(className)} {...buttonProps}>
      <Link
        href={href}
        onClick={() => trackEvent(event, eventProps)}
      >
        {children}
      </Link>
    </Button>
  );
}
