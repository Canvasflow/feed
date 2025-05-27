import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

export default defineConfig({
  test: {
    setupFiles: ['src/setupTests.ts'],
    coverage: {
      exclude: ['*.config.*', '*.d.ts'],
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
