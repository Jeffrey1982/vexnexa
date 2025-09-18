"use client";

import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTouchButton, useIsTouchDevice } from '@/hooks/useTouchInteractions';

interface TouchButtonProps extends ButtonProps {
  touchFeedback?: boolean;
  minTouchTarget?: boolean;
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, touchFeedback = true, minTouchTarget = true, children, ...props }, ref) => {
    const { touchProps, isPressed } = useTouchButton();
    const isTouchDevice = useIsTouchDevice();

    return (
      <Button
        ref={ref}
        className={cn(
          // Base touch-friendly styles
          minTouchTarget && 'min-h-[44px] min-w-[44px]',
          isTouchDevice && 'touch-none select-none',

          // Touch feedback styles
          touchFeedback && [
            'transition-all duration-150 ease-out',
            'active:scale-95 active:brightness-95',
            'focus-visible:ring-2 focus-visible:ring-offset-2',
          ],

          // Enhanced visual feedback for touch
          isTouchDevice && [
            'active:shadow-inner',
            'hover:shadow-md',
          ],

          className
        )}
        {...(isTouchDevice && touchFeedback ? touchProps : {})}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

TouchButton.displayName = "TouchButton";