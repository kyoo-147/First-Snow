import { loadEnvConfig } from '@next/env';
import { vi } from 'vitest';

loadEnvConfig(process.cwd());

// Mock 'server-only' for Node/Vitest test environment
vi.mock('server-only', () => ({}));
