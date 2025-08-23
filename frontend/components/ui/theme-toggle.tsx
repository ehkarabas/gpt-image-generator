'use client';

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "ghost" | "outline";
}

/**
 * Theme Toggle Component with Next Themes Integration
 * Displays sun/moon icons with smooth animations
 * Handles theme switching with proper hydration
 */
export function ThemeToggle({ 
  className, 
  size = "sm", 
  variant = "ghost" 
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Show loading state during hydration
  if (!mounted) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn(
          "h-8 w-8 p-0 text-sidebar-foreground/70 cursor-pointer",
          className
        )}
        disabled
        data-testid="theme-toggle-loading"
        aria-label="Loading theme toggle"
      >
        <div className="h-5 w-5 animate-pulse bg-current rounded opacity-50" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        "h-8 w-8 p-0 relative overflow-hidden",
        "text-sidebar-foreground/70 hover:text-sidebar-foreground",
        "hover:bg-sidebar-accent transition-all duration-200 cursor-pointer",
        className
      )}
      data-testid="theme-toggle-button"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <motion.div
        className="relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Sun Icon */}
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            rotate: isDark ? 90 : 0,
            opacity: isDark ? 0 : 1,
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun className="!h-6 !w-6" />
        </motion.div>

        {/* Moon Icon */}
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : -90,
            opacity: isDark ? 1 : 0,
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon className="h-5 w-5" />
        </motion.div>
      </motion.div>
    </Button>
  );
}