import { useState, useRef, useCallback } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeState {
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  isSwiping: boolean;
  direction: SwipeDirection;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseSwipeGestureOptions {
  threshold?: number; // Minimum distance to trigger swipe
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipe?: (direction: SwipeDirection) => void;
}

export function useSwipeGesture(options: UseSwipeGestureOptions = {}): SwipeHandlers & SwipeState {
  const {
    threshold = 50,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipe,
  } = options;

  const [state, setState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    isSwiping: false,
    direction: null,
  });

  const startRef = useRef({ x: 0, y: 0 });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
    setState(prev => ({
      ...prev,
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      isSwiping: true,
      direction: null,
    }));
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!state.isSwiping) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startRef.current.x;
    const deltaY = touch.clientY - startRef.current.y;

    // Determine direction based on larger delta
    let direction: SwipeDirection = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    setState(prev => ({
      ...prev,
      deltaX,
      deltaY,
      direction,
    }));
  }, [state.isSwiping]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!state.isSwiping) return;

    const { deltaX, deltaY, direction } = state;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check if swipe exceeded threshold
    if (absX > threshold || absY > threshold) {
      if (direction === 'left' && absX > absY) {
        onSwipeLeft?.();
        onSwipe?.('left');
      } else if (direction === 'right' && absX > absY) {
        onSwipeRight?.();
        onSwipe?.('right');
      } else if (direction === 'up' && absY > absX) {
        onSwipeUp?.();
        onSwipe?.('up');
      } else if (direction === 'down' && absY > absX) {
        onSwipeDown?.();
        onSwipe?.('down');
      }
    }

    setState(prev => ({
      ...prev,
      isSwiping: false,
      deltaX: 0,
      deltaY: 0,
    }));
  }, [state, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipe]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    ...state,
  };
}

// Hook for horizontal-only swipe navigation between items
export function useHorizontalSwipe(
  onPrevious: () => void,
  onNext: () => void,
  options: { threshold?: number; enabled?: boolean } = {}
): SwipeHandlers {
  const { threshold = 50, enabled = true } = options;

  const handlers = useSwipeGesture({
    threshold,
    onSwipeLeft: enabled ? onNext : undefined,
    onSwipeRight: enabled ? onPrevious : undefined,
  });

  return {
    onTouchStart: handlers.onTouchStart,
    onTouchMove: handlers.onTouchMove,
    onTouchEnd: handlers.onTouchEnd,
  };
}
