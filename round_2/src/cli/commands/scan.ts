/**
 * Scan command - Scan a package for vulnerabilities
 * 
 * Supports two modes:
 * 1. Standalone: Direct scanning using local scanner service
 * 2. Client: Connect to a running Lynx server via API
 */

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { scanPackage } from '../../server/services/scanner/index.js';
import { ScanRequest, ScanResponse } from '../../server/types.js';
import { formatTable, formatJson, formatMarkdown, formatSummary, formatDeepScan } from '../formatters/output.js';
import { ApiClient } from '../utils/api-client.js';

type Ecosystem = 'pypi' | 'npm' | 'maven' | 'go' | 'rubygems';
type OutputFormat = 'table' | 'json' | 'markdown' | 'summary';

interface ScanOptions {
  ver?: string;
  output: OutputFormat;
  server?: string;
  timeout: string;
  verbose: boolean;
  deep: boolean;
}

export const scanCommand = new Command('scan')
  .description('Scan a package for vulnerabilities')
  .argument('<ecosystem>', 'Package ecosystem (pypi, npm, maven, go, rubygems)')
  .argument('<package>', 'Package name to scan')
  .option('--ver <version>', 'Specific package version to scan (default: latest)')
  .option('-o, --output <format>', 'Output format: table, json, markdown, summary', 'table')
  .option('-s, --server <url>', 'Connect to remote Lynx server instead of scanning locally')
  .option('-t, --timeout <seconds>', 'Timeout in seconds', '60')
  .option('--verbose', 'Enable verbose logging', false)
  .option('-d, --deep', 'Deep scan: show vulnerabilities for each dependency', false)
  .action(async (ecosystem: string, packageName: string, options: ScanOptions) => {
    const spinner = ora();
    
    try {
      // Validate ecosystem
      const validEcosystems: Ecosystem[] = ['pypi', 'npm', 'maven', 'go', 'rubygems'];
      if (!validEcosystems.includes(ecosystem as Ecosystem)) {
        console.error(chalk.red(`Error: Invalid ecosystem "${ecosystem}"`));
        console.error(chalk.gray(`Valid ecosystems: ${validEcosystems.join(', ')}`));
        process.exit(1);
      }

      // Validate output format
      const validFormats: OutputFormat[] = ['table', 'json', 'markdown', 'summary'];
      if (!validFormats.includes(options.output as OutputFormat)) {
        console.error(chalk.red(`Error: Invalid output format "${options.output}"`));
        console.error(chalk.gray(`Valid formats: ${validFormats.join(', ')}`));
        process.exit(1);
      }

      const request: ScanRequest = {
        ecosystem: ecosystem as Ecosystem,
        package: packageName,
        version: options.ver,
      };

      let result: ScanResponse;

      if (options.server) {
        // Client mode - connect to remote server
        spinner.start(`Connecting to ${options.server}...`);
        const client = new ApiClient(options.server, parseInt(options.timeout) * 1000);
        
        spinner.text = `Scanning ${packageName} via remote server...`;
        result = await client.scan(request);
      } else {
        // Standalone mode - direct scanning
        spinner.start(`Scanning ${chalk.cyan(packageName)} (${ecosystem})...`);
        
        if (options.verbose) {
          spinner.info(`Version: ${options.ver || 'latest'}`);
        }
        
        result = await scanPackage(request);
      }

      spinner.succeed(`Scan completed for ${chalk.cyan(packageName)}@${chalk.yellow(result.version)}`);

      // Output results based on format
      if (options.deep) {
        // Deep scan output - show per-dependency vulnerability details
        console.log(formatDeepScan(result, options.output));
      } else {
        switch (options.output) {
          case 'json':
            console.log(formatJson(result));
            break;
          case 'markdown':
            console.log(formatMarkdown(result));
            break;
          case 'summary':
            console.log(formatSummary(result));
            break;
          case 'table':
          default:
            console.log(formatTable(result));
            break;
        }
      }

      // Exit with non-zero code if critical/high vulnerabilities found
      if (result.summary.critical > 0 || result.summary.high > 0) {
        process.exit(1);
      }

    } catch (error: any) {
      spinner.fail(chalk.red('Scan failed'));
      console.error(chalk.red(`Error: ${error.message}`));
      
      if (options.verbose && error.stack) {
        console.error(chalk.gray(error.stack));
      }
      
      process.exit(2);
    }
  });
