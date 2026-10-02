import { loadEnvConfig } from '@next/env';
import { vi } from 'vitest';

process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/agentkid_test';
process.env.SESSION_SECRET ??= 'test-parent-session-secret-at-least-32-characters';
process.env.CHILD_SESSION_SECRET ??= 'test-child-session-secret-at-least-32-characters';

loadEnvConfig(process.cwd());

// Mock 'server-only' for Node/Vitest test environment
vi.mock('server-only', () => ({}));
