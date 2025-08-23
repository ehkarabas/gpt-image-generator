'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function GalleryHeader() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Geri
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Image Gallery</h1>
          <p className="text-muted-foreground">
            DALL-E ile oluşturduğunuz görüntüler
          </p>
        </div>
      </div>
    </div>
  )
}