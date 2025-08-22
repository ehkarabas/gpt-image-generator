'use client';

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

interface ScrollToBottomProps {
  /** Whether to show the button */
  show: boolean;
  /** Callback when button is clicked */
  onClick: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Number of unread messages (optional) */
  unreadCount?: number;
}

/**
 * Floating scroll-to-bottom button for chat interfaces
 * Appears when user scrolls up and disappears when near bottom
 */
export function ScrollToBottom({
  show,
  onClick,
  className,
  unreadCount,
}: ScrollToBottomProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ 
            duration: 0.2, 
            ease: "easeOut" 
          }}
          className={cn(
            "fixed bottom-20 right-4 z-50",
            "sm:bottom-24 sm:right-6",
            className
          )}
        >
          <Button
            onClick={onClick}
            size="sm"
            className={cn(
              "h-10 w-10 rounded-full p-0",
              "bg-primary/90 hover:bg-primary",
              "text-primary-foreground",
              "shadow-lg hover:shadow-xl",
              "border border-primary/20",
              "backdrop-blur-sm",
              "transition-all duration-200",
              "relative overflow-hidden cursor-pointer"
            )}
            data-testid="scroll-to-bottom-button"
            aria-label={`Scroll to bottom${unreadCount ? ` (${unreadCount} new messages)` : ''}`}
          >
            {/* Background animation */}
            <motion.div
              className="absolute inset-0 bg-primary/20"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            />
            
            {/* Arrow Icon */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10"
            >
              <ArrowDown className="h-4 w-4" />
            </motion.div>

            {/* Unread Count Badge */}
            {unreadCount && unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "absolute -top-1 -right-1",
                  "bg-destructive text-destructive-foreground",
                  "text-xs font-medium",
                  "h-5 w-5 rounded-full",
                  "flex items-center justify-center",
                  "border-2 border-background",
                  "shadow-sm"
                )}
                data-testid="unread-count-badge"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.div>
            )}
          </Button>

          {/* Pulse animation ring */}
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full",
              "border-2 border-primary/30",
              "pointer-events-none"
            )}
            initial={{ scale: 1, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1], 
              opacity: [0, 0.3, 0] 
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}