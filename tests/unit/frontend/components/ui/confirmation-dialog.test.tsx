import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock AlertDialog components
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  AlertDialogDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  AlertDialogAction: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

// Mock Button variants
vi.mock('@/components/ui/button', () => ({
  buttonVariants: vi.fn(() => 'button-class'),
}))

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">×</span>,
}))

import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

describe('ConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<ConfirmationDialog {...defaultProps} />)
      
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('confirmation-dialog-backdrop')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<ConfirmationDialog {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument()
    })

    it('displays title and message correctly', () => {
      render(<ConfirmationDialog {...defaultProps} />)
      
      expect(screen.getByTestId('confirmation-dialog-title')).toHaveTextContent('Delete Item')
      expect(screen.getByTestId('confirmation-dialog-message')).toHaveTextContent('Are you sure you want to delete this item?')
    })

    it('renders default button texts', () => {
      render(<ConfirmationDialog {...defaultProps} />)
      
      expect(screen.getByTestId('confirmation-dialog-confirm')).toHaveTextContent('Delete')
      expect(screen.getByTestId('confirmation-dialog-cancel')).toHaveTextContent('Cancel')
    })

    it('renders custom button texts when provided', () => {
      render(
        <ConfirmationDialog 
          {...defaultProps} 
          confirmText="Remove"
          cancelText="Keep"
        />
      )
      
      expect(screen.getByTestId('confirmation-dialog-confirm')).toHaveTextContent('Remove')
      expect(screen.getByTestId('confirmation-dialog-cancel')).toHaveTextContent('Keep')
    })
  })

  describe('Interactions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn()
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />)
      
      const confirmButton = screen.getByTestId('confirmation-dialog-confirm')
      fireEvent.click(confirmButton)
      
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn()
      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />)
      
      const cancelButton = screen.getByTestId('confirmation-dialog-cancel')
      fireEvent.click(cancelButton)
      
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when close button is clicked', () => {
      const onCancel = vi.fn()
      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />)
      
      const closeButton = screen.getByTestId('confirmation-dialog-close')
      fireEvent.click(closeButton)
      
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when backdrop is clicked', () => {
      const onCancel = vi.fn()
      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />)
      
      const backdrop = screen.getByTestId('confirmation-dialog-backdrop')
      fireEvent.click(backdrop)
      
      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading State', () => {
    it('shows loading text when isLoading is true', () => {
      render(<ConfirmationDialog {...defaultProps} isLoading={true} />)
      
      expect(screen.getByTestId('confirmation-dialog-confirm')).toHaveTextContent('Deleting...')
    })

    it('disables buttons when isLoading is true', () => {
      render(<ConfirmationDialog {...defaultProps} isLoading={true} />)
      
      expect(screen.getByTestId('confirmation-dialog-confirm')).toBeDisabled()
      expect(screen.getByTestId('confirmation-dialog-cancel')).toBeDisabled()
    })

    it('enables buttons when isLoading is false', () => {
      render(<ConfirmationDialog {...defaultProps} isLoading={false} />)
      
      expect(screen.getByTestId('confirmation-dialog-confirm')).not.toBeDisabled()
      expect(screen.getByTestId('confirmation-dialog-cancel')).not.toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ConfirmationDialog {...defaultProps} />)
      
      const dialog = screen.getByTestId('confirmation-dialog')
      expect(dialog).toHaveAttribute('role', 'dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title')
      expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description')
    })

    it('has proper close button accessibility', () => {
      render(<ConfirmationDialog {...defaultProps} />)
      
      const closeButton = screen.getByTestId('confirmation-dialog-close')
      expect(closeButton).toHaveAttribute('aria-label', 'Close dialog')
    })

    it('has proper heading and description IDs', () => {
      render(<ConfirmationDialog {...defaultProps} />)
      
      expect(screen.getByTestId('confirmation-dialog-title')).toHaveAttribute('id', 'dialog-title')
      expect(screen.getByTestId('confirmation-dialog-message')).toHaveAttribute('id', 'dialog-description')
    })
  })

  describe('Styling', () => {
    it('applies correct CSS classes', () => {
      render(<ConfirmationDialog {...defaultProps} />)
      
      const backdrop = screen.getByTestId('confirmation-dialog-backdrop')
      expect(backdrop).toHaveClass('fixed', 'inset-0', 'bg-black/50')
      
      const dialog = screen.getByTestId('confirmation-dialog')
      expect(dialog).toHaveClass('relative', 'bg-white', 'rounded-lg', 'shadow-lg')
    })
  })
})