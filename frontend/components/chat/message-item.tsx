"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { GeneratedImage } from "./generated-image";

interface MessageItemProps {
  message: {
    id: string;
    content: string;
    role: "user" | "assistant";
    created_at: string;
    user?: {
      display_name?: string;
      avatar_url?: string;
    };
    images?: Array<{
      id: string;
      image_url: string;
      prompt: string;
      size: string;
      quality?: string;
      model?: string;
    }>;
  };
  index: number;
  "data-testid"?: string;
}

function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    // Use a stable timezone to avoid SSR/CSR mismatches
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }).format(date);
  } catch {
    return "Now";
  }
}

export function MessageItem({
  message,
  index,
  "data-testid": dataTestId,
}: MessageItemProps) {
  const isUser = message.role === "user";
  const hasImages = message.images && message.images.length > 0;

  return (
    <div
      className={cn(
        "flex gap-4 group",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
      data-testid={dataTestId || `message-${message.role}`}
      data-message-id={message.id}
      data-message-index={index}
      role="article"
      aria-label={`${isUser ? "User" : "Assistant"} message`}
    >
      {/* Avatar */}
      <Avatar
        className="h-8 w-8 shrink-0 mt-1"
        data-testid={`avatar-${message.role}`}
      >
        {isUser ? (
          <>
            <AvatarImage src={message.user?.avatar_url} alt="User avatar" />
            <AvatarFallback className="bg-blue-600 text-white text-sm">
              {message.user?.display_name?.[0] || "U"}
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="/ai-avatar.png" alt="AI assistant avatar" />
            <AvatarFallback className="bg-black text-white text-sm">
              ⚡
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* Message Content */}
      <div
        className={cn(
          "flex-1 max-w-[70%] space-y-2",
          isUser ? "items-end" : "items-start",
        )}
      >
        {/* Text Message */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm",
          )}
          data-testid={`message-content-${message.role}`}
        >
          <p>{message.content}</p>
        </div>

        {/* Generated Images */}
        {hasImages && (
          <div className="space-y-3" data-testid="message-images">
            {message.images?.map((image, imageIndex) => (
              <GeneratedImage key={image.id} image={image} index={imageIndex} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            "text-xs text-gray-500 px-1",
            isUser ? "text-right" : "text-left",
          )}
        >
          <time
            dateTime={message.created_at}
            data-testid={`message-timestamp-${message.role}`}
          >
            {formatTime(message.created_at)}
          </time>
        </div>
      </div>
    </div>
  );
}
