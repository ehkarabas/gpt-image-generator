'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SimpleLayoutProps {
  children: React.ReactNode
  className?: string
  showFooter?: boolean
  fullWidth?: boolean
}

export function SimpleLayout({ 
  children, 
  className, 
  showFooter = false, 
  fullWidth = false 
}: SimpleLayoutProps) {
  return (
    <div 
      className={cn(
        "min-h-screen bg-gray-50 flex flex-col",
        className
      )}
      data-testid="simple-layout-container"
    >
      {/* Header */}
      <header 
        className="bg-white border-b border-gray-200 shadow-sm"
        role="banner"
        data-testid="layout-header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                GPT Image Generator
              </h1>
            </div>
            
            {/* Future: Add navigation menu here */}
            <div className="flex items-center space-x-4">
              {/* Placeholder for user menu */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 overflow-hidden",
          fullWidth 
            ? "w-full" 
            : "max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8"
        )}
        role="main"
        data-testid="layout-main"
      >
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer 
          className="bg-white border-t border-gray-200 py-4"
          role="contentinfo"
          data-testid="layout-footer"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500">
              <p>&copy; 2024 GPT Image Generator. Built with Next.js and Supabase.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
