'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only log non-DOM related errors to avoid spam
    if (!error.message.includes('removeChild') && 
        !error.message.includes('Node')) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Render fallback UI or nothing for DOM-related errors
      if (this.state.error?.message.includes('removeChild') || 
          this.state.error?.message.includes('Node')) {
        // Silent recovery for DOM-related errors
        return this.props.children;
      }

      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600">Something went wrong</h2>
          <button
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}