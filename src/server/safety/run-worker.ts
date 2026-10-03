import { pathToFileURL } from 'node:url';
import { DatabaseSafetyWorkerRepository } from './worker-repository';
import { runSafetyJobsOnce, type WorkerAdapters } from './worker';

async function loadAdapters(): Promise<WorkerAdapters> {
  const modulePath = process.env.SAFETY_WORKER_ADAPTER_MODULE;
  if (!modulePath) return {};
  try {
    const specifier = modulePath.startsWith('.') || modulePath.includes(':')
      ? pathToFileURL(modulePath).href
      : modulePath;
    const adapterModule = await import(specifier) as { default?: WorkerAdapters; adapters?: WorkerAdapters };
    const adapters = adapterModule.adapters ?? adapterModule.default;
    if (!adapters || typeof adapters !== 'object') throw new Error('Adapter module must export `adapters` or a default WorkerAdapters object.');
    return adapters;
  } catch (error) {
    console.error('[safety-worker] Adapter module unavailable; export and delivery jobs will be failed truthfully.', error);
    return {};
  }
}

export async function main(args = process.argv.slice(2)) {
  const limitArg = args.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.slice('--limit='.length)) : 20;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('--limit must be an integer from 1 to 100.');
  const repository = new DatabaseSafetyWorkerRepository();
  try {
    const result = await runSafetyJobsOnce({
      repository,
      adapters: await loadAdapters(),
      limit,
      retryFailed: args.includes('--retry-failed'),
    });
    console.log(JSON.stringify(result));
    return result;
  } finally {
    await repository.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error('[safety-worker] Run failed.', error);
    process.exitCode = 1;
  });
}
