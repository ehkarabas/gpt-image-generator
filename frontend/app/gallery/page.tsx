'use client'

import { Suspense } from 'react'
import { GalleryGrid } from '@/components/gallery/gallery-grid'
import { GalleryHeader } from '@/components/gallery/gallery-header'
import { GallerySkeleton } from '@/components/gallery/gallery-skeleton'

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <GalleryHeader />
        <Suspense fallback={<GallerySkeleton />}>
          <GalleryGrid />
        </Suspense>
      </div>
    </div>
  )
}