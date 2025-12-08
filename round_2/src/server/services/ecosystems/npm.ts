import { ScanRequest, ScanResponse, Dependency, Vulnerability } from '../../types.js';
import { queryOsv } from '../scanner/osv.js';
import { logger } from '../../logger.js';

interface NpmPackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function scanNpm(request: ScanRequest): Promise<Partial<ScanResponse>> {
  const packageName = request.package!;
  const version = request.version || 'latest';
  
  logger.info({ packageName, version }, 'Scanning npm package');
  
  const dependencies = await resolveNpmDependencies(packageName, version);
  const actualVersion = dependencies[0]?.version || version;
  
  // Collect all vulnerabilities from dependencies (already queried during resolution)
  const vulnerabilities: Vulnerability[] = [];
  for (const dep of dependencies) {
    const vulns = await queryOsv(dep.name, 'npm', dep.version);
    vulnerabilities.push(...vulns);
  }
  
  const summary = {
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length,
    total: vulnerabilities.length,
  };
  
  logger.info({ packageName, actualVersion, dependencyCount: dependencies.length, vulnerabilityCount: vulnerabilities.length }, 'npm scan complete');
  
  return {
    ecosystem: 'npm',
    target: packageName,
    version: actualVersion,
    dependencies,
    vulnerabilities,
    summary,
  };
}

async function resolveNpmDependencies(
  packageName: string,
  version: string = 'latest'
): Promise<Dependency[]> {
  const dependencies: Dependency[] = [];
  const visited = new Set<string>();

  async function fetchNpmMetadata(pkg: string, ver: string): Promise<NpmPackageJson | null> {
    try {
      const url = ver === 'latest' 
        ? `https://registry.npmjs.org/${pkg}/latest`
        : `https://registry.npmjs.org/${pkg}/${ver}`;
      
      const response = await fetch(url);
      if (!response.ok) return null;
      
      return await response.json() as NpmPackageJson;
    } catch (error) {
      logger.error({ error, pkg, ver }, 'Failed to fetch npm metadata');
      return null;
    }
  }

  async function resolveDep(pkg: string, ver: string, depth: number = 0): Promise<void> {
    const key = `${pkg}@${ver}`;
    if (visited.has(key) || depth > 3) return;
    visited.add(key);

    const metadata = await fetchNpmMetadata(pkg, ver);
    if (!metadata) return;

    const actualVersion = metadata.version;
    
    // Query vulnerabilities
    const vulnerabilities = await queryOsv(pkg, 'npm', actualVersion);
    
    const severities = vulnerabilities.map(v => v.severity);
    const maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 
      severities.includes('critical') ? 'critical' :
      severities.includes('high') ? 'high' :
      severities.includes('medium') ? 'medium' :
      severities.includes('low') ? 'low' : 'none';

    const dep: Dependency = {
      name: pkg,
      version: actualVersion,
      ecosystem: 'npm',
      direct: depth === 0,
      vulnerabilityCount: vulnerabilities.length,
      maxSeverity,
    };

    dependencies.push(dep);

    // Resolve dependencies (production only, skip devDependencies)
    // Use 'latest' to get current versions, not minimum requirements
    if (metadata.dependencies && depth < 2) {
      for (const [depName] of Object.entries(metadata.dependencies)) {
        await resolveDep(depName, 'latest', depth + 1);
      }
    }
  }

  await resolveDep(packageName, version);
  return dependencies;
}
