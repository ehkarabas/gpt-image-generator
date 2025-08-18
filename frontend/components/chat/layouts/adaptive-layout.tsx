"use client";

import { useState } from "react";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { AdaptiveHeader } from "@/components/chat/adaptive-header";
import { ChatInterface } from "@/components/chat/chat-interface";

interface AdaptiveLayoutProps {
  showSidebar: boolean;
  showDropdown: boolean;
  isMobile: boolean;
}

export function AdaptiveLayout({
  showSidebar,
  showDropdown,
  isMobile,
}: AdaptiveLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className="h-screen bg-gray-50 flex"
      data-testid="chat-interface-adaptive"
      data-sidebar-visible={showSidebar}
      data-dropdown-visible={showDropdown}
      data-mobile={isMobile}
    >
      {showSidebar && !isMobile && (
        <aside
          className="w-80 bg-white border-r border-gray-200 shrink-0"
          data-testid="desktop-sidebar"
        >
          <ConversationSidebar />
        </aside>
      )}

      {isMobile && (
        // Lazy import wrapper to avoid SSR issues
        <div>
          {/* Minimal overlay without portal to keep deps small */}
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 z-40 flex"
              aria-modal="true"
              role="dialog"
              data-testid="mobile-sidebar-overlay"
            >
              <div
                className="fixed inset-0 bg-black/40"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <div className="relative z-50 w-80 max-w-[80%] h-full bg-white border-r border-gray-200">
                <ConversationSidebar />
              </div>
            </div>
          )}
        </div>
      )}

      <main
        className="flex-1 flex flex-col min-w-0"
        data-testid="chat-main-adaptive"
      >
        <AdaptiveHeader
          showDropdown={showDropdown}
          showSidebar={showSidebar}
          isMobile={isMobile}
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
        />

        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-3xl mx-auto flex flex-col">
            {/* Use existing ChatInterface orchestration */}
            <ChatInterface className="flex-1" />
          </div>
        </div>
      </main>
    </div>
  );
}
