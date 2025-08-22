'use client';

import { ScrollToBottom } from "@/components/chat/scroll-to-bottom";
import { GeneratedImage } from "@/components/chat/generated-image";
import { Card } from "@/components/ui/card";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MessageSquare, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  messageType?: 'text' | 'image';
  createdAt: string;
  imageId?: string;
}

interface MessageListProps {
  className?: string;
  messages?: Message[];
  isLoading?: boolean;
  autoScroll?: boolean;
  showScrollToBottom?: boolean;
}

/**
 * Enhanced MessageList component with auto scroll functionality
 * Phase 2: Auto scroll system implementation
 * Phase 3: Will add proper message rendering
 */
export function MessageList({ 
  className,
  messages = [],
  isLoading = false,
  showScrollToBottom: forceShowScrollButton = false,
}: MessageListProps) {
  const {
    scrollRef,
    isAutoScrollActive,
    showScrollToBottom,
    scrollToBottom,
    setAutoScrollActive,
  } = useAutoScroll({
    threshold: 100,
    smooth: true,
    debounceDelay: 100,
  });

  // Calculate unread count (placeholder for Phase 3)
  const unreadCount = 0; // Will be calculated based on actual message read status

  // Determine if scroll button should be shown
  const shouldShowScrollButton = forceShowScrollButton || showScrollToBottom;

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Scrollable Message Container */}
      <div 
        ref={scrollRef}
        className={cn(
          "h-full !overflow-y-auto overflow-x-hidden",
          "scroll-smooth scrollbar-thin scrollbar-thumb-border",
          "scrollbar-track-transparent",
          className
        )}
        data-testid="message-list-container"
      >
        <div className="p-6">
          {messages.length === 0 ? (
            /* Welcome State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center h-full min-h-[400px]"
              data-testid="message-list-empty"
            >
              <div className="text-center max-w-md">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                </motion.div>
                
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Start a conversation
                </h3>
                
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Your messages will appear here. Ask me anything or request image generation!
                </p>
                
                {/* Auto Scroll Status Indicator (for development/debug) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-muted-foreground/50 mt-4 space-y-1">
                    <p>Auto Scroll: {isAutoScrollActive ? '✅ Active' : '❌ Inactive'}</p>
                    <button 
                      onClick={() => setAutoScrollActive(!isAutoScrollActive)}
                      className="text-primary hover:underline"
                    >
                      Toggle Auto Scroll
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Actual Messages Rendering */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
              data-testid="message-list-messages"
            >
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {/* Avatar for assistant messages */}
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  {/* Message content */}
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === 'user' 
                      ? "bg-accent text-black dark:bg-teal-600 dark:text-white ml-auto" 
                      : "bg-muted"
                  )}>
                    {(message.messageType === 'image' || 
                      (message.role === 'assistant' && message.content?.includes('oaidalleapiprodscus'))) ? (
                      /* Image Message */
                      <div className="space-y-3">
                        <GeneratedImage 
                          imageUrl={message.content}
                          alt="Generated image"
                          className="max-w-sm"
                        />
                      </div>
                    ) : (
                      /* Text Message */
                      <div className={cn(
                        "prose prose-sm max-w-none",
                        message.role === 'user' 
                          ? "text-black dark:text-white" 
                          : "text-foreground dark:prose-invert"
                      )}>
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className={cn(
                      "text-xs mt-2 opacity-70",
                      message.role === 'user' ? "text-right text-slate-800 dark:text-gray-100" : "text-left text-foreground"
                    )}>
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Avatar for user messages */}
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Loading State */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-lg border",
                    "bg-muted/50 text-muted-foreground",
                    "flex items-center space-x-2"
                  )}
                  data-testid="message-loading"
                >
                  <div className="flex space-x-1">
                    <motion.div
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                  <span className="text-sm">Generating response...</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      <ScrollToBottom
        show={shouldShowScrollButton && messages.length > 0}
        onClick={() => scrollToBottom(true)}
        unreadCount={unreadCount}
      />
    </div>
  );
}