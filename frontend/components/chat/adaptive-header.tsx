"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Settings, 
  Sun, 
  Moon, 
  LogOut, 
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useConversations } from "@/hooks/use-conversations";
import { createClient } from "@/lib/supabase/client";

interface AdaptiveHeaderProps {
  showDropdown?: boolean;
  showSidebar?: boolean;
  isMobile?: boolean;
  onMobileMenuClick?: () => void;
  isGalleryMode?: boolean;
}

export function AdaptiveHeader({ 
  showDropdown = true,
  showSidebar = true,
  isMobile = false,
  onMobileMenuClick,
  isGalleryMode = false 
}: AdaptiveHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    activeConversation,
    createConversation,
    renameConversation,
    deleteConversation,
    isCreating,
  } = useConversations();

  const handleNewConversation = useCallback(async () => {
    setIsLoading(true);
    try {
      await createConversation();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [createConversation]);

  const handleRenameClick = useCallback(() => {
    if (activeConversation) {
      setNewTitle(activeConversation.title);
      setShowRenameDialog(true);
    }
  }, [activeConversation]);

  const handleRenameConfirm = useCallback(async () => {
    if (activeConversation && newTitle.trim() && newTitle.trim() !== activeConversation.title) {
      setIsLoading(true);
      try {
        await renameConversation(activeConversation.id, newTitle.trim());
        setShowRenameDialog(false);
      } catch (error) {
        console.error('Failed to rename conversation:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setShowRenameDialog(false);
    }
  }, [activeConversation, newTitle, renameConversation]);

  const handleDelete = useCallback(async () => {
    if (activeConversation) {
      setIsLoading(true);
      try {
        await deleteConversation(activeConversation.id);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [activeConversation, deleteConversation]);

  const handleLogout = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIsMenuOpen(false);
    setShowLogoutDialog(true);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    setShowLogoutDialog(false);
    setIsLoading(true);
    try {
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
    } finally {
      setIsLoading(false);
    }
  }, [signOut]);

  const handleLogoutCancel = useCallback(() => {
    setShowLogoutDialog(false);
  }, []);

  const handleThemeToggle = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <>
      {!isGalleryMode ? (
        <header className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Mobile'da overlay menu, desktop'ta sidebar toggle */}
            {isMobile && onMobileMenuClick ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMobileMenuClick}
                className="cursor-pointer hover:bg-accent/80 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </Button>
            ) : (
              <SidebarTrigger className="cursor-pointer hover:bg-accent/80 transition-colors" />
            )}
            
            {/* Conversation Controls */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline truncate max-w-[200px]">
                    {activeConversation?.title || 'New Conversation'}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px] z-50">
                <DropdownMenuItem 
                  onSelect={handleNewConversation} 
                  disabled={isCreating || isLoading} 
                  className="cursor-pointer hover:bg-accent/80 focus:bg-accent/80 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Conversation
                </DropdownMenuItem>
                {activeConversation && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onSelect={handleRenameClick} 
                      disabled={isLoading} 
                      className="cursor-pointer hover:bg-accent/80 focus:bg-accent/80 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onSelect={handleDelete} 
                      disabled={isLoading}
                      className="text-destructive focus:text-destructive cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Settings Menu */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isLoading}>
                <Settings className="!h-6 !w-6" />
                <span className="sr-only">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" sideOffset={8} alignOffset={-10} className="w-[180px] z-50">
              <DropdownMenuItem 
                onSelect={handleThemeToggle}
                className="cursor-pointer hover:bg-accent/80 focus:bg-accent/80"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 mr-2" />
                ) : (
                  <Moon className="h-4 w-4 mr-2" />
                )}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onSelect={handleLogout} 
                disabled={isLoading}
                className="cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
      ) : (
        /* Gallery Mode - Only Theme Toggle */
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isLoading}>
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" sideOffset={8} alignOffset={-10} className="w-[180px] z-50">
            <DropdownMenuItem 
              onSelect={handleThemeToggle}
              className="cursor-pointer hover:bg-accent/80 focus:bg-accent/80"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 mr-2" />
              ) : (
                <Moon className="h-4 w-4 mr-2" />
              )}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onSelect={handleLogout} 
              disabled={isLoading}
              className="cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameConfirm();
                  }
                }}
                placeholder="Enter conversation title"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showLogoutDialog}
        title="Logout Confirmation"
        message="Are you sure you want to logout? You will be redirected to the login page."
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        isLoading={isLoading}
      />
    </>
  );
}