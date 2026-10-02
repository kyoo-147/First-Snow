import { defineConfig } from 'vitest/config';
import { loadEnvConfig } from '@next/env';
import path from 'path';

// Load env vars before config resolves
loadEnvConfig(process.cwd());

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: [
      '**/node_modules/**',
      'src/components/auth/auth-contracts.test.mjs',
      'src/components/safety/safety-contracts.test.mjs',
      'src/lib/__tests__/learning-client.test.ts',
      'src/__tests__/companion/**/*.test.ts',
      'src/vtuber-app/src/__tests__/**/*.test.mjs',
    ],
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
