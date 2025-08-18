"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, MessageSquare } from "lucide-react";
import { useConversations } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";

// Lightweight dropdown without Radix to avoid adding dependencies
export function ConversationDropdown() {
  const { conversations, activeConversation, switchConversation } =
    useConversations();
  const [open, setOpen] = useState(false);

  const activeTitle = activeConversation?.title || "Select conversation";

  return (
    <div className="relative" data-testid="conversation-dropdown">
      <Button
        variant="ghost"
        className="flex items-center gap-2 text-lg font-medium text-gray-900 hover:bg-gray-100"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate max-w-[200px]">{activeTitle}</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </Button>
      {open && (
        <div
          role="listbox"
          className="absolute mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-md z-10 max-h-96 overflow-y-auto"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="p-2">
            {conversations.map(
              (conversation: {
                id: string;
                title: string;
                message_count?: number;
              }) => (
                <button
                  key={conversation.id}
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    switchConversation(conversation.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left flex items-center gap-3 p-3 rounded-md hover:bg-gray-50",
                    activeConversation?.id === conversation.id && "bg-blue-50",
                  )}
                  data-testid={`conversation-option-${conversation.id}`}
                >
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {conversation.message_count || 0} messages
                    </p>
                  </div>
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
