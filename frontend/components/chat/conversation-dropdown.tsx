'use client';

import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConversations } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { 
  ChevronDown, 
  Edit, 
  MessageSquare, 
  MoreHorizontal,
  Trash2 
} from "lucide-react";
import { useState } from "react";

export function ConversationDropdown() {
  const { 
    conversations, 
    activeConversation, 
    switchConversation,
    renameConversation,
    deleteConversation
  } = useConversations();
  
  const [open, setOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const activeTitle = activeConversation?.title || 'Select conversation';

  const handleRename = async () => {
    if (!activeConversation || !renameValue.trim()) return;
    
    try {
      await renameConversation(activeConversation.id, renameValue.trim());
      setIsRenaming(false);
      setRenameValue('');
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
  };

  const handleDelete = async () => {
    if (!activeConversation) return;
    
    try {
      await deleteConversation(activeConversation.id);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const startRename = () => {
    setRenameValue(activeConversation?.title || '');
    setIsRenaming(true);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Conversation Selector */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-2 px-3 py-2",
              "text-foreground hover:bg-muted",
              "transition-all duration-200",
              "max-w-[200px] sm:max-w-[300px] cursor-pointer"
            )}
            data-testid="conversation-dropdown-trigger"
          >
            <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0" />
            
            {/* Editable Title or Display Title */}
            {isRenaming ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
                onBlur={handleRename}
                className={cn(
                  "bg-transparent border-none outline-none",
                  "text-sm font-medium min-w-0 flex-1",
                  "focus:bg-muted rounded px-1"
                )}
                autoFocus
                data-testid="conversation-rename-input"
              />
            ) : (
              <span 
                className={cn(
                  "truncate text-sm font-medium min-w-0 flex-1 text-left",
                  "sm:max-w-[180px] max-w-[120px]"
                )}
                data-testid="conversation-dropdown-title"
                title={activeTitle}
              >
                {activeTitle}
              </span>
            )}
            
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200 shrink-0 text-muted-foreground",
                open && "rotate-180"
              )}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          className="w-80 max-h-96"
          align="start"
          data-testid="conversation-dropdown-menu"
        >
          <div className="p-2 max-h-80 overflow-y-auto">
            <AnimatePresence>
              {conversations.map((conversation: { id: string; title: string; message_count?: number }, index: number) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                >
                  <DropdownMenuItem
                    onClick={() => {
                      switchConversation(conversation.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 cursor-pointer dropdown-item",
                      "hover:bg-muted focus:bg-muted",
                      activeConversation?.id === conversation.id && "bg-muted"
                    )}
                    data-testid="conversation-dropdown-option"
                    data-conversation-id={conversation.id}
                    data-active={activeConversation?.id === conversation.id}
                  >
                    <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p 
                        className="text-sm font-medium text-foreground truncate"
                        data-testid="conversation-option-title"
                      >
                        {conversation.title}
                      </p>
                      <p 
                        className="text-xs text-muted-foreground"
                        data-testid="conversation-option-count"
                      >
                        {conversation.message_count || 0} messages
                      </p>
                    </div>
                    {activeConversation?.id === conversation.id && (
                      <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                    )}
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Conversation Actions */}
      {activeConversation && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-2 text-muted-foreground hover:text-foreground",
                "hover:bg-muted transition-all duration-200 cursor-pointer"
              )}
              data-testid="conversation-actions-trigger"
              aria-label="Conversation actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent 
            align="end"
            className="w-48"
            data-testid="conversation-actions-menu"
          >
            <DropdownMenuItem 
              onClick={startRename}
              className="dropdown-item"
              data-testid="conversation-rename-action"
            >
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleDelete}
              className="dropdown-item destructive text-destructive focus:text-destructive"
              data-testid="conversation-delete-action"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}