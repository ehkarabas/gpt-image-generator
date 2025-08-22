"use client";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useConversations } from "@/contexts/conversation-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Clock, Edit2, MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";

interface ConversationItemProps {
  conversation: {
    id: string;
    title: string;
    message_count?: number;
    updated_at: string;
  };
  index: number;
}

export function ConversationItem({
  conversation,
  index,
}: ConversationItemProps) {
  const {
    activeConversation,
    switchConversation,
    deleteConversation,
    updateConversation,
  } = useConversations();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const isActive = activeConversation?.id === conversation.id;

  const handleClick = () => {
    if (!isEditing) switchConversation(conversation.id);
  };

  const handleSaveEdit = async () => {
    const next = editTitle.trim();
    if (next && next !== conversation.title) {
      await updateConversation(conversation.id, { title: next });
    }
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteConversation(conversation.id);
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  // Format time in a more readable way
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "group relative",
          "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
          "transition-all duration-200",
          "border border-transparent",
          isActive
            ? "bg-sidebar-accent border-sidebar-border shadow-sm shadow-orange-900/90 dark:shadow-orange-100/50"
            : "hover:bg-sidebar-accent/50 hover:border-sidebar-border/50",
        )}
        data-testid="conversation-item"
        data-conversation-id={conversation.id}
        data-conversation-index={index}
        data-active={isActive}
        role="listitem"
      >
        {/* Icon */}
        <MessageSquare
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50",
          )}
        />

        {/* Content */}
        <div
          className="flex-1 min-w-0"
          onClick={handleClick}
          data-testid="conversation-content"
        >
          {/* Title - Editable */}
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") {
                  setEditTitle(conversation.title);
                  setIsEditing(false);
                }
              }}
              className="
                w-full text-sm font-medium 
                bg-transparent border-none outline-none 
                focus:bg-sidebar-accent rounded px-1 py-0.5
                text-sidebar-accent-foreground
              "
              data-testid="conversation-title-input"
              aria-label="Edit conversation title"
              autoFocus
            />
          ) : (
            <div 
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <h3
                className={cn(
                  "text-sm font-medium transition-colors",
                  "line-clamp-1 break-all", // Text clamp system
                  isActive 
                    ? "text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground",
                )}
                data-testid="conversation-title"
                title={conversation.title} // Native tooltip for overflow
              >
                {conversation.title}
              </h3>

              {/* Enhanced Tooltip for long titles */}
              {showTooltip && conversation.title.length > 30 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="
                    absolute top-full left-0 z-50 mt-1
                    bg-popover text-popover-foreground
                    border border-border rounded-md shadow-lg
                    px-3 py-2 text-sm max-w-xs
                    pointer-events-none
                  "
                >
                  {conversation.title}
                </motion.div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "text-xs transition-colors",
                isActive 
                  ? "text-sidebar-primary/80" 
                  : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80",
              )}
              data-testid="conversation-message-count"
            >
              {conversation.message_count || 0} messages
            </span>
            
            <span className="text-xs text-sidebar-foreground/30">•</span>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-sidebar-foreground/40" />
              <time
                className={cn(
                  "text-xs transition-colors",
                  isActive 
                    ? "text-sidebar-primary/80" 
                    : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80",
                )}
                dateTime={conversation.updated_at}
                data-testid="conversation-timestamp"
                title={new Date(conversation.updated_at).toLocaleString()}
              >
                {formatTime(conversation.updated_at)}
              </time>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              "hover:bg-blend-overlay hover:text-sidebar-accent-foreground cursor-pointer transition-colors",
              isActive && "opacity-100",
            )}
            data-testid="conversation-menu-button"
            aria-label="Edit conversation title"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              "hover:bg-destructive/10 dark:hover:bg-slate-500 text-destructive hover:text-destructive cursor-pointer transition-colors",
              isActive && "opacity-100",
            )}
            data-testid="delete-conversation"
            aria-label="Delete conversation"
            disabled={isDeleting}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              handleDeleteClick();
            }}
          >
            <Trash2 className="h-3 w-3 dark:text-red-700" />
          </Button>
        </div>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="active-conversation"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sidebar-primary rounded-r-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.div>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${conversation.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </>
  );
}