import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    // e2e/ is Playwright's (pnpm e2e) — vitest must not try to run it.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**']
  }
});
