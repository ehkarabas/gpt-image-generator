'use client'

import { useState } from 'react'
import { GalleryItem } from './gallery-item'
import { GalleryModal } from './gallery-modal'
import { useGallery } from '@/hooks/use-gallery'

export function GalleryGrid() {
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const { images, isLoading, error, deleteImage, refreshGallery } = useGallery()

  const handleImageDelete = (imageId: string) => {
    deleteImage(imageId)
    setSelectedImage(null)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
        <button
          onClick={refreshGallery}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Retry
        </button>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg mb-2">
          Henüz hiç görüntü oluşturmadınız
        </p>
        <p className="text-muted-foreground">
          Chat'te DALL-E ile görüntü oluşturarak galeri oluşturun
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((image) => (
          <GalleryItem
            key={image.id}
            image={image}
            onClick={() => setSelectedImage(image)}
          />
        ))}
      </div>

      {selectedImage && (
        <GalleryModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handleImageDelete}
        />
      )}
    </>
  )
}