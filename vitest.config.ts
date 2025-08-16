import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    environment: 'jsdom',
    globals: true,
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        '**/node_modules/',
        '**/dist/',
        'tests/',
        '.next/',
        'public/',
        'supabase/migrations/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend'),
      '@/lib': path.resolve(__dirname, 'frontend/lib'),
      '@/components': path.resolve(__dirname, 'frontend/components'),
      '@/hooks': path.resolve(__dirname, 'frontend/hooks'),
      '@/app': path.resolve(__dirname, 'frontend/app'),
      '@/types': path.resolve(__dirname, 'types'),
      // Do not shadow the official '@supabase/supabase-js' package.
      // If you need to import local supabase function helpers, import relatively
      // or add explicit aliases like '@supabase/_lib/*' instead.
    }
  }
});
