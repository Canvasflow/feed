import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

export default defineConfig({
  test: {
    setupFiles: ['src/setupTests.ts'],
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
