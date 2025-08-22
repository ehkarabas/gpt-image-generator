// frontend/hooks/use-auth.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Session, AuthError, AuthEvent } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export interface Profile {
  id: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface PasswordResetData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPasswordRecovery: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>,
  ) => Promise<{ success: boolean; error?: AuthError }>;
  signInWithOAuth: (provider: "google" | "github" | "discord") => Promise<{ success: boolean; error?: AuthError }>;
  signOut: () => Promise<{ success: boolean; error?: AuthError }>;
  updateProfile: (
    updates: Partial<Omit<Profile, "user_id" | "created_at">>,
  ) => Promise<{ success: boolean; error?: Error }>;
  // Password Reset Methods
  resetPasswordForEmail: (email: string, redirectTo?: string) => Promise<{ success: boolean; error?: AuthError }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: AuthError }>;
  resendResetEmail: (email: string, redirectTo?: string) => Promise<{ success: boolean; error?: AuthError }>;
  clearError: () => void;
  setPasswordRecoveryMode: (isRecovery: boolean) => void;
}

export function useAuth(): UseAuthReturn {
  // Initialize state from localStorage if available (client-side only)
  const getInitialUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem('auth_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState<User | null>(getInitialUser());
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const router = useRouter();
  const isAuthenticated = !!user && !!session;

  const supabase = createClient();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setPasswordRecoveryMode = useCallback((isRecovery: boolean) => {
    setIsPasswordRecovery(isRecovery);
  }, []);

  const loadProfile = useCallback(
    async (userId: string, currentUser?: User) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          // Profile yoksa yeni bir tane create et
          if ((error as any).code === "PGRST116") {
            const newProfile = {
              id: userId,
              name:
                (currentUser as any)?.user_metadata?.display_name ||
                currentUser?.email?.split("@")[0] ||
                "User",
              avatar_url: (currentUser as any)?.user_metadata?.avatar_url || null,
              created_at: new Date().toISOString(),
            };

            const { data: createdProfile, error: createError } = await supabase
              .from("profiles")
              .insert(newProfile)
              .select()
              .single();

            if (createError) {
              console.error("Profile create error:", createError);
            } else {
              setProfile(createdProfile as Profile);
            }
          } else {
            console.error("Profile load error:", error);
          }
        } else {
          setProfile(data as Profile);
        }
      } catch (err) {
        console.error("Profile load error:", err);
      }
    },
    [], // Remove user dependency to break infinite loop
  );

  const handleAuthStateChange = useCallback(
    async (event: AuthEvent, session: Session | null) => {
      console.log("Auth state change:", event, session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Cache user in sessionStorage for state persistence
      if (typeof window !== 'undefined') {
        if (session?.user) {
          sessionStorage.setItem('auth_user', JSON.stringify(session.user));
        } else {
          sessionStorage.removeItem('auth_user');
        }
      }

      // Password recovery event handling
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
        console.log("Password recovery mode activated");
      } else if (event === "SIGNED_IN" && !isPasswordRecovery) {
        setIsPasswordRecovery(false);
      }

      if (session?.user) {
        await loadProfile(session.user.id, session.user);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    },
    [loadProfile], // Remove isPasswordRecovery dependency
  );

  useEffect(() => {
    // Initial session get et
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
          setError(error);
        }
        
        await handleAuthStateChange("INITIAL_SESSION" as AuthEvent, session);
      } catch (err) {
        console.error("Initial session error:", err);
        setError(err as Error);
      }
    };

    getInitialSession();

    // Auth changes'leri listen et
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription.unsubscribe();
  }, [handleAuthStateChange]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error);
        return { success: false, error };
      }

      return { success: true };
    } catch (err) {
      console.error("Sign in error:", err);
      const error = err as AuthError;
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, metadata?: Record<string, any>) => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata || {},
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          setError(error);
          return { success: false, error };
        }

        // Profile create et
        if (data?.user) {
          await loadProfile(data.user.id, data.user);
        }

        return { success: true };
      } catch (err) {
        console.error("Sign up error:", err);
        const error = err as AuthError;
        setError(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [loadProfile],
  );

  const signInWithOAuth = useCallback(
    async (provider: "google" | "github" | "discord") => {
      try {
        setError(null);

        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          setError(error);
          return { success: false, error };
        }

        return { success: true };
      } catch (err) {
        console.error("OAuth sign in error:", err);
        const error = err as AuthError;
        setError(error);
        return { success: false, error };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      setError(null);
      setIsPasswordRecovery(false);

      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error);
        return { success: false, error };
      }

      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);

      // Redirect to auth page
      router.push('/auth');

      return { success: true };
    } catch (err) {
      console.error("Sign out error:", err);
      const error = err as AuthError;
      setError(error);
      return { success: false, error };
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Omit<Profile, "id" | "created_at">>) => {
      if (!user) {
        const error = new Error("No authenticated user");
        setError(error);
        return { success: false, error };
      }

      try {
        setError(null);

        const { data, error } = await supabase
          .from("profiles")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          setError(error);
          return { success: false, error };
        }

        setProfile(data as Profile);
        return { success: true };
      } catch (err) {
        console.error("Profile update error:", err);
        const error = err as Error;
        setError(error);
        return { success: false, error };
      }
    },
    [user],
  );

  // Password Reset Methods
  const resetPasswordForEmail = useCallback(
    async (email: string, redirectTo?: string) => {
      try {
        setError(null);
        setIsLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectTo || `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
          setError(error);
          return { success: false, error };
        }

        return { success: true };
      } catch (err) {
        console.error("Reset password email error:", err);
        const error = err as AuthError;
        setError(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      try {
        setError(null);
        setIsLoading(true);

        // Password validation
        if (newPassword.length < 6) {
          const error = new Error("Password must be at least 6 characters long") as AuthError;
          setError(error);
          return { success: false, error };
        }

        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) {
          setError(error);
          return { success: false, error };
        }

        // Password update başarılı olunca recovery mode'dan çık
        setIsPasswordRecovery(false);
        
        // Ana sayfaya redirect et
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1500);

        return { success: true };
      } catch (err) {
        console.error("Update password error:", err);
        const error = err as AuthError;
        setError(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const resendResetEmail = useCallback(
    async (email: string, redirectTo?: string) => {
      return await resetPasswordForEmail(email, redirectTo);
    },
    [resetPasswordForEmail],
  );

  return {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    isPasswordRecovery,
    error,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    updateProfile,
    resetPasswordForEmail,
    updatePassword,
    resendResetEmail,
    clearError,
    setPasswordRecoveryMode,
  };
}