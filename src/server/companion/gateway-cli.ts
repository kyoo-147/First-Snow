import { startGatewayFromEnv } from './gateway';

void startGatewayFromEnv().then(({ close }) => {
  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', event: 'shutdown_requested', signal })}\n`);
    await close();
  };
  process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.once('SIGINT', () => { void shutdown('SIGINT'); });
}).catch(() => {
  process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', event: 'gateway_start_failed', code: 'configuration_or_database_error' })}\n`);
  process.exitCode = 1;
});
