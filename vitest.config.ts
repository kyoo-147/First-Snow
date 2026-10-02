import { defineConfig } from 'vitest/config';
import { loadEnvConfig } from '@next/env';
import path from 'path';

// Load env vars before config resolves
loadEnvConfig(process.cwd());

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Run tests sequentially to avoid DB connection conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
