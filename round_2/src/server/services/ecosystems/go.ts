import { ScanRequest, ScanResponse, Dependency, Vulnerability } from '../../types.js';
import { queryOsv } from '../scanner/osv.js';
import { logger } from '../../logger.js';

interface GoModuleInfo {
  Version: string;
  Time: string;
}

export async function scanGo(request: ScanRequest): Promise<Partial<ScanResponse>> {
  const packageName = request.package!;
  const version = request.version || 'latest';
  
  logger.info({ packageName, version }, 'Scanning Go module');
  
  const dependencies = await resolveGoDependencies(packageName, version);
  const actualVersion = dependencies[0]?.version || version;
  
  // Collect all vulnerabilities from dependencies
  const vulnerabilities: Vulnerability[] = [];
  for (const dep of dependencies) {
    const vulns = await queryOsv(dep.name, 'Go', dep.version);
    vulnerabilities.push(...vulns);
  }
  
  const summary = {
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length,
    total: vulnerabilities.length,
  };
  
  logger.info({ packageName, actualVersion, dependencyCount: dependencies.length, vulnerabilityCount: vulnerabilities.length }, 'Go scan complete');
  
  return {
    ecosystem: 'go',
    target: packageName,
    version: actualVersion,
    dependencies,
    vulnerabilities,
    summary,
  };
}

async function resolveGoDependencies(
  packageName: string,
  version: string = 'latest'
): Promise<Dependency[]> {
  const dependencies: Dependency[] = [];
  const visited = new Set<string>();

  async function fetchGoModuleInfo(module: string, ver: string): Promise<GoModuleInfo | null> {
    try {
      // Use Go proxy API
      const url = ver === 'latest'
        ? `https://proxy.golang.org/${module}/@latest`
        : `https://proxy.golang.org/${module}/@v/${ver}.info`;
      
      const response = await fetch(url);
      if (!response.ok) return null;
      
      return await response.json() as GoModuleInfo;
    } catch (error) {
      logger.error({ error, module, ver }, 'Failed to fetch Go module info');
      return null;
    }
  }

  async function resolveDep(module: string, ver: string, depth: number = 0): Promise<void> {
    const key = `${module}@${ver}`;
    if (visited.has(key) || depth > 2) return;
    visited.add(key);

    const info = await fetchGoModuleInfo(module, ver);
    if (!info) return;

    const actualVersion = info.Version;
    
    // Query vulnerabilities
    const vulnerabilities = await queryOsv(module, 'Go', actualVersion);
    const severities = vulnerabilities.map(v => v.severity);
    const maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 
      severities.includes('critical') ? 'critical' :
      severities.includes('high') ? 'high' :
      severities.includes('medium') ? 'medium' :
      severities.includes('low') ? 'low' : 'none';
    
    const dep: Dependency = {
      name: module,
      version: actualVersion,
      ecosystem: 'go',
      direct: depth === 0,
      vulnerabilityCount: vulnerabilities.length,
      maxSeverity,
    };

    dependencies.push(dep);

    // Note: Go modules don't expose dependencies via proxy API easily
    // Would need to fetch go.mod file from source, which requires more complex logic
    // For now, we only scan the direct package
  }

  await resolveDep(packageName, version);
  return dependencies;
}
