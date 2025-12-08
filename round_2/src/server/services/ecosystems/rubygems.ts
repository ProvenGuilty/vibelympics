import { ScanRequest, ScanResponse, Dependency, Vulnerability } from '../../types.js';
import { queryOsv } from '../scanner/osv.js';
import { logger } from '../../logger.js';

interface RubyGemSpec {
  name: string;
  version: string;
  dependencies?: {
    runtime?: Array<{ name: string; requirements: string }>;
  };
}

export async function scanRubyGems(request: ScanRequest): Promise<Partial<ScanResponse>> {
  const packageName = request.package!;
  const version = request.version || 'latest';
  
  logger.info({ packageName, version }, 'Scanning RubyGem');
  
  const dependencies = await resolveRubyGemsDependencies(packageName, version);
  const actualVersion = dependencies[0]?.version || version;
  
  // Collect all vulnerabilities from dependencies
  const vulnerabilities: Vulnerability[] = [];
  for (const dep of dependencies) {
    const vulns = await queryOsv(dep.name, 'RubyGems', dep.version);
    vulnerabilities.push(...vulns);
  }
  
  const summary = {
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length,
    total: vulnerabilities.length,
  };
  
  logger.info({ packageName, actualVersion, dependencyCount: dependencies.length, vulnerabilityCount: vulnerabilities.length }, 'RubyGems scan complete');
  
  return {
    ecosystem: 'rubygems',
    target: packageName,
    version: actualVersion,
    dependencies,
    vulnerabilities,
    summary,
  };
}

async function resolveRubyGemsDependencies(
  packageName: string,
  version: string = 'latest'
): Promise<Dependency[]> {
  const dependencies: Dependency[] = [];
  const visited = new Set<string>();

  async function fetchGemMetadata(gem: string, ver: string): Promise<RubyGemSpec | null> {
    try {
      const url = ver === 'latest'
        ? `https://rubygems.org/api/v1/gems/${gem}.json`
        : `https://rubygems.org/api/v2/rubygems/${gem}/versions/${ver}.json`;
      
      const response = await fetch(url);
      if (!response.ok) {
        // Try latest if specific version fails
        if (ver !== 'latest') {
          const latestResponse = await fetch(`https://rubygems.org/api/v1/gems/${gem}.json`);
          if (latestResponse.ok) return await latestResponse.json() as RubyGemSpec;
        }
        return null;
      }
      
      return await response.json() as RubyGemSpec;
    } catch (error) {
      logger.error({ error, gem, ver }, 'Failed to fetch RubyGems metadata');
      return null;
    }
  }

  async function resolveDep(gem: string, ver: string, depth: number = 0): Promise<void> {
    const key = `${gem}@${ver}`;
    if (visited.has(key) || depth > 2) return;
    visited.add(key);

    const metadata = await fetchGemMetadata(gem, ver);
    if (!metadata) return;

    const actualVersion = metadata.version;
    
    // Query vulnerabilities
    const vulnerabilities = await queryOsv(gem, 'RubyGems', actualVersion);
    const severities = vulnerabilities.map(v => v.severity);
    const maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 
      severities.includes('critical') ? 'critical' :
      severities.includes('high') ? 'high' :
      severities.includes('medium') ? 'medium' :
      severities.includes('low') ? 'low' : 'none';
    
    const dep: Dependency = {
      name: gem,
      version: actualVersion,
      ecosystem: 'rubygems',
      direct: depth === 0,
      vulnerabilityCount: vulnerabilities.length,
      maxSeverity,
    };

    dependencies.push(dep);

    // Resolve runtime dependencies - always fetch latest version
    if (metadata.dependencies?.runtime && depth < 2) {
      for (const d of metadata.dependencies.runtime) {
        // Always use 'latest' to get the current version, not the minimum requirement
        await resolveDep(d.name, 'latest', depth + 1);
      }
    }
  }

  await resolveDep(packageName, version);
  return dependencies;
}
