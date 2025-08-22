'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Images, Download, Trash2, Maximize2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Card } from '@/components/ui/card';

interface GalleryImage {
  id: string;
  prompt: string;
  image_data?: string;
  image_url?: string;
  created_at: string;
}

// Helper to check if URL is expired
function isUrlExpired(url: string): boolean {
  if (!url || !url.includes('oaidalleapiprodscus')) return false;

  try {
    const urlObj = new URL(url);
    const seParam = urlObj.searchParams.get('se');
    if (seParam) {
      const expiryDate = new Date(decodeURIComponent(seParam));
      return new Date() > expiryDate;
    }
  } catch (error) {
    console.error('Error parsing URL:', error);
  }
  return false;
}

export default function UserGalleryPage() {
  // console.log('UserGalleryPage component rendered');
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  // console.log('Params:', params, 'UserId:', userId);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false); // Start with false
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);

  useEffect(() => {
    // console.log('Gallery useEffect triggered, userId:', userId);
    
    if (!userId) {
      // console.log('No userId found');
      setError('User ID not found');
      return;
    }

    const loadImages = async () => {
      // console.log('loadImages function called');
      setLoading(true); // Set loading to true when starting fetch

      try {
        // console.log('Starting to fetch images for user:', userId);
        setError(null);
        const supabase = createClient();
        
        // First verify the user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        // console.log('Auth check result:', { user: user?.id, authError });
        
        if (authError || !user) {
          // console.error('Auth error:', authError);
          setError('Authentication required');
          setLoading(false); 
          router.push('/auth');
          return;
        }
        
        // Get user's images that are not soft deleted
        // console.log('Fetching images from database...');
        const { data, error: fetchError } = await supabase
          .from('images')
          .select('id, prompt, image_data, image_url, created_at')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // console.log('Database query result:', { data, fetchError });

        if (fetchError) {
          console.error('Error loading images:', fetchError);
          setError('Failed to load images. Please try again.');
          setLoading(false);
          return;
        }

        // console.log('Setting images:', data?.length || 0, 'images');
        setImages(data || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load gallery:', err);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    loadImages();
  }, [userId]);

  const handleBackToChat = () => {
    router.push('/');
  };

  const handleDownload = async (image: GalleryImage) => {
    try {
      const imageUrl = image.image_url || (image.image_data ? `data:image/png;base64,${image.image_data}` : '');
      if (!imageUrl) {
        console.error('No image URL available');
        alert('This image cannot be downloaded');
        return;
      }

      // Check if URL is expired
      if (imageUrl.startsWith('http') && isUrlExpired(imageUrl)) {
        alert('This image has expired. DALL-E images are only available for an hour after generation.');
        return;
      }

      if (imageUrl.startsWith('http')) {
        // Use proxy endpoint for DALL-E URLs to avoid CORS issues
        const downloadUrl = imageUrl.includes('oaidalleapiprodscus.blob.core.windows.net')
          ? `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
          : imageUrl;

        // Download from external URL
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Failed to fetch image');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `image-${image.id.slice(0, 8)}.png`;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. It may have expired.');
    }
  };

  const handleDelete = async () => {
    if (!deleteImageId) return;

    try {
      const supabase = createClient();

      // Soft delete the image
      const { error } = await supabase
        .from('images')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteImageId);

      if (error) {
        console.error('Error deleting image:', error);
        alert('Failed to delete image');
        return;
      }

      // Update local state
      setImages(prev => prev.filter(img => img.id !== deleteImageId));
      setDeleteImageId(null);

      // Close preview if deleting the selected image
      if (selectedImage?.id === deleteImageId) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image');
    }
  };

  const getImageSrc = (image: GalleryImage) => {
    const url = image.image_url || (image.image_data ? `data:image/png;base64,${image.image_data}` : '');
    if (!url) return '/placeholder.svg';

    // Check if DALL-E URL is expired
    if (url.includes('oaidalleapiprodscus') && isUrlExpired(url)) {
      return '/placeholder.svg';
    }

    // Use proxy endpoint for DALL-E URLs to avoid CORS issues
    if (url.includes('oaidalleapiprodscus.blob.core.windows.net')) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }

    return url;
  };


  return (
    <div className="!h-screen !w-screen overflow-y-auto scroll-smooth scrollbar-hide bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToChat}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>

            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">My Gallery</h1>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Images className="w-4 h-4 text-primary" />
              </div>
            </div>

            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading your gallery...</p>
          </div>
        ) : error ? (
          <Card className="p-8 text-center max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Gallery</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={loadImages} variant="outline">
                Try Again
              </Button>
              <Button onClick={handleBackToChat}>
                Back to Chat
              </Button>
            </div>
          </Card>
        ) : images.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Images className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your Gallery is Empty</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start a conversation and create some images to build your gallery.
            </p>
            <Button onClick={handleBackToChat}>
              Start Creating Images
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {images.length} {images.length === 1 ? 'image' : 'images'} in your gallery
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {images.map((image, index) => {
                  const imageSrc = getImageSrc(image);
                  const isExpired = imageSrc === '/placeholder.svg' && image.image_url?.includes('oaidalleapiprodscus');

                  return (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                      className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all"
                    >
                      <div
                        className="aspect-square relative cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={imageSrc}
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />

                        {isExpired && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="text-center text-white p-4">
                              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">Image Expired</p>
                            </div>
                          </div>
                        )}

                        {/* Overlay with actions */}
                        {!isExpired && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(image);
                              }}
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(image);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteImageId(image.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Prompt preview */}
                      <div className="p-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {image.prompt}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(image.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <img
                  src={getImageSrc(selectedImage)}
                  alt={selectedImage.prompt}
                  className="w-full h-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                {getImageSrc(selectedImage) === '/placeholder.svg' && selectedImage.image_url?.includes('oaidalleapiprodscus') && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-lg font-semibold">Image Expired</p>
                      <p className="text-sm mt-2">DALL-E images are only available for an hour</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Prompt:</p>
                <p className="text-sm text-muted-foreground">{selectedImage.prompt}</p>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(selectedImage.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload(selectedImage)}
                  className="flex-1"
                  disabled={getImageSrc(selectedImage) === '/placeholder.svg'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteImageId(selectedImage.id);
                    setSelectedImage(null);
                  }}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteImageId}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteImageId(null)}
      />
    </div>
  );
}







