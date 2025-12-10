import pino from 'pino';

// Lazy logger that checks CLI mode at call time
// This allows the CLI to set LYNX_CLI_MODE before logging starts
let _logger: pino.Logger | null = null;

function getLogger(): pino.Logger {
  if (!_logger) {
    const isCli = process.env.LYNX_CLI_MODE === 'true';
    // Import config dynamically to avoid circular deps
    const logLevel = process.env.LOG_LEVEL || 'info';
    _logger = pino({
      level: isCli ? 'silent' : logLevel,
    });
  }
  return _logger;
}

// Proxy logger that defers to lazy initialization
export const logger = {
  info: (...args: Parameters<pino.Logger['info']>) => getLogger().info(...args),
  error: (...args: Parameters<pino.Logger['error']>) => getLogger().error(...args),
  warn: (...args: Parameters<pino.Logger['warn']>) => getLogger().warn(...args),
  debug: (...args: Parameters<pino.Logger['debug']>) => getLogger().debug(...args),
  trace: (...args: Parameters<pino.Logger['trace']>) => getLogger().trace(...args),
  fatal: (...args: Parameters<pino.Logger['fatal']>) => getLogger().fatal(...args),
  child: (bindings: pino.Bindings) => getLogger().child(bindings),
};
