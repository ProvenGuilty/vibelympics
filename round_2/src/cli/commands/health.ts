/**
 * Health command - Check health of a remote Lynx server
 */

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { ApiClient } from '../utils/api-client.js';

interface HealthOptions {
  timeout: string;
}

export const healthCommand = new Command('health')
  .description('Check health of a Lynx server')
  .argument('<url>', 'Server URL (e.g., http://localhost:8080)')
  .option('-t, --timeout <seconds>', 'Timeout in seconds', '10')
  .action(async (url: string, options: HealthOptions) => {
    const spinner = ora(`Checking health of ${url}...`).start();
    
    try {
      const client = new ApiClient(url, parseInt(options.timeout) * 1000);
      const health = await client.health();
      
      spinner.succeed(chalk.green('Server is healthy'));
      
      console.log(chalk.gray('\nServer Info:'));
      console.log(chalk.gray(`  Status: ${health.status}`));
      if (health.version) {
        console.log(chalk.gray(`  Version: ${health.version}`));
      }
      if (health.uptime) {
        console.log(chalk.gray(`  Uptime: ${health.uptime}s`));
      }
      
    } catch (error: any) {
      spinner.fail(chalk.red('Server health check failed'));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });
