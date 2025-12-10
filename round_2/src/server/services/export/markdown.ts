import { ScanResponse } from '../../types.js';

export function exportMarkdown(scan: ScanResponse & { packageScans?: any[]; isManifestScan?: boolean }): string {
  const lines: string[] = [];
  
  lines.push(`# Security Scan Report: ${scan.target}`);
  lines.push('');
  lines.push(`**Ecosystem:** ${scan.ecosystem}`);
  lines.push(`**Version:** ${scan.version}`);
  lines.push(`**Scan Date:** ${scan.scanDate}`);
  lines.push(`**Security Score:** ${scan.securityScore}/100`);
  lines.push('');
  
  lines.push('## Summary');
  lines.push('');
  lines.push(`- 🔴 Critical: ${scan.summary.critical}`);
  lines.push(`- 🟠 High: ${scan.summary.high}`);
  lines.push(`- 🟡 Medium: ${scan.summary.medium}`);
  lines.push(`- 🟢 Low: ${scan.summary.low}`);
  lines.push(`- **Total:** ${scan.summary.total}`);
  lines.push('');
  
  // Package breakdown for manifest scans
  if (scan.isManifestScan && scan.packageScans && scan.packageScans.length > 0) {
    lines.push('## Packages Scanned');
    lines.push('');
    lines.push('| Package | Version | Score | Critical | High | Medium | Low |');
    lines.push('|---------|---------|-------|----------|------|--------|-----|');
    
    // Sort by total vulns descending
    const sorted = [...scan.packageScans].sort((a, b) => (b.summary?.total || 0) - (a.summary?.total || 0));
    
    for (const pkg of sorted) {
      const s = pkg.summary || { critical: 0, high: 0, medium: 0, low: 0 };
      lines.push(`| ${pkg.name} | ${pkg.version} | ${pkg.securityScore}/100 | ${s.critical} | ${s.high} | ${s.medium} | ${s.low} |`);
    }
    lines.push('');
  }
  
  if (scan.vulnerabilities.length > 0) {
    lines.push('## Vulnerabilities');
    lines.push('');
    
    for (const vuln of scan.vulnerabilities) {
      lines.push(`### ${vuln.id} (${vuln.severity.toUpperCase()})`);
      lines.push('');
      lines.push(`**Package:** ${vuln.package}@${vuln.installedVersion}`);
      if (vuln.fixedVersion) {
        lines.push(`**Fixed in:** ${vuln.fixedVersion}`);
      }
      if (vuln.cvss) {
        lines.push(`**CVSS Score:** ${vuln.cvss}`);
      }
      lines.push('');
      lines.push(vuln.description);
      lines.push('');
      
      if (vuln.references.length > 0) {
        lines.push('**References:**');
        for (const ref of vuln.references) {
          lines.push(`- ${ref}`);
        }
        lines.push('');
      }
    }
  }
  
  if (scan.remediations.length > 0) {
    lines.push('## Recommended Remediations');
    lines.push('');
    
    for (const rem of scan.remediations) {
      lines.push(`### ${rem.package}: ${rem.currentVersion} → ${rem.targetVersion}`);
      lines.push('');
      lines.push(`**Risk Level:** ${rem.riskLevel}`);
      lines.push(`**Breaking Change:** ${rem.isBreaking ? 'Yes ⚠️' : 'No ✅'}`);
      lines.push(`**Fixes:** ${rem.vulnerabilitiesFixed.join(', ')}`);
      lines.push('');
      
      if (rem.breakingChanges && rem.breakingChanges.length > 0) {
        lines.push('**Breaking Changes:**');
        for (const bc of rem.breakingChanges) {
          lines.push(`- ${bc.type.toUpperCase()}: ${bc.description}`);
        }
        lines.push('');
      }
      
      if (rem.migrationGuideUrl) {
        lines.push(`**Migration Guide:** ${rem.migrationGuideUrl}`);
        lines.push('');
      }
    }
  }
  
  return lines.join('\n');
}
