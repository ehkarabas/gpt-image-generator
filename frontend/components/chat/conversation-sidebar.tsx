'use client';

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ConversationItem } from "@/components/chat/conversation-item";
import { useConversations } from "@/contexts/conversation-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Images, LogOut, MessageSquare, Plus, Search, Settings, X, User } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

type SidebarConversation = {
  id: string;
  title: string;
  message_count?: number;
  updated_at: string;
};

interface ConversationSidebarProps {
  onMobileClose?: () => void;
  isMobile?: boolean;
}

export function ConversationSidebar({ onMobileClose, isMobile = false }: ConversationSidebarProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchPlaceholder = "Search conversations...";
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const {
    conversations,
    createConversation,
    filteredConversations,
    isCreating,
  } = useConversations();

  const displayConversations: SidebarConversation[] = searchQuery
    ? (Array.isArray(filteredConversations(searchQuery)) ? filteredConversations(searchQuery) as SidebarConversation[] : [])
    : (Array.isArray(conversations) ? conversations as SidebarConversation[] : []);

  const handleLogout = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIsMenuOpen(false);
    setShowLogoutDialog(true);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    setShowLogoutDialog(false);
    try {
      // Clear all queries first
      await queryClient.cancelQueries();
      queryClient.clear();
      
      // Show toast notification
      toast.success("Successfully logged out");
      
      // Use useAuth hook's signOut method
      const result = await signOut();
      
      if (!result.success && result.error) {
        console.error('Failed to logout:', result.error);
        // Still try to redirect on error
        router.replace('/auth');
      }
    } catch (error) {
      console.error('Failed to logout:', error);
      // Still try to redirect on error
      router.replace('/auth');
    }
  }, [queryClient, signOut]);

  const handleLogoutCancel = useCallback(() => {
    setShowLogoutDialog(false);
  }, []);

  const handleSettings = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIsMenuOpen(false);
    
    let currentUserId = user?.id;
    
    // Fallback: Get current user directly from Supabase if useAuth is out of sync
    if (!currentUserId) {
      try {
        const { data: { user: currentUser } } = await createClient().auth.getUser();
        currentUserId = currentUser?.id;
      } catch (error) {
        console.error('Failed to get user from Supabase:', error);
      }
    }
    
    if (!currentUserId) {
      console.warn('No user ID found, cannot navigate to profile');
      return;
    }
    
    router.push(`/profile/${currentUserId}`);
  }, [user?.id]);

  const handleGallery = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIsMenuOpen(false);
    
    let currentUserId = user?.id;
    
    // Fallback: Get current user directly from Supabase if useAuth is out of sync
    if (!currentUserId) {
      try {
        const { data: { user: currentUser } } = await createClient().auth.getUser();
        currentUserId = currentUser?.id;
      } catch (error) {
        console.error('Failed to get user for gallery:', error);
        return;
      }
    }
    
    if (!currentUserId) return;
    router.push(`/profile/${currentUserId}/gallery`);
  }, [user?.id]);

  const handleNewConversation = useCallback(async () => {
    try {
      await createConversation();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  }, [createConversation]);

  return (
    <>
      <div className="w-full h-full flex flex-col bg-card border-r border-border">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0 px-3 py-4">
          <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="h-5 w-5 flex-shrink-0" />
                  <span className="text-lg font-semibold truncate">
                    Conversations
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewConversation}
                    disabled={isCreating}
                    className="flex-shrink-0 h-8 w-8"
                    data-testid="sidebar-new-chat-button"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {/* Mobile close button */}
                  {isMobile && onMobileClose && (
                    <Button
                      size="icon"
                      onClick={onMobileClose}
                      variant="ghost"
                      className="flex-shrink-0 h-8 w-8 hover:bg-accent"
                      data-testid="mobile-sidebar-close-header"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
          </div>
          
          <Separator className="mt-3" />
          
          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className={cn(
                "pl-9 pr-9 text-sm h-9",
                "bg-background border-input",
                "focus:ring-1 focus:ring-ring"
              )}
              data-testid="conversation-search"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
                data-testid="clear-search-button"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Conversation List - Scrollable flex-1 area */}
        <div className="flex-1 min-h-0 px-3 overflow-y-auto">
              {displayConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchQuery
                      ? "No conversations found"
                      : "No conversations yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {displayConversations.map(
                    (conversation: SidebarConversation, index: number) => (
                      <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          duration: 0.2, 
                          delay: Math.min(index * 0.05, 0.3) 
                        }}
                      >
                        <ConversationItem
                          conversation={conversation}
                          index={index}
                        />
                      </motion.div>
                    ),
                  )}
                </div>
              )}
        </div>

        {/* Footer - Fixed height */}
        <div className="flex-shrink-0 px-3 py-3">
          <Separator className="mb-3" />
          <div className="flex items-center justify-between">
                {/* Settings Dropdown - Left */}
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 hover:bg-accent"
                      data-testid="user-menu-trigger"
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    side="top" 
                    sideOffset={8}
                    className="w-48 z-50"
                  >
                    <DropdownMenuItem 
                      onSelect={handleGallery}
                      className="cursor-pointer hover:bg-accent focus:bg-accent"
                      data-testid="menu-gallery"
                    >
                      <Images className="mr-2 h-4 w-4" />
                      Gallery
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onSelect={handleSettings}
                      className="cursor-pointer hover:bg-accent focus:bg-accent"
                      data-testid="menu-profile"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onSelect={handleLogout}
                      className="cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 text-destructive"
                      data-testid="menu-logout"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Theme Toggle - Right */}
                <ThemeToggle 
                  size="icon"
                  className="h-9 w-9 hover:bg-accent"
                />
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showLogoutDialog}
        title="Logout Confirmation"
        message="Are you sure you want to logout? You will be redirected to the login page."
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}