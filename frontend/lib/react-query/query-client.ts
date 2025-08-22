import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data is considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache time - data is kept in cache for 10 minutes after components unmount
      gcTime: 1000 * 60 * 10,
      // Retry failed requests 1 time (instead of 3 by default)
      retry: 1,
      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for important data
      refetchOnWindowFocus: false,
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})