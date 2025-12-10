/**
 * File command - Scan a manifest file for vulnerabilities
 */

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { basename } from 'path';
import { parseManifest } from '../../server/services/parsers/manifest.js';
import { queryOsv } from '../../server/services/scanner/osv.js';
import { calculateSecurityScore } from '../../server/services/scanner/score.js';
import { generateRemediations } from '../../server/services/remediation/engine.js';
import { ScanResponse, Dependency, Vulnerability } from '../../server/types.js';
import { formatTable, formatJson, formatMarkdown, formatSummary, formatDeepScan, formatSarif } from '../formatters/output.js';

type OutputFormat = 'table' | 'json' | 'markdown' | 'summary' | 'sarif';

interface FileOptions {
  output: OutputFormat;
  deep: boolean;
  verbose: boolean;
}

export const fileCommand = new Command('file')
  .description('Scan a manifest file for vulnerabilities')
  .argument('<path>', 'Path to manifest file (requirements.txt, package.json, go.mod, etc.)')
  .option('-o, --output <format>', 'Output format: table, json, markdown, summary, sarif', 'table')
  .option('-d, --deep', 'Deep scan: show vulnerabilities for each dependency', false)
  .option('--verbose', 'Enable verbose logging', false)
  .action(async (filePath: string, options: FileOptions) => {
    const spinner = ora();
    
    try {
      // Read file
      spinner.start(`Reading ${chalk.cyan(filePath)}...`);
      
      let content: string;
      try {
        content = readFileSync(filePath, 'utf-8');
      } catch (e: any) {
        spinner.fail(chalk.red(`Failed to read file: ${e.message}`));
        process.exit(2);
      }
      
      const fileName = basename(filePath);
      
      // Parse manifest
      spinner.text = `Parsing ${chalk.cyan(fileName)}...`;
      
      let manifest;
      try {
        manifest = parseManifest(content, fileName);
      } catch (e: any) {
        spinner.fail(chalk.red(`Failed to parse file: ${e.message}`));
        process.exit(2);
      }
      
      if (manifest.dependencies.length === 0) {
        spinner.fail(chalk.yellow('No dependencies found in file'));
        process.exit(0);
      }
      
      spinner.text = `Scanning ${chalk.cyan(manifest.dependencies.length)} dependencies (${manifest.ecosystem})...`;
      
      // Scan each dependency
      const dependencies: Dependency[] = [];
      const vulnerabilities: Vulnerability[] = [];
      
      for (const dep of manifest.dependencies) {
        if (options.verbose) {
          spinner.text = `Scanning ${dep.name}@${dep.version || 'latest'}...`;
        }
        
        const vulns = await queryOsv(dep.name, manifest.ecosystem, dep.version || 'latest');
        
        const severities = vulns.map(v => v.severity);
        const maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 
          severities.includes('critical') ? 'critical' :
          severities.includes('high') ? 'high' :
          severities.includes('medium') ? 'medium' :
          severities.includes('low') ? 'low' : 'none';
        
        dependencies.push({
          name: dep.name,
          version: dep.version || 'latest',
          ecosystem: manifest.ecosystem,
          direct: true,
          vulnerabilityCount: vulns.length,
          maxSeverity,
        });
        
        vulnerabilities.push(...vulns);
      }
      
      // Calculate score and remediations
      const summary = {
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        medium: vulnerabilities.filter(v => v.severity === 'medium').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length,
        total: vulnerabilities.length,
      };
      
      const securityScore = calculateSecurityScore({
        vulnerabilities,
        dependencyCount: dependencies.length,
        directDependencyCount: dependencies.length,
      });
      
      const remediations = await generateRemediations(vulnerabilities, dependencies);
      
      const result: ScanResponse = {
        id: `file-${Date.now()}`,
        status: 'completed',
        ecosystem: manifest.ecosystem,
        target: fileName,
        version: 'file',
        scanDate: new Date().toISOString(),
        securityScore,
        summary,
        dependencies,
        vulnerabilities,
        remediations,
      };
      
      spinner.succeed(`Scan completed for ${chalk.cyan(fileName)} (${manifest.ecosystem})`);
      
      // Output results
      if (options.deep) {
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
          case 'sarif':
            console.log(formatSarif(result));
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
