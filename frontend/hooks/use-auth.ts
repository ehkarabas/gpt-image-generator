'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export interface Profile {
	user_id: string
	display_name?: string
	avatar_url?: string
	created_at: string
	updated_at?: string
}

export interface UseAuthReturn {
	user: User | null
	session: Session | null
	profile: Profile | null
	isLoading: boolean
	isAuthenticated: boolean
	error: AuthError | null
	signIn: (email: string, password: string) => Promise<void>
	signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>
	signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<void>
	signOut: () => Promise<void>
	updateProfile: (updates: Partial<Omit<Profile, 'user_id' | 'created_at'>>) => Promise<void>
	clearError: () => void
}

export function useAuth(): UseAuthReturn {
	const [user, setUser] = useState<User | null>(null)
	const [session, setSession] = useState<Session | null>(null)
	const [profile, setProfile] = useState<Profile | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<AuthError | null>(null)

	const isAuthenticated = !!user && !!session

	const clearError = useCallback(() => {
		setError(null)
	}, [])

	const loadProfile = useCallback(async (userId: string) => {
		try {
			const { data, error } = await supabase
				.from('profiles')
				.select('*')
				.eq('user_id', userId)
				.single()

			if (error) {
				// If profile doesn't exist, create one
				if ((error as any).code === 'PGRST116') {
					const newProfile = {
						user_id: userId,
						display_name: (user as any)?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User',
						avatar_url: (user as any)?.user_metadata?.avatar_url || null,
						created_at: new Date().toISOString()
					}

					const { data: createdProfile, error: createError } = await supabase
						.from('profiles')
						.insert(newProfile)
						.select()
						.single()

					if (createError) {
						console.error('Error creating profile:', createError)
					} else {
						setProfile(createdProfile as any)
					}
				} else {
					console.error('Error loading profile:', error)
				}
			} else {
				setProfile(data as any)
			}
		} catch (err) {
			console.error('Profile load error:', err)
		}
	}, [user])

	const handleAuthStateChange = useCallback(async (_event: string, session: Session | null) => {
		setSession(session)
		setUser(session?.user ?? null)

		if (session?.user) {
			await loadProfile(session.user.id)
		} else {
			setProfile(null)
		}

		setIsLoading(false)
	}, [loadProfile])

	useEffect(() => {
		// Get initial session
		const getInitialSession = async () => {
			const { data: { session }, error } = await supabase.auth.getSession()
			if (error) {
				console.error('Error getting session:', error)
				setError(error)
			}
			await handleAuthStateChange('INITIAL_SESSION', session)
		}

		getInitialSession()

		// Listen for auth changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

		return () => subscription.unsubscribe()
	}, [handleAuthStateChange])

	const signIn = useCallback(async (email: string, password: string) => {
		try {
			setIsLoading(true)
			setError(null)

			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			})

			if (error) {
				setError(error)
				return
			}
		} catch (err) {
			console.error('Sign in error:', err)
		} finally {
			setIsLoading(false)
		}
	}, [])

	const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
		try {
			setIsLoading(true)
			setError(null)

			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: metadata || {}
				}
			})

			if (error) {
				setError(error)
				return
			}

			// Ensure profile exists after sign up using returned user if available
			if (data?.user) {
				await loadProfile(data.user.id)
			} else {
				const { data: sessionData } = await supabase.auth.getSession()
				if (sessionData?.session?.user) {
					await loadProfile(sessionData.session.user.id)
				}
			}
		} catch (err) {
			console.error('Sign up error:', err)
		} finally {
			setIsLoading(false)
		}
	}, [loadProfile])

	const signInWithOAuth = useCallback(async (provider: 'google' | 'github' | 'discord') => {
		try {
			setError(null)

			const { error } = await supabase.auth.signInWithOAuth({
				provider,
				options: {
					redirectTo: `${window.location.origin}/auth/callback`
				}
			})

			if (error) {
				setError(error)
				return
			}

			// OAuth will redirect
		} catch (err) {
			console.error('OAuth sign in error:', err)
		}
	}, [])

	const signOut = useCallback(async () => {
		try {
			setError(null)

			const { error } = await supabase.auth.signOut()

			if (error) {
				setError(error)
				return
			}
		} catch (err) {
			console.error('Sign out error:', err)
		}
	}, [])

	const updateProfile = useCallback(async (updates: Partial<Omit<Profile, 'user_id' | 'created_at'>>) => {
		if (!user) {
			throw new Error('No authenticated user')
		}

		try {
			setError(null)

			const { data, error } = await supabase
				.from('profiles')
				.update({
					...updates,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', user.id)
				.select()
				.single()

			if (error) {
				setError(error as AuthError)
				return
			}

			setProfile(data as any)
		} catch (err) {
			console.error('Profile update error:', err)
		}
	}, [user])

	return {
		user,
		session,
		profile,
		isLoading,
		isAuthenticated,
		error,
		signIn,
		signUp,
		signInWithOAuth,
		signOut,
		updateProfile,
		clearError,
	}
}


