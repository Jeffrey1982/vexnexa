"use client";

import { useEffect, useRef, useState } from 'react';

interface SwipeData {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
}

interface TouchOptions {
  enableSwipe?: boolean;
  enablePinch?: boolean;
  enableTap?: boolean;
  swipeThreshold?: number;
  tapTimeout?: number;
}

export function useTouchInteractions(options: TouchOptions = {}) {
  const {
    enableSwipe = true,
    enablePinch = false,
    enableTap = true,
    swipeThreshold = 50,
    tapTimeout = 300
  } = options;

  const [swipeData, setSwipeData] = useState<SwipeData>({ direction: null, distance: 0, velocity: 0 });
  const [pinchScale, setPinchScale] = useState(1);
  const [tapCount, setTapCount] = useState(0);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialPinchDistance = useRef<number | null>(null);

  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Handle pinch start
    if (enablePinch && e.touches.length === 2) {
      initialPinchDistance.current = getDistance(e.touches[0], e.touches[1]);
    }

    // Reset swipe data
    setSwipeData({ direction: null, distance: 0, velocity: 0 });
  };

  const handleTouchMove = (e: TouchEvent) => {
    // Handle pinch
    if (enablePinch && e.touches.length === 2 && initialPinchDistance.current) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistance.current;
      setPinchScale(scale);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Handle swipe
    if (enableSwipe) {
      const deltaX = touchEndRef.current.x - touchStartRef.current.x;
      const deltaY = touchEndRef.current.y - touchStartRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const timeDelta = touchEndRef.current.time - touchStartRef.current.time;
      const velocity = distance / timeDelta;

      if (distance > swipeThreshold) {
        let direction: 'left' | 'right' | 'up' | 'down';

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        setSwipeData({ direction, distance, velocity });
      }
    }

    // Handle tap
    if (enableTap) {
      const timeDelta = touchEndRef.current.time - touchStartRef.current.time;
      const distance = Math.sqrt(
        Math.pow(touchEndRef.current.x - touchStartRef.current.x, 2) +
        Math.pow(touchEndRef.current.y - touchStartRef.current.y, 2)
      );

      // Consider it a tap if it's quick and doesn't move much
      if (timeDelta < tapTimeout && distance < 10) {
        setTapCount(prev => prev + 1);

        // Reset tap count after timeout
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }
        tapTimeoutRef.current = setTimeout(() => {
          setTapCount(0);
        }, tapTimeout);
      }
    }

    // Reset pinch
    if (enablePinch) {
      initialPinchDistance.current = null;
      setPinchScale(1);
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const attachListeners = (element: HTMLElement) => {
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  };

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  return {
    swipeData,
    pinchScale,
    tapCount,
    attachListeners,
    isSwipeLeft: swipeData.direction === 'left',
    isSwipeRight: swipeData.direction === 'right',
    isSwipeUp: swipeData.direction === 'up',
    isSwipeDown: swipeData.direction === 'down',
    isDoubleTap: tapCount === 2,
    isSingleTap: tapCount === 1,
  };
}

// Hook for detecting touch device
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);

    return () => {
      window.removeEventListener('resize', checkTouchDevice);
    };
  }, []);

  return isTouchDevice;
}

// Hook for enhanced button interactions
export function useTouchButton() {
  const [isPressed, setIsPressed] = useState(false);
  const [rippleActive, setRippleActive] = useState(false);

  const handleTouchStart = () => {
    setIsPressed(true);
    setRippleActive(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    setTimeout(() => setRippleActive(false), 300);
  };

  const touchProps = {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
    className: `${isPressed ? 'touch-pressed' : ''} ${rippleActive ? 'ripple' : ''}`,
    style: {
      transform: isPressed ? 'scale(0.98)' : 'scale(1)',
      transition: 'transform 0.1s ease',
    }
  };

  return { touchProps, isPressed, rippleActive };
}