import pino from 'pino';

// Lazy logger that checks CLI mode at call time
// This allows the CLI to set LYNX_CLI_MODE before logging starts
let _logger: pino.Logger | null = null;

function getLogger(): pino.Logger {
  if (!_logger) {
    const isCli = process.env.LYNX_CLI_MODE === 'true';
    const logLevel = process.env.LOG_LEVEL || 'info';
    _logger = pino({
      level: isCli ? 'silent' : logLevel,
    });
  }
  return _logger;
}

// Export a proxy that lazily initializes the real logger
// Using 'as pino.Logger' to satisfy TypeScript while maintaining lazy init
export const logger: pino.Logger = new Proxy({} as pino.Logger, {
  get(_target, prop) {
    return (getLogger() as any)[prop];
  },
});
