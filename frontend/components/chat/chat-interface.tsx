"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, RefreshCw, Wifi } from "lucide-react";
import { SimpleLayout } from "@/components/layout/simple-layout";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { useMessages } from "@/hooks/use-messages";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  className?: string;
  wrapWithLayout?: boolean;
}

export function ChatInterface({
  className,
  wrapWithLayout = true,
}: ChatInterfaceProps) {
  const {
    messages,
    sendMessage,
    error,
    clearError,
    retry,
    loadMoreMessages,
    hasMore,
    isLoading,
  } = useMessages();

  const [isConnected] = useState(true); // Future: implement real connection monitoring

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (err) {
      // Error is handled by the useMessages hook
      console.error("Failed to send message:", err);
    }
  };

  const handleRetry = () => {
    retry();
  };

  const handleDismissError = () => {
    clearError();
  };

  const content = (
    <div
      className={cn("flex flex-col h-full", className)}
      role="region"
      aria-label="Chat interface"
      data-testid="chat-interface-container"
    >
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              "flex items-center space-x-1 text-sm",
              isConnected ? "text-green-500" : "text-red-500",
            )}
            data-testid="chat-connection-status"
          >
            <Wifi className="h-4 w-4" />
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMoreMessages}
            className="text-gray-500"
          >
            Load More
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="ml-3">
                <p
                  className="text-sm text-red-800"
                  data-testid="chat-error-message"
                >
                  {error.message}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="text-red-600 hover:text-red-700"
                data-testid="chat-retry-button"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissError}
                className="text-red-600 hover:text-red-700"
                data-testid="chat-error-dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Message */}
      {!isLoading && messages.length === 0 && !error && (
        <div
          className="flex-1 flex items-center justify-center p-8"
          data-testid="chat-welcome-message"
        >
          <div className="text-center max-w-md">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to GPT Image Generator
            </h2>
            <p className="text-gray-500 mb-4">
              Start a conversation or ask me to generate images for you. I can
              help with both text responses and create visual content!
            </p>
            <div className="text-sm text-gray-400">
              <p>Try asking:</p>
              <ul className="mt-2 space-y-1">
                <li>
                  • &quot;Generate an image of a sunset over mountains&quot;
                </li>
                <li>• &quot;What can you help me with?&quot;</li>
                <li>• &quot;Create a logo for my startup&quot;</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          autoScroll={true}
          showScrollToBottom={messages.length > 5}
        />
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-200 bg-white">
        <ChatInput onSend={handleSendMessage} />
      </div>
    </div>
  );

  return wrapWithLayout ? <SimpleLayout>{content}</SimpleLayout> : content;
}
