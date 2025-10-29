import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Use jsdom environment for React component testing
    environment: 'jsdom',
    
    // Setup files to run before each test
    setupFiles: ['__tests__/setup.ts'],
    
    // Test file patterns
    include: [
      '__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      '.next',
      'dist',
      'build',
      'coverage',
      '**/*.d.ts',
      'scripts/**/*',
      'supabase/migrations/**/*'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules',
        '.next',
        'dist',
        'build',
        'coverage',
        '**/*.d.ts',
        '**/*.config.{js,ts,mjs,mts}',
        'scripts/**/*',
        'supabase/**/*',
        'public/**/*',
        '__tests__/**/*',
        'next-env.d.ts',
        'tailwind.config.js',
        'postcss.config.mjs'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  
  // Path aliases matching tsconfig.json
  resolve: {
    alias: {
      '@': resolve(__dirname, './')
    }
  }
})