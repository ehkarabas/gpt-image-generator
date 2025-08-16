import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeneratedImage } from '@/components/chat/generated-image'

// Mock window.URL methods
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  }
})

// Mock fetch
global.fetch = vi.fn()

const mockImage = {
  id: 'test-image-1',
  image_url: 'https://example.com/image.png',
  prompt: 'A beautiful sunset over mountains',
  size: '1024x1024',
  quality: 'hd',
  model: 'dall-e-3'
}

describe('GeneratedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    global.fetch = vi.fn()
  })

  it('renders image with correct attributes', () => {
    render(<GeneratedImage image={mockImage} index={0} />)
    
    expect(screen.getByTestId('generated-image')).toBeInTheDocument()
    expect(screen.getByTestId('generated-image-img')).toBeInTheDocument()
    expect(screen.getByTestId('image-description')).toBeInTheDocument()
    expect(screen.getByTestId('image-attribution')).toBeInTheDocument()
    expect(screen.getByTestId('image-metadata')).toBeInTheDocument()
  })

  it('displays correct image attributes', () => {
    render(<GeneratedImage image={mockImage} index={0} />)
    
    const img = screen.getByTestId('generated-image-img')
    expect(img).toHaveAttribute('src', mockImage.image_url)
    expect(img).toHaveAttribute('alt', mockImage.prompt)
  })

  it('shows correct metadata', () => {
    render(<GeneratedImage image={mockImage} index={0} />)
    
    expect(screen.getByTestId('image-size')).toHaveTextContent('1024x1024')
    expect(screen.getByTestId('image-quality')).toHaveTextContent('hd')
  })

  it('displays correct description text', () => {
    render(<GeneratedImage image={mockImage} index={0} />)
    
    const description = screen.getByTestId('image-description')
    expect(description).toHaveTextContent(`Here's the image you requested based on: "${mockImage.prompt}".`)
  })

  it('shows loading placeholder initially', () => {
    render(<GeneratedImage image={mockImage} index={0} />)
    
    expect(screen.getByTestId('image-loading-placeholder')).toBeInTheDocument()
  })

  it('hides loading placeholder when image loads', () => {
    render(<GeneratedImage image={mockImage} index={0} />)
    
    const img = screen.getByTestId('generated-image-img')
    fireEvent.load(img)
    
    expect(screen.queryByTestId('image-loading-placeholder')).not.toBeInTheDocument()
  })

  it('shows action buttons on hover', () => {
    render(<GeneratedImage image={mockImage} index={0} />)
    
    expect(screen.getByTestId('image-actions')).toBeInTheDocument()
    expect(screen.getByTestId('download-image-button')).toBeInTheDocument()
    expect(screen.getByTestId('open-image-button')).toBeInTheDocument()
  })

  it('has correct accessibility attributes', () => {
    render(<GeneratedImage image={mockImage} index={0} />)
    
    const img = screen.getByTestId('generated-image-img')
    const downloadBtn = screen.getByTestId('download-image-button')
    const openBtn = screen.getByTestId('open-image-button')
    const placeholder = screen.getByTestId('image-loading-placeholder')
    
    expect(img).toHaveAttribute('alt', mockImage.prompt)
    expect(downloadBtn).toHaveAttribute('aria-label', 'Download image')
    expect(openBtn).toHaveAttribute('aria-label', 'Open image in new tab')
    expect(placeholder).toHaveAttribute('aria-label', 'Image loading')
  })

  it('handles download functionality', async () => {
    const mockBlob = new Blob(['image data'], { type: 'image/png' })
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(mockBlob)
    })

    render(<GeneratedImage image={mockImage} index={0} />)
    
    const downloadBtn = screen.getByTestId('download-image-button')
    fireEvent.click(downloadBtn)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(mockImage.image_url)
    })
  })

  it('handles download error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<GeneratedImage image={mockImage} index={0} />)
    
    const downloadBtn = screen.getByTestId('download-image-button')
    fireEvent.click(downloadBtn)

    await waitFor(() => {
      expect(screen.getByTestId('download-error')).toBeInTheDocument()
    })

    expect(screen.getByTestId('download-error')).toHaveTextContent('Download failed. Please try again.')
  })

  it('opens image in new tab', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<GeneratedImage image={mockImage} index={0} />)
    
    const openBtn = screen.getByTestId('open-image-button')
    fireEvent.click(openBtn)

    expect(windowOpenSpy).toHaveBeenCalledWith(mockImage.image_url, '_blank')

    windowOpenSpy.mockRestore()
  })

  it('handles image without quality metadata', () => {
    const imageWithoutQuality = { ...mockImage, quality: undefined }
    render(<GeneratedImage image={imageWithoutQuality} index={0} />)
    
    expect(screen.getByTestId('image-size')).toHaveTextContent('1024x1024')
    expect(screen.queryByTestId('image-quality')).not.toBeInTheDocument()
  })

  it('has correct data attributes', () => {
    render(<GeneratedImage image={mockImage} index={0} />)
    
    const container = screen.getByTestId('generated-image')
    expect(container).toHaveAttribute('data-image-id', mockImage.id)
    expect(container).toHaveAttribute('data-image-index', '0')
  })

  it('shows error state with proper accessibility', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<GeneratedImage image={mockImage} index={0} />)
    
    const downloadBtn = screen.getByTestId('download-image-button')
    fireEvent.click(downloadBtn)

    await waitFor(() => {
      const errorElement = screen.getByTestId('download-error')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement).toHaveAttribute('role', 'alert')
    })
  })
})
