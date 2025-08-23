'use client';

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getProfile, updateProfile, softDeleteProfile } from "@/lib/services/profile-service";
import type { Profile } from "@/lib/types/database";
import { useSignOutMutation } from "@/hooks/useQueries/useAuthQuery";

interface ProfileSettingsProps {
  userId: string;
}

/**
 * Profile Settings Component with Soft Delete Support
 * Features:
 * 1. Name Change with validation
 * 2. Account Deletion with soft delete mechanism
 * 3. Toast notifications for success/error states
 * 4. Responsive design with simple layout
 * 5. Integrated with profile service API
 */
export function ProfileSettings({ userId }: ProfileSettingsProps) {
  const router = useRouter();
  const signOutMutation = useSignOutMutation();

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Validation
  const isNameValid = editName.trim().length >= 2 && editName.trim().length <= 50;
  const hasNameChanged = userProfile ? editName.trim() !== userProfile.display_name : false;

  // Load profile on mount - no need to wait for auth since middleware already verified
  useEffect(() => {
    console.log('🔄 Loading profile for userId:', userId);

    const loadUserProfile = async () => {

      try {
        setIsLoading(true);
        console.log('📡 Calling getProfile with userId:', userId);
        const response = await getProfile(userId);
        console.log('📡 getProfile response:', response);

        if (response.data) {
          console.log('✅ Profile data received:', response.data);
          setUserProfile(response.data);
          setEditName(response.data.display_name);
          console.log('🎉 Profile loaded successfully');
        } else {
          console.error('❌ Profile load failed:', response.error);
          console.error('🔍 Full response object:', response);

          // More specific error messages
          let errorMessage = 'Please try refreshing the page.';
          if (response.error?.includes('not found')) {
            errorMessage = 'Profile not found. It may have been deleted.';
          } else if (response.error?.includes('Database error')) {
            errorMessage = 'Database connection issue. Please try again.';
          } else if (response.error?.includes('Unauthorized')) {
            errorMessage = 'Authentication required. Please log in again.';
          }

          toast.error('Failed to load profile', {
            description: response.error || errorMessage
          });
        }
      } catch (error) {
        console.error('❌ Profile load error:', error);
        console.error('🔍 Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });

        toast.error('Failed to load profile', {
          description: error.message || 'An unexpected error occurred. Please try refreshing the page.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [userId]); // Only depend on userId

  const handleBackClick = () => {
    router.back();
  };

  const handleEditToggle = () => {
    if (isEditing && userProfile) {
      setEditName(userProfile.display_name); // Reset to original
    }
    setIsEditing(!isEditing);
  };

  const handleSaveName = async () => {
    if (!isNameValid || !hasNameChanged || !userProfile) return;

    setIsSaving(true);
    try {
      const response = await updateProfile(userId, { display_name: editName.trim() });

      if (response.data) {
        // Update local state with response data
        setUserProfile(response.data);
        setIsEditing(false);

        // Success toast
        toast.success("Profile updated successfully", {
          description: response.message || "Your name has been updated.",
        });
      } else {
        // Error toast
        toast.error("Failed to update profile", {
          description: response.error || "Please try again later.",
        });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error("Failed to update profile", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await softDeleteProfile(userId);

      if (response.error) {
        // Error toast
        toast.error("Failed to delete account", {
          description: response.error,
        });
        setIsDeleting(false);
      } else {
        // Success toast before logout and redirect
        toast.success("Account successfully deleted", {
          description: response.message || "You will be redirected to the login page.",
        });

        // Logout user and redirect after delay to show toast
        setTimeout(() => {
          signOutMutation.mutate(undefined, {
            onSuccess: () => {
              router.push('/auth');
            },
            onError: () => {
              // Force redirect even if logout fails
              router.push('/auth');
            }
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error("Failed to delete account", {
        description: "An unexpected error occurred.",
      });
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Profile not found
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Profile Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            The requested profile could not be loaded.
          </p>
          <Button onClick={handleBackClick} className="cursor-pointer">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Container - Full Screen Centered */}
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">

        {/* Content Container - Mobile Responsive */}
        <div className="w-full max-w-2xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 relative"
          >
            <div className="flex justify-between items-center">
              {/* Back Button - Absolute positioned */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                data-testid="back-button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {/* Header - Centered */}
              <div className="flex items-center justify-center space-x-3">
                <h1 className="text-xl font-semibold text-foreground hidden sm:block">
                  Profile Settings
                </h1>
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>
            {/* Profile Information Card */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-foreground mb-4">
                    Profile Information
                  </h2>

                  {/* Name Field */}
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      Display Name
                    </Label>

                    <div className="flex items-center space-x-3">
                      {isEditing ? (
                        <Input
                          id="name"
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Enter your name"
                          className={cn(
                            "flex-1",
                            !isNameValid && editName.trim().length > 0 && "border-destructive"
                          )}
                          disabled={isSaving}
                          autoFocus
                          data-testid="name-input"
                        />
                      ) : (
                        <div className="flex-1 py-2 px-3 bg-muted rounded-md text-foreground">
                          {userProfile.display_name}
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleSaveName}
                              disabled={!isNameValid || !hasNameChanged || isSaving}
                              className="cursor-pointer"
                              data-testid="save-name-button"
                            >
                              {isSaving ? (
                                <>
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-3 h-3 border border-current border-t-transparent rounded-full mr-2"
                                  />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-3 w-3 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleEditToggle}
                              disabled={isSaving}
                              className="cursor-pointer"
                              data-testid="cancel-edit-button"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditToggle}
                            className="cursor-pointer"
                            data-testid="edit-name-button"
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Name Validation */}
                    {isEditing && editName.trim().length > 0 && !isNameValid && (
                      <p className="text-sm text-destructive">
                        Name must be between 2 and 50 characters
                      </p>
                    )}
                  </div>

                  {/* Email Field (Read-only) */}
                  <div className="space-y-3 mt-6">
                    <Label className="text-sm font-medium text-foreground">
                      Email Address
                    </Label>
                    <div className="py-2 px-3 bg-muted rounded-md text-muted-foreground">
                      {userProfile.email}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed at this time
                    </p>
                  </div>

                  {/* Account Info */}
                  <div className="space-y-3 mt-6">
                    <Label className="text-sm font-medium text-foreground">
                      Member Since
                    </Label>
                    <div className="py-2 px-3 bg-muted rounded-md text-muted-foreground">
                      {new Date(userProfile.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-card border border-destructive/20 rounded-lg p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium text-destructive mb-2">
                    Danger Zone
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="cursor-pointer"
                  data-testid="delete-account-button"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Account"
        message={`Are you sure you want to delete your account? This will permanently remove all your conversations and data. This action cannot be undone.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </>
  );
}