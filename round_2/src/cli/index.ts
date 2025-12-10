#!/usr/bin/env node
/**
 * The Weakest Lynx CLI
 * 
 * Supply chain security auditor - CLI interface
 * 
 * Usage:
 *   lynx scan <ecosystem> <package> [options]
 *   lynx file <path> [options]
 *   lynx server [options]
 *   lynx health [options]
 */

// Set CLI mode before any imports to suppress server logs
process.env.LYNX_CLI_MODE = 'true';

import { Command } from 'commander';
import { scanCommand } from './commands/scan.js';
import { fileCommand } from './commands/file.js';
import { serverCommand } from './commands/server.js';
import { healthCommand } from './commands/health.js';

const program = new Command();

program
  .name('lynx')
  .description('🐆 The Weakest Lynx - Supply chain security auditor')
  .version('1.0.0');

// Register commands
program.addCommand(scanCommand);
program.addCommand(fileCommand);
program.addCommand(serverCommand);
program.addCommand(healthCommand);

// Parse arguments
program.parse();
