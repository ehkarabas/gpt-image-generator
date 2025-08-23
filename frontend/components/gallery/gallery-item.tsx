'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface GalleryItemProps {
  image: {
    id: string
    prompt: string
    imageData: string
    createdAt: string
  }
  onClick: () => void
}

export function GalleryItem({ image, onClick }: GalleryItemProps) {
  const formattedDate = formatDistanceToNow(new Date(image.createdAt), {
    addSuffix: true,
    locale: tr,
  })

  // Convert base64 to data URL for Next.js Image
  const imageUrl = `data:image/png;base64,${image.imageData}`

  return (
    <motion.div
      className="group cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={image.prompt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          quality={85}
          priority={false}
        />
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Image info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-sm font-medium line-clamp-2 mb-1">
            {image.prompt}
          </p>
          <p className="text-xs opacity-80">
            {formattedDate}
          </p>
        </div>
      </div>
      
      {/* Text below image for mobile */}
      <div className="mt-2 block sm:hidden">
        <p className="text-sm font-medium line-clamp-2 mb-1">
          {image.prompt}
        </p>
        <p className="text-xs text-muted-foreground">
          {formattedDate}
        </p>
      </div>
    </motion.div>
  )
}