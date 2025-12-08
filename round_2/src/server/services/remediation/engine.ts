import { Vulnerability, Dependency, Remediation } from '../../types.js';
import { logger } from '../../logger.js';
import { fetchChangelog, parseBreakingChanges } from './changelog.js';
import { getPatterns } from './patterns.js';

export async function generateRemediations(
  vulnerabilities: Vulnerability[],
  dependencies: Dependency[]
): Promise<Remediation[]> {
  const remediations: Remediation[] = [];
  
  // Group vulnerabilities by package
  const vulnsByPackage = new Map<string, Vulnerability[]>();
  for (const vuln of vulnerabilities) {
    const existing = vulnsByPackage.get(vuln.package) || [];
    existing.push(vuln);
    vulnsByPackage.set(vuln.package, existing);
  }
  
  // Generate remediation for each vulnerable package
  for (const [packageName, vulns] of vulnsByPackage) {
    const dep = dependencies.find(d => d.name === packageName);
    if (!dep) continue;
    
    // Find the minimum version that fixes all vulnerabilities
    const fixedVersions = vulns
      .map(v => v.fixedVersion)
      .filter((v): v is string => v !== undefined);
    
    if (fixedVersions.length === 0) {
      logger.warn({ packageName }, 'No fixed version available for vulnerabilities');
      continue;
    }
    
    // For simplicity, use the highest fixed version
    const targetVersion = fixedVersions.sort().reverse()[0];
    
    // Determine if this is a breaking change (major version bump)
    const isBreaking = isBreakingChange(dep.version, targetVersion);
    
    // Fetch changelog and parse breaking changes
    let breakingChanges = undefined;
    let changelogUrl = undefined;
    let migrationGuideUrl = undefined;
    
    if (isBreaking) {
      try {
        const patterns = getPatterns(dep.ecosystem, packageName, targetVersion);
        breakingChanges = patterns?.breakingChanges;
        migrationGuideUrl = patterns?.migrationGuide;
        changelogUrl = patterns?.changelog;
      } catch (error) {
        logger.warn({ error, packageName }, 'Failed to fetch breaking change info');
      }
    }
    
    remediations.push({
      id: `rem-${packageName}-${Date.now()}`,
      package: packageName,
      currentVersion: dep.version,
      targetVersion,
      vulnerabilitiesFixed: vulns.map(v => v.id),
      riskLevel: isBreaking ? 'high' : 'low',
      isBreaking,
      breakingChanges,
      migrationGuideUrl,
      changelogUrl,
    });
  }
  
  return remediations;
}

function isBreakingChange(currentVersion: string, targetVersion: string): boolean {
  // Simple semver major version check
  const currentMajor = parseInt(currentVersion.split('.')[0]);
  const targetMajor = parseInt(targetVersion.split('.')[0]);
  return targetMajor > currentMajor;
}
