"use client";

import { ReactNode, cloneElement, isValidElement } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileSidebarOverlayProps {
  children: ReactNode;
  onClose: () => void;
}

export function MobileSidebarOverlay({ 
  children, 
  onClose 
}: MobileSidebarOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex lg:hidden"
      aria-modal="true"
      role="dialog"
      data-testid="mobile-sidebar-overlay"
    >
      {/* Dark overlay - Click to close */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Sidebar Panel - 18rem fixed width, full height */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ 
          duration: 0.3, 
          ease: "easeInOut",
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="
          relative z-50 
          w-72 min-w-72 h-screen 
          bg-card border-r border-border
          shadow-xl
          flex flex-col
          overflow-hidden
        "
        data-testid="mobile-sidebar-panel"
      >
        {/* Sidebar Content - Full height */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto">
          {isValidElement(children) 
            ? cloneElement(children, { 
                onMobileClose: onClose, 
                isMobile: true 
              } as any)
            : children
          }
        </div>
      </motion.div>
    </div>
  );
}