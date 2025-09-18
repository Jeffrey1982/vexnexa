"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTouchInteractions } from '@/hooks/useTouchInteractions';
import { cn } from '@/lib/utils';

interface SwipeableTabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  enableSwipe?: boolean;
}

interface SwipeableTabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface SwipeableTabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SwipeableTabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  enableSwipe = true,
}: SwipeableTabsProps) {
  const [currentValue, setCurrentValue] = useState(value || defaultValue || '');
  const [tabValues, setTabValues] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const { swipeData, attachListeners } = useTouchInteractions({
    enableSwipe,
    swipeThreshold: 50,
  });

  // Extract tab values from children
  useEffect(() => {
    const values: string[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === SwipeableTabsContent) {
        values.push(child.props.value);
      }
    });
    setTabValues(values);
  }, [children]);

  // Handle swipe navigation
  useEffect(() => {
    if (!enableSwipe || !swipeData.direction || !currentValue) return;

    const currentIndex = tabValues.indexOf(currentValue);
    let newIndex = currentIndex;

    if (swipeData.direction === 'left' && currentIndex < tabValues.length - 1) {
      newIndex = currentIndex + 1;
    } else if (swipeData.direction === 'right' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }

    if (newIndex !== currentIndex) {
      const newValue = tabValues[newIndex];
      setCurrentValue(newValue);
      onValueChange?.(newValue);
    }
  }, [swipeData, currentValue, tabValues, enableSwipe, onValueChange]);

  // Attach touch listeners to content area
  useEffect(() => {
    if (!contentRef.current || !enableSwipe) return;
    return attachListeners(contentRef.current);
  }, [attachListeners, enableSwipe]);

  const handleValueChange = (newValue: string) => {
    setCurrentValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <Tabs
      value={value || currentValue}
      onValueChange={handleValueChange}
      className={className}
    >
      {children}
      {enableSwipe && (
        <div
          ref={contentRef}
          className="touch-none"
          style={{ position: 'absolute', inset: 0, zIndex: -1 }}
        />
      )}
    </Tabs>
  );
}

export function SwipeableTabsList({ children, className }: SwipeableTabsListProps) {
  return (
    <div className="relative">
      <TabsList
        className={cn(
          'grid w-full',
          // Make scrollable on mobile
          'overflow-x-auto scrollbar-none',
          // Better touch targets
          '[&>*]:min-h-[44px] [&>*]:text-sm',
          // Smooth scrolling
          'scroll-smooth',
          className
        )}
      >
        {children}
      </TabsList>
      {/* Swipe hint for mobile */}
      <div className="sm:hidden text-xs text-muted-foreground text-center mt-1 opacity-60">
        ← Swipe to navigate →
      </div>
    </div>
  );
}

export function SwipeableTabsContent({ value, children, className }: SwipeableTabsContentProps) {
  return (
    <TabsContent
      value={value}
      className={cn(
        // Smooth transitions
        'transition-all duration-300 ease-out',
        // Touch-friendly spacing
        'space-y-4 mt-4',
        className
      )}
    >
      {children}
    </TabsContent>
  );
}

// Export individual components for flexibility
SwipeableTabs.List = SwipeableTabsList;
SwipeableTabs.Content = SwipeableTabsContent;
SwipeableTabs.Trigger = TabsTrigger;