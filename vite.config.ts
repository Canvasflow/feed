import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

export default defineConfig({
  test: {
    setupFiles: ['src/setupTests.ts'],
    tags: [
      {
        name: 'integration',
        description: 'Tests that verify the interaction between multiple modules or systems.',
        timeout: 10000,
        skip: true
      },
      {
        name: 'unit',
        description: 'Isolated tests for individual functions or components'
      },
      {
        name: 'rss',
        description: 'Tests that validates the RSS feed structure, XML integrity, and channel metadata.'
      },
      {
        name: 'html',
        description: 'Verification of DOM structure, element attributes, and document markup to transform them into canvasflow Components'
      },
      {
        name: 'recipe',
        description: 'Ensures correct extraction of ingredients, instructions, and cooking times from JSON-LD blocks.',
        timeout: 10000,
        skip: true
      },
      {
        name: 'todo',
        description: 'Incomplete tests or features currently under development'
      },
      {
        name: 'broken',
        description: 'Tests known to be failing that require immediate fixing.'
      }
    ],
    coverage: {
      provider: 'v8',
      exclude: [
        '*.config.*',
        '*.d.ts',
        'dist/*',
        'config/*',
        'src/index.ts',
        '.commitlintrc.js',
      ],
      reporter: ['text', 'json', 'html'],
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'index',
      fileName: 'index',
    },
  },
  plugins: [dts()],
});
