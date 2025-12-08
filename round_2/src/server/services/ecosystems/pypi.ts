import { ScanRequest, ScanResponse, Dependency, Vulnerability } from '../../types.js';
import { logger } from '../../logger.js';
import { queryOsv } from '../scanner/osv.js';

interface PypiPackageInfo {
  info: {
    name: string;
    version: string;
    requires_dist?: string[];
  };
}

export async function scanPypi(request: ScanRequest): Promise<Partial<ScanResponse>> {
  const packageName = request.package!;
  const version = request.version || 'latest';
  
  logger.info({ packageName, version }, 'Scanning PyPI package');
  
  // Fetch package metadata from PyPI
  const metadata = await fetchPypiMetadata(packageName, version);
  const actualVersion = metadata.info.version;
  
  // Build dependency tree
  const dependencies = await resolveDependencies(packageName, actualVersion);
  
  // Scan for vulnerabilities
  const vulnerabilities: Vulnerability[] = [];
  const vulnCountByPackage = new Map<string, { count: number; maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none' }>();
  
  for (const dep of dependencies) {
    try {
      const vulns = await queryOsv(dep.name, 'PyPI', dep.version);
      vulnerabilities.push(...vulns);
      
      // Track vulnerability counts per package
      if (vulns.length > 0) {
        const severities = vulns.map((v: Vulnerability) => v.severity);
        const maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 
          severities.includes('critical') ? 'critical' :
          severities.includes('high') ? 'high' :
          severities.includes('medium') ? 'medium' :
          severities.includes('low') ? 'low' : 'none';
        
        vulnCountByPackage.set(dep.name, {
          count: vulns.length,
          maxSeverity,
        });
      }
    } catch (error) {
      logger.warn({ error, package: dep.name }, 'Failed to query OSV for package');
    }
  }
  
  // Update dependency vulnerability counts
  for (const dep of dependencies) {
    const vulnInfo = vulnCountByPackage.get(dep.name);
    if (vulnInfo) {
      dep.vulnerabilityCount = vulnInfo.count;
      dep.maxSeverity = vulnInfo.maxSeverity;
    }
  }
  
  // Calculate summary
  const summary = {
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length,
    total: vulnerabilities.length,
  };
  
  logger.info({ 
    packageName, 
    actualVersion,
    dependencyCount: dependencies.length,
    vulnerabilityCount: vulnerabilities.length 
  }, 'PyPI scan complete');
  
  return {
    ecosystem: 'pypi',
    target: packageName,
    version: actualVersion,
    dependencies,
    vulnerabilities,
    summary,
  };
}

async function fetchPypiMetadata(packageName: string, version: string): Promise<PypiPackageInfo> {
  const url = version === 'latest'
    ? `https://pypi.org/pypi/${packageName}/json`
    : `https://pypi.org/pypi/${packageName}/${version}/json`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch PyPI metadata: ${response.statusText}`);
  }
  
  return response.json() as Promise<PypiPackageInfo>;
}

async function resolveDependencies(packageName: string, version: string): Promise<Dependency[]> {
  const dependencies: Dependency[] = [];
  const visited = new Set<string>();
  
  // Add root package
  dependencies.push({
    name: packageName,
    version,
    ecosystem: 'pypi',
    direct: true,
    vulnerabilityCount: 0,
    maxSeverity: 'none',
  });
  visited.add(`${packageName}@${version}`);
  
  // Fetch direct dependencies
  const metadata = await fetchPypiMetadata(packageName, version);
  const requiresDist = metadata.info.requires_dist || [];
  
  for (const req of requiresDist) {
    // Parse requirement (e.g., "requests (>=2.0.0)")
    const match = req.match(/^([a-zA-Z0-9_-]+)/);
    if (!match) continue;
    
    const depName = match[1];
    const key = `${depName}@latest`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    try {
      const depMetadata = await fetchPypiMetadata(depName, 'latest');
      dependencies.push({
        name: depName,
        version: depMetadata.info.version,
        ecosystem: 'pypi',
        direct: true,
        parent: packageName,
        vulnerabilityCount: 0,
        maxSeverity: 'none',
      });
    } catch (error) {
      logger.warn({ error, package: depName }, 'Failed to resolve dependency');
    }
  }
  
  return dependencies;
}
