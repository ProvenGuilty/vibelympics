/**
 * Output formatters for CLI results
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { ScanResponse, Vulnerability, Dependency } from '../../server/types.js';
import { exportSarif } from '../../server/services/export/sarif.js';

/**
 * Format severity with color
 */
function colorSeverity(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return chalk.bgRed.white.bold(` ${severity.toUpperCase()} `);
    case 'high':
      return chalk.red.bold(severity.toUpperCase());
    case 'medium':
      return chalk.yellow(severity.toUpperCase());
    case 'low':
      return chalk.green(severity.toUpperCase());
    default:
      return chalk.gray(severity);
  }
}

/**
 * Format security score with color
 */
function colorScore(score: number): string {
  if (score >= 80) return chalk.green.bold(`${score}/100`);
  if (score >= 60) return chalk.yellow.bold(`${score}/100`);
  if (score >= 40) return chalk.hex('#FFA500').bold(`${score}/100`);
  return chalk.red.bold(`${score}/100`);
}

/**
 * Format results as a table
 */
export function formatTable(result: ScanResponse): string {
  const output: string[] = [];
  
  // Header
  output.push('');
  output.push(chalk.cyan.bold('🐆 The Weakest Lynx - Scan Results'));
  output.push(chalk.gray('─'.repeat(50)));
  
  // Summary
  output.push(`${chalk.bold('Package:')} ${result.target}@${result.version}`);
  output.push(`${chalk.bold('Ecosystem:')} ${result.ecosystem}`);
  output.push(`${chalk.bold('Security Score:')} ${colorScore(result.securityScore)}`);
  output.push(`${chalk.bold('Scan Date:')} ${result.scanDate}`);
  output.push('');
  
  // Vulnerability summary
  const summaryTable = new Table({
    head: [
      chalk.white.bold('Critical'),
      chalk.white.bold('High'),
      chalk.white.bold('Medium'),
      chalk.white.bold('Low'),
      chalk.white.bold('Total'),
    ],
    colWidths: [12, 12, 12, 12, 12],
  });
  
  summaryTable.push([
    result.summary.critical > 0 ? chalk.red.bold(result.summary.critical) : chalk.gray('0'),
    result.summary.high > 0 ? chalk.hex('#FFA500').bold(result.summary.high) : chalk.gray('0'),
    result.summary.medium > 0 ? chalk.yellow(result.summary.medium) : chalk.gray('0'),
    result.summary.low > 0 ? chalk.green(result.summary.low) : chalk.gray('0'),
    chalk.bold(result.summary.total),
  ]);
  
  output.push(chalk.bold('Vulnerability Summary:'));
  output.push(summaryTable.toString());
  output.push('');
  
  // Dependencies
  if (result.dependencies.length > 0) {
    output.push(chalk.bold(`Dependencies (${result.dependencies.length}):`));
    
    const depTable = new Table({
      head: [
        chalk.white.bold('Package'),
        chalk.white.bold('Version'),
        chalk.white.bold('Direct'),
        chalk.white.bold('Vulns'),
        chalk.white.bold('Max Severity'),
      ],
      colWidths: [30, 15, 10, 10, 15],
    });
    
    // Show top 20 dependencies, prioritize those with vulnerabilities
    const sortedDeps = [...result.dependencies].sort((a, b) => {
      if (a.vulnerabilityCount !== b.vulnerabilityCount) {
        return b.vulnerabilityCount - a.vulnerabilityCount;
      }
      return a.direct === b.direct ? 0 : a.direct ? -1 : 1;
    });
    
    const depsToShow = sortedDeps.slice(0, 20);
    
    for (const dep of depsToShow) {
      depTable.push([
        dep.name.length > 28 ? dep.name.slice(0, 25) + '...' : dep.name,
        dep.version,
        dep.direct ? chalk.cyan('Yes') : chalk.gray('No'),
        dep.vulnerabilityCount > 0 ? chalk.red(dep.vulnerabilityCount) : chalk.gray('0'),
        dep.maxSeverity !== 'none' ? colorSeverity(dep.maxSeverity) : chalk.gray('-'),
      ]);
    }
    
    output.push(depTable.toString());
    
    if (result.dependencies.length > 20) {
      output.push(chalk.gray(`  ... and ${result.dependencies.length - 20} more dependencies`));
    }
    output.push('');
  }
  
  // Vulnerabilities
  if (result.vulnerabilities.length > 0) {
    output.push(chalk.bold(`Vulnerabilities (${result.vulnerabilities.length}):`));
    
    const vulnTable = new Table({
      head: [
        chalk.white.bold('ID'),
        chalk.white.bold('Severity'),
        chalk.white.bold('Package'),
        chalk.white.bold('Installed'),
        chalk.white.bold('Fixed'),
      ],
      colWidths: [22, 12, 25, 12, 12],
    });
    
    for (const vuln of result.vulnerabilities) {
      vulnTable.push([
        vuln.id.length > 20 ? vuln.id.slice(0, 17) + '...' : vuln.id,
        colorSeverity(vuln.severity),
        vuln.package.length > 23 ? vuln.package.slice(0, 20) + '...' : vuln.package,
        vuln.installedVersion,
        vuln.fixedVersion || chalk.gray('N/A'),
      ]);
    }
    
    output.push(vulnTable.toString());
    output.push('');
  }
  
  // Remediations
  if (result.remediations.length > 0) {
    output.push(chalk.bold(`Recommended Upgrades (${result.remediations.length}):`));
    
    const remTable = new Table({
      head: [
        chalk.white.bold('Package'),
        chalk.white.bold('Current'),
        chalk.white.bold('Target'),
        chalk.white.bold('Fixes'),
        chalk.white.bold('Breaking'),
      ],
      colWidths: [25, 12, 12, 10, 12],
    });
    
    for (const rem of result.remediations) {
      remTable.push([
        rem.package.length > 23 ? rem.package.slice(0, 20) + '...' : rem.package,
        rem.currentVersion,
        chalk.green(rem.targetVersion),
        rem.vulnerabilitiesFixed.length.toString(),
        rem.isBreaking ? chalk.yellow('Yes') : chalk.gray('No'),
      ]);
    }
    
    output.push(remTable.toString());
  }
  
  output.push('');
  return output.join('\n');
}

/**
 * Format results as JSON
 */
export function formatJson(result: ScanResponse): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Format results as Markdown
 */
export function formatMarkdown(result: ScanResponse): string {
  const lines: string[] = [];
  
  lines.push(`# Security Scan Report: ${result.target}@${result.version}`);
  lines.push('');
  lines.push(`**Ecosystem:** ${result.ecosystem}`);
  lines.push(`**Security Score:** ${result.securityScore}/100`);
  lines.push(`**Scan Date:** ${result.scanDate}`);
  lines.push('');
  
  // Summary
  lines.push('## Vulnerability Summary');
  lines.push('');
  lines.push('| Severity | Count |');
  lines.push('|----------|-------|');
  lines.push(`| Critical | ${result.summary.critical} |`);
  lines.push(`| High | ${result.summary.high} |`);
  lines.push(`| Medium | ${result.summary.medium} |`);
  lines.push(`| Low | ${result.summary.low} |`);
  lines.push(`| **Total** | **${result.summary.total}** |`);
  lines.push('');
  
  // Vulnerabilities
  if (result.vulnerabilities.length > 0) {
    lines.push('## Vulnerabilities');
    lines.push('');
    lines.push('| ID | Severity | Package | Installed | Fixed |');
    lines.push('|----|----------|---------|-----------|-------|');
    
    for (const vuln of result.vulnerabilities) {
      lines.push(`| ${vuln.id} | ${vuln.severity} | ${vuln.package} | ${vuln.installedVersion} | ${vuln.fixedVersion || 'N/A'} |`);
    }
    lines.push('');
  }
  
  // Remediations
  if (result.remediations.length > 0) {
    lines.push('## Recommended Upgrades');
    lines.push('');
    lines.push('| Package | Current | Target | Fixes | Breaking |');
    lines.push('|---------|---------|--------|-------|----------|');
    
    for (const rem of result.remediations) {
      lines.push(`| ${rem.package} | ${rem.currentVersion} | ${rem.targetVersion} | ${rem.vulnerabilitiesFixed.length} | ${rem.isBreaking ? 'Yes' : 'No'} |`);
    }
    lines.push('');
  }
  
  // Dependencies
  lines.push('## Dependencies');
  lines.push('');
  lines.push(`Total: ${result.dependencies.length}`);
  lines.push(`Direct: ${result.dependencies.filter(d => d.direct).length}`);
  lines.push(`Transitive: ${result.dependencies.filter(d => !d.direct).length}`);
  lines.push('');
  
  lines.push('---');
  lines.push('*Generated by The Weakest Lynx*');
  
  return lines.join('\n');
}

/**
 * Format results as a brief summary (for CI/CD)
 */
export function formatSummary(result: ScanResponse): string {
  const lines: string[] = [];
  
  const statusIcon = result.summary.critical > 0 || result.summary.high > 0 
    ? chalk.red('✗') 
    : result.summary.medium > 0 
      ? chalk.yellow('⚠') 
      : chalk.green('✓');
  
  lines.push(`${statusIcon} ${result.target}@${result.version} - Score: ${colorScore(result.securityScore)}`);
  
  const parts: string[] = [];
  if (result.summary.critical > 0) parts.push(chalk.red(`${result.summary.critical} critical`));
  if (result.summary.high > 0) parts.push(chalk.hex('#FFA500')(`${result.summary.high} high`));
  if (result.summary.medium > 0) parts.push(chalk.yellow(`${result.summary.medium} medium`));
  if (result.summary.low > 0) parts.push(chalk.green(`${result.summary.low} low`));
  
  if (parts.length > 0) {
    lines.push(`  Vulnerabilities: ${parts.join(', ')}`);
  } else {
    lines.push(chalk.green('  No vulnerabilities found'));
  }
  
  lines.push(`  Dependencies: ${result.dependencies.length} (${result.dependencies.filter(d => d.direct).length} direct)`);
  
  return lines.join('\n');
}

/**
 * Format deep scan results - compact view showing all dependencies with inline vuln info
 */
export function formatDeepScan(result: ScanResponse, format: string = 'table'): string {
  if (format === 'json') {
    // For JSON, include full vulnerability mapping per dependency
    const deepResult = {
      ...result,
      dependencyDetails: result.dependencies.map(dep => ({
        ...dep,
        vulnerabilities: result.vulnerabilities.filter(v => v.package === dep.name),
      })),
    };
    return JSON.stringify(deepResult, null, 2);
  }

  const output: string[] = [];
  
  // Header
  output.push('');
  output.push(chalk.cyan.bold('🐆 The Weakest Lynx - Deep Scan Results'));
  output.push(chalk.gray('═'.repeat(80)));
  
  // Summary line
  output.push(
    `${chalk.bold(result.target)}@${result.version} | ` +
    `Score: ${colorScore(result.securityScore)} | ` +
    `Deps: ${result.dependencies.length} | ` +
    `Vulns: ${result.summary.total > 0 ? chalk.red(result.summary.total) : chalk.green('0')}`
  );
  
  if (result.summary.total > 0) {
    const parts: string[] = [];
    if (result.summary.critical > 0) parts.push(chalk.red(`${result.summary.critical}C`));
    if (result.summary.high > 0) parts.push(chalk.hex('#FFA500')(`${result.summary.high}H`));
    if (result.summary.medium > 0) parts.push(chalk.yellow(`${result.summary.medium}M`));
    if (result.summary.low > 0) parts.push(chalk.green(`${result.summary.low}L`));
    output.push(`Breakdown: ${parts.join(' ')}`);
  }
  output.push(chalk.gray('─'.repeat(80)));
  
  // Group vulnerabilities by package
  const vulnsByPackage = new Map<string, typeof result.vulnerabilities>();
  for (const vuln of result.vulnerabilities) {
    const existing = vulnsByPackage.get(vuln.package) || [];
    existing.push(vuln);
    vulnsByPackage.set(vuln.package, existing);
  }
  
  // Sort dependencies: vulnerable first, then direct, then by name
  const sortedDeps = [...result.dependencies].sort((a, b) => {
    if (a.vulnerabilityCount !== b.vulnerabilityCount) {
      return b.vulnerabilityCount - a.vulnerabilityCount;
    }
    if (a.direct !== b.direct) {
      return a.direct ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  
  // Separate vulnerable and clean dependencies
  const vulnerableDeps = sortedDeps.filter(d => d.vulnerabilityCount > 0);
  const cleanDeps = sortedDeps.filter(d => d.vulnerabilityCount === 0);
  
  // Show vulnerable dependencies with details
  if (vulnerableDeps.length > 0) {
    output.push(chalk.red.bold(`\n⚠ Vulnerable Dependencies (${vulnerableDeps.length}):`));
    output.push('');
    
    for (const dep of vulnerableDeps) {
      const depVulns = vulnsByPackage.get(dep.name) || [];
      const icon = dep.maxSeverity === 'critical' ? chalk.red('✗') : 
                   dep.maxSeverity === 'high' ? chalk.hex('#FFA500')('⚠') :
                   dep.maxSeverity === 'medium' ? chalk.yellow('●') : chalk.blue('○');
      
      const directTag = dep.direct ? chalk.cyan('D') : chalk.gray('T');
      const nameCol = `${dep.name}@${dep.version}`.padEnd(40);
      
      output.push(`${icon} [${directTag}] ${nameCol} ${colorSeverity(dep.maxSeverity)} (${depVulns.length})`);
      
      // Show CVE IDs inline
      for (const vuln of depVulns) {
        const fix = vuln.fixedVersion ? chalk.green(`→${vuln.fixedVersion}`) : chalk.gray('no fix');
        output.push(chalk.gray(`      └─ ${vuln.id} ${fix}`));
      }
    }
  }
  
  // Show clean dependencies in compact grid
  if (cleanDeps.length > 0) {
    output.push(chalk.green.bold(`\n✓ Clean Dependencies (${cleanDeps.length}):`));
    
    // Group into columns for compact display
    const directClean = cleanDeps.filter(d => d.direct);
    const transitiveClean = cleanDeps.filter(d => !d.direct);
    
    if (directClean.length > 0) {
      output.push(chalk.cyan(`  Direct (${directClean.length}): `) + 
        directClean.map(d => `${d.name}@${d.version}`).join(', '));
    }
    
    if (transitiveClean.length > 0) {
      // Show transitive deps in a wrapped format
      const transitiveList = transitiveClean.map(d => `${d.name}@${d.version}`);
      const maxWidth = 70;
      let currentLine = chalk.gray(`  Transitive (${transitiveClean.length}): `);
      const lines: string[] = [];
      
      for (const item of transitiveList) {
        if ((currentLine + item).length > maxWidth + 20) {
          lines.push(currentLine);
          currentLine = '    ' + item + ', ';
        } else {
          currentLine += item + ', ';
        }
      }
      if (currentLine.trim()) {
        lines.push(currentLine.slice(0, -2)); // Remove trailing comma
      }
      output.push(...lines);
    }
  }
  
  // Remediations summary
  if (result.remediations.length > 0) {
    output.push('');
    output.push(chalk.gray('─'.repeat(80)));
    output.push(chalk.bold.yellow(`📋 Fixes Available (${result.remediations.length}):`));
    
    for (const rem of result.remediations) {
      const breaking = rem.isBreaking ? chalk.red(' BREAKING') : '';
      output.push(`  ${chalk.cyan('→')} ${rem.package}: ${rem.currentVersion} → ${chalk.green(rem.targetVersion)}${breaking} (fixes ${rem.vulnerabilitiesFixed.length})`);
    }
  }
  
  output.push('');
  return output.join('\n');
}

/**
 * Format results as SARIF (for GitHub Security tab / CI integration)
 */
export function formatSarif(result: ScanResponse): string {
  const sarif = exportSarif(result);
  return JSON.stringify(sarif, null, 2);
}

/**
 * Format results as ASCII dependency tree
 */
export function formatTree(result: ScanResponse): string {
  const output: string[] = [];
  
  // Header
  output.push('');
  output.push(chalk.cyan.bold('🐆 The Weakest Lynx - Dependency Tree'));
  output.push(chalk.gray('═'.repeat(60)));
  output.push(`${chalk.bold(result.target)}@${result.version} | Score: ${colorScore(result.securityScore)}`);
  output.push('');
  
  // Build parent-child relationships
  const childrenMap = new Map<string, Dependency[]>();
  const rootDeps: Dependency[] = [];
  
  for (const dep of result.dependencies) {
    if (dep.name === result.target) {
      // Skip root package itself
      continue;
    }
    
    if (dep.parent) {
      const children = childrenMap.get(dep.parent) || [];
      children.push(dep);
      childrenMap.set(dep.parent, children);
    } else if (dep.direct) {
      rootDeps.push(dep);
    } else {
      // Transitive without parent - attach to root
      rootDeps.push(dep);
    }
  }
  
  // Sort: vulnerable first, then alphabetically
  const sortDeps = (deps: Dependency[]) => {
    return deps.sort((a, b) => {
      if (a.vulnerabilityCount !== b.vulnerabilityCount) {
        return b.vulnerabilityCount - a.vulnerabilityCount;
      }
      return a.name.localeCompare(b.name);
    });
  };
  
  // Render tree recursively
  const renderNode = (dep: Dependency, prefix: string, isLast: boolean): void => {
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';
    
    // Status icon
    let icon = chalk.green('✓');
    if (dep.vulnerabilityCount > 0) {
      switch (dep.maxSeverity) {
        case 'critical': icon = chalk.red('✗'); break;
        case 'high': icon = chalk.hex('#FFA500')('⚠'); break;
        case 'medium': icon = chalk.yellow('●'); break;
        default: icon = chalk.blue('○'); break;
      }
    }
    
    // Vulnerability badge
    let vulnBadge = '';
    if (dep.vulnerabilityCount > 0) {
      vulnBadge = chalk.red(` (${dep.vulnerabilityCount} vuln${dep.vulnerabilityCount > 1 ? 's' : ''})`);
    }
    
    output.push(`${prefix}${connector}${icon} ${dep.name}@${chalk.gray(dep.version)}${vulnBadge}`);
    
    // Render children
    const children = sortDeps(childrenMap.get(dep.name) || []);
    children.forEach((child, idx) => {
      renderNode(child, prefix + childPrefix, idx === children.length - 1);
    });
  };
  
  // Render root node
  const rootDep = result.dependencies.find(d => d.name === result.target);
  if (rootDep) {
    let rootIcon = chalk.green('✓');
    if (rootDep.vulnerabilityCount > 0) {
      rootIcon = rootDep.maxSeverity === 'critical' ? chalk.red('✗') : chalk.yellow('⚠');
    }
    output.push(`${rootIcon} ${chalk.bold(result.target)}@${result.version}`);
  } else {
    output.push(`📦 ${chalk.bold(result.target)}@${result.version}`);
  }
  
  // Render direct dependencies
  const sorted = sortDeps(rootDeps);
  sorted.forEach((dep, idx) => {
    renderNode(dep, '', idx === sorted.length - 1);
  });
  
  // Summary
  output.push('');
  output.push(chalk.gray('─'.repeat(60)));
  const vulnCount = result.summary.total;
  const depCount = result.dependencies.length;
  if (vulnCount > 0) {
    output.push(`${chalk.red('⚠')} ${depCount} dependencies, ${chalk.red.bold(vulnCount + ' vulnerabilities')}`);
  } else {
    output.push(`${chalk.green('✓')} ${depCount} dependencies, ${chalk.green.bold('0 vulnerabilities')}`);
  }
  output.push('');
  
  return output.join('\n');
}
