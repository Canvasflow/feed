import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    'src/**/*.{js,jsx,ts,tsx}': ['vp fmt'],
  },
  fmt: {
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 80,
    sortPackageJson: false,
    ignorePatterns: ['**/*.html'],
  },
  test: {
    setupFiles: ['src/setupTests.ts'],
    tags: [
      {
        name: 'integration',
        description:
          'Tests that verify the interaction between multiple modules or systems.',
        timeout: 10000,
        skip: true,
      },
      {
        name: 'unit',
        description: 'Isolated tests for individual functions or components',
      },
      {
        name: 'rss',
        description:
          'Tests that validates the RSS feed structure, XML integrity, and channel metadata.',
      },
      {
        name: 'html',
        description:
          'Verification of DOM structure, element attributes, and document markup to transform them into canvasflow Components',
      },
      {
        name: 'recipe',
        description:
          'Ensures correct extraction of ingredients, instructions, and cooking times from JSON-LD blocks.',
        timeout: 10000,
        skip: true,
      },
      {
        name: 'todo',
        description: 'Incomplete tests or features currently under development',
      },
      {
        name: 'broken',
        description: 'Tests known to be failing that require immediate fixing.',
      },
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
      reporter: ['text', 'json', 'json-summary', 'html'],
    },
  },
  pack: {
    entry: ['src/index.ts'],
    dts: true,
    format: ['esm'],
    unbundle: true,
    clean: true,
  },
});
