'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Image {
  id: string
  prompt: string
  imageData: string
  createdAt: string
  dalleResponseMetadata?: any
}

async function fetchUserGallery(): Promise<Image[]> {
  const supabase = createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Authentication required')
  }

  // Fetch user's images
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch gallery: ${error.message}`)
  }

  return data || []
}

async function deleteImage(imageId: string): Promise<void> {
  const supabase = createClient()
  
  // Delete image from database
  const { error } = await supabase
    .from('images')
    .delete()
    .eq('id', imageId)

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`)
  }

  // Update user gallery array (remove deleted image ID)
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gallery')
      .eq('id', user.id)
      .single()

    if (profile?.gallery) {
      const updatedGallery = profile.gallery.filter((id: string) => id !== imageId)
      await supabase
        .from('profiles')
        .update({ gallery: updatedGallery })
        .eq('id', user.id)
    }
  }
}

export function useGallery() {
  const queryClient = useQueryClient()

  // Fetch gallery images
  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ['gallery'],
    queryFn: fetchUserGallery,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: deleteImage,
    onMutate: async (imageId) => {
      // Cancel outgoing gallery queries
      await queryClient.cancelQueries({ queryKey: ['gallery'] })

      // Get current gallery data
      const previousImages = queryClient.getQueryData(['gallery']) || []

      // Optimistically remove image from gallery
      queryClient.setQueryData(['gallery'], (old: Image[]) => {
        return (old || []).filter(img => img.id !== imageId)
      })

      return { previousImages }
    },
    onSuccess: (_, imageId) => {
      toast.success('Görüntü silindi')
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
    onError: (error, _, context) => {
      // Revert optimistic update on error
      if (context?.previousImages) {
        queryClient.setQueryData(['gallery'], context.previousImages)
      }

      toast.error('Görüntü silinemedi', {
        description: error.message || 'Bilinmeyen bir hata oluştu',
      })
    },
  })

  // Refresh gallery data
  const refreshGallery = () => {
    queryClient.invalidateQueries({ queryKey: ['gallery'] })
  }

  return {
    images,
    isLoading,
    error,
    deleteImage: deleteImageMutation.mutate,
    deleteImageAsync: deleteImageMutation.mutateAsync,
    isDeleting: deleteImageMutation.isPending,
    refreshGallery,
  }
}