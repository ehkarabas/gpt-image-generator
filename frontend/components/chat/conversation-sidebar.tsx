"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, X, MessageSquare } from "lucide-react";
import { ConversationItem } from "@/components/chat/conversation-item";
import { useConversations } from "@/hooks/use-conversations";

type SidebarConversation = {
  id: string;
  title: string;
  message_count?: number;
  updated_at: string;
};

export function ConversationSidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    conversations,
    createConversation,
    filteredConversations,
    isCreating,
  } = useConversations();

  const displayConversations: SidebarConversation[] = searchQuery
    ? (filteredConversations(searchQuery) as SidebarConversation[])
    : (conversations as SidebarConversation[]);

  return (
    <div className="flex flex-col h-full" data-testid="conversation-sidebar">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2
            className="text-lg font-semibold text-gray-900"
            data-testid="sidebar-title"
          >
            Conversations
          </h2>
          <Button
            size="sm"
            onClick={createConversation}
            disabled={isCreating}
            className="bg-black hover:bg-gray-800 text-white"
            data-testid="sidebar-new-chat-button"
            aria-label="Create new conversation"
          >
            <Plus className="h-4 w-4" />
            {isCreating && <span className="sr-only">Creating...</span>}
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="pl-10 pr-10 text-sm"
            data-testid="conversation-search"
            aria-label="Search conversations"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchQuery("")}
              data-testid="clear-search-button"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-testid="conversation-list-container"
      >
        <div className="p-2">
          {displayConversations.length === 0 ? (
            <div
              className="text-center py-8 text-gray-500"
              data-testid="empty-conversations"
            >
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery
                  ? "No conversations found"
                  : "No conversations yet"}
              </p>
            </div>
          ) : (
            <div
              className="space-y-1"
              data-testid="conversation-list"
              role="list"
              aria-label="Conversation list"
            >
              {displayConversations.map(
                (conversation: SidebarConversation, index: number) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    index={index}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 p-4">
        {/* Reserved for user profile area in future phase */}
      </div>
    </div>
  );
}
