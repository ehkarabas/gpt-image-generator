"use client";

import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageList } from "@/components/chat/message-list";
import { useMessages } from "@/hooks/use-messages";
import { useConversations } from "@/hooks/use-conversations";
import { ErrorBoundary } from "@/components/system/error-boundary";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, MessageSquare, RefreshCw, Wifi, X } from "lucide-react";
import { useState } from "react";

interface ChatInterfaceProps {
  className?: string;
  wrapWithLayout?: boolean;
  isMobile?: boolean;
  showSidebar?: boolean;
}

export function ChatInterface({
  className,
  wrapWithLayout = false,
  isMobile = false,
  showSidebar = true,
}: ChatInterfaceProps) {
  const { activeConversation } = useConversations();
  const {
    messages,
    sendMessage,
    isLoading,
    isSending,
    error: messageError,
  } = useMessages(activeConversation?.id || null);

  const [isConnected] = useState(true);

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) {
      console.error("No active conversation");
      return;
    }

    try {
      await sendMessage(content);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full w-full bg-background",
        className
      )}
      role="region"
      aria-label="Chat interface"
      data-testid="chat-interface-container"
    >
      {/* Error State */}
      <AnimatePresence>
        {messageError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-destructive/20 bg-destructive/5"
            data-testid="error-banner"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex items-center gap-2 flex-1">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Failed to load messages. Please try again.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-destructive hover:text-destructive/80 cursor-pointer"
                  data-testid="retry-button"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive/80 cursor-pointer"
                  data-testid="dismiss-error-button"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-warning/20 bg-warning/5"
            data-testid="connection-status"
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <Wifi className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning">
                Connection lost. Attempting to reconnect...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Conversation State */}
      {!activeConversation ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No conversation selected
            </h3>
            <p className="text-sm text-muted-foreground">
              Select a conversation from the sidebar or create a new one to start chatting.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Message List */}
          <ErrorBoundary>
            <MessageList
              className="flex-1"
              messages={messages.map(msg => ({
                id: msg.id,
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                messageType: msg.messageType as 'text' | 'image' | undefined,
                createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
              }))}
              isLoading={isLoading}
              autoScroll={true}
            />
          </ErrorBoundary>

          {/* Chat Input */}
          {/* Chat Input - 42rem centered wrapper */}
          <div className="border-t border-border p-4 flex justify-center sticky bottom-0 bg-background">
            <div className="w-full max-w-[42rem]">
              <ChatInput
                onSend={handleSendMessage}
                placeholder="Type your message..."
                className="w-full"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}