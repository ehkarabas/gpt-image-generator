'use client';

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoScrollOptions {
  /**
   * Auto scroll threshold - how close to bottom triggers auto scroll
   * @default 100
   */
  threshold?: number;
  /**
   * Smooth scroll behavior
   * @default true
   */
  smooth?: boolean;
  /**
   * Debounce delay for scroll events (ms)
   * @default 100
   */
  debounceDelay?: number;
}

interface UseAutoScrollReturn {
  /** Ref to attach to scrollable container */
  scrollRef: React.RefObject<HTMLDivElement>;
  /** Whether auto scroll is currently active */
  isAutoScrollActive: boolean;
  /** Whether user is near bottom */
  isNearBottom: boolean;
  /** Whether scroll to bottom button should be shown */
  showScrollToBottom: boolean;
  /** Manually scroll to bottom */
  scrollToBottom: (smooth?: boolean) => void;
  /** Enable/disable auto scroll */
  setAutoScrollActive: (active: boolean) => void;
}

/**
 * Custom hook for handling auto scroll behavior in chat-like interfaces
 * Automatically scrolls to bottom when new content is added, with intelligent
 * detection of user scroll position
 */
export function useAutoScroll({
  threshold = 100,
  smooth = true,
  debounceDelay = 100,
}: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Check if user is near bottom of scroll container
  const checkScrollPosition = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom <= threshold;

    setIsNearBottom(nearBottom);
    setShowScrollToBottom(!nearBottom && scrollHeight > clientHeight * 1.5);

    // Auto-disable auto scroll if user scrolls up significantly
    if (!nearBottom && distanceFromBottom > threshold * 2) {
      setIsAutoScrollActive(false);
    }
  }, [threshold]);

  // Debounced scroll handler
  const handleScroll = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      checkScrollPosition();
    }, debounceDelay);
  }, [checkScrollPosition, debounceDelay]);

  // Scroll to bottom function
  const scrollToBottom = useCallback((smoothScroll = smooth) => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollOptions: ScrollToOptions = {
      top: container.scrollHeight,
      behavior: smoothScroll ? 'smooth' : 'instant',
    };

    container.scrollTo(scrollOptions);
    
    // Re-enable auto scroll when manually scrolling to bottom
    setIsAutoScrollActive(true);
  }, [smooth]);

  // Auto scroll effect - triggered by content changes
  useEffect(() => {
    if (!isAutoScrollActive || !scrollRef.current) return;

    const container = scrollRef.current;
    
    // Check if we should auto scroll (user is near bottom)
    if (isNearBottom) {
      // Small delay to ensure DOM updates are complete
      const timeoutId = setTimeout(() => {
        scrollToBottom(true);
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [isAutoScrollActive, isNearBottom, scrollToBottom]);

  // Set up scroll event listener
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    checkScrollPosition();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [handleScroll, checkScrollPosition]);

  return {
    scrollRef,
    isAutoScrollActive,
    isNearBottom,
    showScrollToBottom,
    scrollToBottom,
    setAutoScrollActive: setIsAutoScrollActive,
  };
}