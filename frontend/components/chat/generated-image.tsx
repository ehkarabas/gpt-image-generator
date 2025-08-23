'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, ExternalLink, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface GeneratedImageProps {
  imageUrl: string;
  alt?: string;
  className?: string;
  image?: {
    id: string;
    image_url: string;
    prompt: string;
    size: string;
    quality?: string;
    model?: string;
  };
  index?: number;
}

// Helper to check if URL is expired
function isUrlExpired(url: string): boolean {
  try {
    // Extract expiry time from DALL-E URL
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

export function GeneratedImage({ 
  imageUrl, 
  image, 
  index = 0,
  alt = "Generated image", 
  className = "" 
}: GeneratedImageProps) {
  // Use provided imageUrl or fall back to image.image_url
  const finalImageUrl = imageUrl || image?.image_url || '';
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Check if URL is expired on mount
    if (finalImageUrl && isUrlExpired(finalImageUrl)) {
      setIsExpired(true);
      setHasError(true);
      setIsLoading(false);
    }
  }, [finalImageUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setIsExpired(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    // Check if it's an expiry issue
    if (finalImageUrl && isUrlExpired(finalImageUrl)) {
      setIsExpired(true);
    }
  };

  const handleDownload = async () => {
    try {
      // For expired URLs, show alert
      if (isExpired) {
        alert('This image has expired and cannot be downloaded. Images are only available for an hour after generation.');
        return;
      }

      // Use proxy endpoint for DALL-E URLs to avoid CORS issues
      const downloadUrl = finalImageUrl.includes('oaidalleapiprodscus.blob.core.windows.net')
        ? `/api/proxy-image?url=${encodeURIComponent(finalImageUrl)}`
        : finalImageUrl;

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Use modern download approach without DOM manipulation
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${Date.now()}.png`;
      link.style.display = 'none';
      
      // Safer approach: avoid removeChild issues
      document.body.appendChild(link);
      link.click();
      
      // Cleanup after a delay to ensure download starts
      setTimeout(() => {
        try {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
          window.URL.revokeObjectURL(url);
        } catch (cleanupError) {
          console.warn('Download cleanup warning:', cleanupError);
        }
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. The image may have expired.');
    }
  };

  const handleOpenInNewTab = () => {
    if (isExpired) {
      alert('This image has expired. DALL-E images are only available for an hour after generation.');
      return;
    }
    window.open(finalImageUrl, '_blank');
  };

  if (hasError) {
    return (
      <Card className={`p-4 border-destructive ${className}`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <div className="text-sm font-medium">
              {isExpired ? 'Image expired' : 'Failed to load image'}
            </div>
          </div>
          {isExpired && (
            <div className="text-xs text-muted-foreground">
              DALL-E images expire after an hour. To preserve images, download them when they're generated.
            </div>
          )}
          {image?.prompt && (
            <div className="mt-2 p-2 bg-muted rounded text-xs">
              <span className="font-medium">Original prompt:</span> {image.prompt}
            </div>
          )}
          {!isExpired && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(finalImageUrl, '_blank')}
              className="mt-2"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Try opening in new tab
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      
      <div className="relative group">
        <Image
          src={finalImageUrl.includes('oaidalleapiprodscus.blob.core.windows.net') && !isExpired
            ? `/api/proxy-image?url=${encodeURIComponent(finalImageUrl)}`
            : finalImageUrl
          }
          alt={alt}
          width={1024}
          height={1024}
          className="w-full h-auto rounded-lg"
          onLoad={handleImageLoad}
          onError={handleImageError}
          priority
          unoptimized // Bypass Next.js image optimization for external URLs
        />
        
        {/* Action buttons overlay */}
        {!hasError && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
              title="Download image"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenInNewTab}
              className="h-8 w-8 p-0"
              title="Open in new tab"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Image info footer */}
      <div className="p-2 bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
        <span>Generated with DALL-E 3</span>
        {!hasError && (
          <span className="text-orange-600 dark:text-orange-400">
            ⚠️ Expires in an hour
          </span>
        )}
      </div>
    </Card>
  );
}