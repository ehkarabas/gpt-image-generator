"use client";

import { useState, useEffect } from "react";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { AdaptiveHeader } from "@/components/chat/adaptive-header";
import { ChatInterface } from "@/components/chat/chat-interface";
import { MobileSidebarOverlay } from "@/components/chat/mobile-sidebar-overlay";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { motion, AnimatePresence } from "framer-motion";

interface AdaptiveLayoutProps {
  showSidebar?: boolean;
  showDropdown?: boolean;
  isMobile?: boolean; // Still accept for override, but detect automatically
}

export function AdaptiveLayout({
  showSidebar = true,
  showDropdown = true,
  isMobile: forceMobile,
}: AdaptiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();

  // Responsive breakpoint detection - 768px for better mobile experience
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint for better mobile experience
      setIsMobile(forceMobile ?? mobile);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, [forceMobile]);

  // Close mobile sidebar on screen resize to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div
      className="!h-screen !w-screen bg-background dark:bg-background flex"
      data-testid="chat-interface-adaptive"
      data-sidebar-visible={showSidebar}
      data-dropdown-visible={showDropdown}
      data-mobile={isMobile}
    >
      {/* Desktop Sidebar - responsive width */}
      <AnimatePresence mode="wait">
        {showSidebar && !isMobile && sidebarOpen && (
          <motion.aside
            key="desktop-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "280px", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ 
              duration: 0.2, 
              ease: "easeInOut",
              opacity: { duration: 0.15 }
            }}
            className="bg-card dark:bg-sidebar border-r border-border dark:border-sidebar-border flex-shrink-0 overflow-hidden"
            style={{ minWidth: sidebarOpen ? "280px" : "0px" }}
            data-testid="desktop-sidebar"
          >
            <div className="w-[280px] h-full">
              <ConversationSidebar />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && mobileSidebarOpen && (
          <MobileSidebarOverlay 
            onClose={() => setMobileSidebarOpen(false)}
          >
            <ConversationSidebar />
          </MobileSidebarOverlay>
        )}
      </AnimatePresence>

      {/* Main Chat Area - flexible width */}
      <div
        className="flex flex-col flex-1 min-w-0 w-full overflow-hidden"
        data-testid="chat-main-adaptive"
      >
        <AdaptiveHeader
          showDropdown={showDropdown}
          showSidebar={showSidebar}
          isMobile={isMobile}
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
        />

        {/* Chat Content Area */}
        <div className="flex-1 w-full h-0">
          <ChatInterface 
            className="h-full" 
            isMobile={isMobile}
            showSidebar={showSidebar}
          />
        </div>
      </div>
    </div>
  );
}