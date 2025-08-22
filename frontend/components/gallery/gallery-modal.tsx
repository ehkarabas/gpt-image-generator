'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { Download, MoreVertical, Trash2, Copy, Share2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

interface GalleryModalProps {
  image: {
    id: string
    prompt: string
    imageData: string
    createdAt: string
    dalleResponseMetadata?: any
  }
  onClose: () => void
  onDelete: (imageId: string) => void
}

export function GalleryModal({ image, onClose, onDelete }: GalleryModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const imageUrl = `data:image/png;base64,${image.imageData}`
  const formattedDate = formatDistanceToNow(new Date(image.createdAt), {
    addSuffix: true,
    locale: tr,
  })

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `dalle-image-${image.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Görüntü indirildi')
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.prompt)
    toast.success('Prompt kopyalandı')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DALL-E Generated Image',
          text: image.prompt,
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link kopyalandı')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(image.id)
      toast.success('Görüntü silindi')
      onClose()
    } catch (error) {
      toast.error('Silme işlemi başarısız')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold line-clamp-2 mb-2">
                {image.prompt}
              </h2>
              <p className="text-sm text-muted-foreground">
                Oluşturulma: {formattedDate}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownload}>
                  <Download size={16} className="mr-2" />
                  İndir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyPrompt}>
                  <Copy size={16} className="mr-2" />
                  Prompt'u Kopyala
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 size={16} className="mr-2" />
                  Paylaş
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive"
                >
                  <Trash2 size={16} className="mr-2" />
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center p-6 pt-0">
            <div className="relative w-full h-full max-w-2xl">
              <Image
                src={imageUrl}
                alt={image.prompt}
                fill
                className="object-contain rounded-lg"
                quality={100}
                priority
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 p-6 pt-4 border-t">
            <Button 
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              İndir
            </Button>
            <Button 
              variant="outline"
              onClick={handleCopyPrompt}
              className="flex items-center gap-2"
            >
              <Copy size={16} />
              Prompt'u Kopyala
            </Button>
            <div className="flex-1" />
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Görüntüyü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu görüntüyü kalıcı olarak silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}