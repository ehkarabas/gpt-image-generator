"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ConversationDropdown } from "@/components/chat/conversation-dropdown";

interface AdaptiveHeaderProps {
  showDropdown: boolean;
  showSidebar: boolean;
  isMobile: boolean;
  onMobileMenuClick: () => void;
}

export function AdaptiveHeader({
  showDropdown,
  isMobile,
  onMobileMenuClick,
}: AdaptiveHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="p-2 -ml-2"
              onClick={onMobileMenuClick}
              aria-label="Open menu"
              data-testid="mobile-menu-button"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">⚡</span>
          </div>

          {showDropdown ? (
            <ConversationDropdown />
          ) : (
            <span className="text-lg font-medium text-gray-900">ChatGPT</span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-gray-600 hover:text-gray-900"
        >
          New Chat
        </Button>
      </div>
    </header>
  );
}
