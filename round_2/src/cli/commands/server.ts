/**
 * Server command - Start the Lynx web server
 */

import { Command } from 'commander';
import chalk from 'chalk';

interface ServerOptions {
  port: string;
  httpsPort: string;
  https: boolean;
  host: string;
}

export const serverCommand = new Command('server')
  .description('Start the Lynx web server')
  .option('-p, --port <port>', 'HTTP port', '8080')
  .option('--https-port <port>', 'HTTPS port', '8443')
  .option('--https', 'Enable HTTPS', false)
  .option('-h, --host <host>', 'Host to bind to', '0.0.0.0')
  .action(async (options: ServerOptions) => {
    console.log(chalk.cyan('🐆 Starting The Weakest Lynx server...'));
    console.log(chalk.gray(`   HTTP:  http://${options.host}:${options.port}`));
    
    if (options.https) {
      console.log(chalk.gray(`   HTTPS: https://${options.host}:${options.httpsPort}`));
    }

    // Set environment variables for the server
    process.env.PORT = options.port;
    process.env.HTTPS_PORT = options.httpsPort;
    process.env.ENABLE_HTTPS = options.https ? 'true' : 'false';

    // Dynamically import and start the server
    try {
      await import('../../server/index.js');
    } catch (error: any) {
      console.error(chalk.red(`Failed to start server: ${error.message}`));
      process.exit(1);
    }
  });
