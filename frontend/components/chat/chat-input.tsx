'use client';


import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ChatInputProps {
  className?: string;
  onSend?: (content: string) => Promise<void>;
}

export function ChatInput({ className, onSend }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const placeholderText = 'Type your message... (Shift+Enter for new line)';
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Force placeholder on client side to prevent null placeholder bug
  useEffect(() => {
    if (textareaRef.current && !textareaRef.current.placeholder) {
      textareaRef.current.placeholder = placeholderText;
    }
  }, [placeholderText]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    try {
      setIsSending(true);
      await onSend?.(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div 
      className={cn(
        "border border-border rounded-lg bg-card shadow-sm",
        "focus-within:ring-2 focus-within:ring-ring focus-within:border-ring",
        "transition-all duration-200",
        className
      )}
      data-testid="chat-input-container"
    >
      <div className="flex items-end gap-2 p-3">
        {/* Message Input */}
        <div className="flex-1 relative z-0">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholderText}
            className={cn(
              "text-[0.7rem] xs:text-sm",
              "resize-none border-0 shadow-none p-0",
              "bg-transparent placeholder:text-muted-foreground",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "min-h-[20px] max-h-[120px]"
            )}
            style={{ pointerEvents: 'auto' }} // Textarea için de explicit
            data-testid="message-input"
            disabled={isSending}
          />
        </div>

        {/* RGB LED Strip Effect Send Button - Thick Border */}
        <div className="shrink-0 relative z-20">
          {/* SVG Enhanced Glow Filter */}
          <svg className="absolute inset-0 w-0 h-0">
            <defs>
              <filter id="rgbGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMorphology operator="dilate" radius="1" result="dilated" />
                <feGaussianBlur in="dilated" stdDeviation="8" result="blur" />
                <feFlood floodColor="#ffffff" floodOpacity="0.3" result="whiteFlood" />
                <feComposite in="whiteFlood" in2="blur" operator="in" result="whiteGlow" />
                <feMerge>
                  <feMergeNode in="whiteGlow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          {/* Thick RGB Border Container - Slow & Minimal Pattern */}
          <motion.div
            className="relative"
            style={{
              '--angle': '0deg',
              padding: '4px', // Kalın border için
              borderRadius: '12px',
              background: (!message.trim() || isSending) ? 'transparent' : `
                linear-gradient(hsl(0 0% 8%) 0 0) content-box, 
                conic-gradient(
                  in hsl longer hue from var(--angle, 0deg),
                  hsl(0 100% 60% / 1) 0turn,
                  hsl(120 100% 60% / 1) 0.33turn,
                  hsl(240 100% 60% / 1) 0.67turn,
                  hsl(360 100% 60% / 1) 1turn
                )
              `,
              filter: (!message.trim() || isSending) ? 'none' : 'url(#rgbGlow) drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))',
              transition: 'opacity 0.3s ease',
              boxShadow: (!message.trim() || isSending) ? 'none' : `
                0 0 20px rgba(255, 255, 255, 0.2),
                0 0 40px rgba(255, 255, 255, 0.1),
                inset 0 0 20px rgba(255, 255, 255, 0.1)
              `
            } as React.CSSProperties}
            animate={(!message.trim() || isSending) ? {} : {
              '--angle': '360deg'
            }}
            transition={{
              duration: 8, // 3s → 8s (çok daha yavaş)
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            {/* Görünür Send Button */}
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSend();
              }}
              disabled={!message.trim() || isSending}
              className={cn(
                "relative p-2",
                "bg-accent text-accent-foreground",
                "hover:bg-accent/90 transition-colors duration-200",
                "active:bg-accent/75",
                "disabled:cursor-not-allowed disabled:opacity-70",
                "rounded-lg", // Border ile uyumlu radius
                "flex items-center justify-center",
                "w-[36px] h-[36px]", // Biraz daha büyük
                "shadow-lg" // Button'ın kendine shadow'u
              )}
              style={{
                cursor: (!message.trim() || isSending) ? 'not-allowed' : 'pointer',
                pointerEvents: 'auto',
                backgroundColor: (!message.trim() || isSending) ? 'hsl(var(--accent) / 0.5)' : 'hsl(var(--accent))',
                boxShadow: (!message.trim() || isSending) ? 'none' : `
                  0 4px 12px rgba(0, 0, 0, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              data-testid="send-button"
            >
              {isSending ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="h-4 w-4 drop-shadow-sm" />
              )}
              <span className="sr-only">{isSending ? 'Sending...' : 'Send message'}</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
      
      {/* Helper Text */}
      <div className="px-3 pb-2">
        <p className="text-[0.6rem] sm:text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}