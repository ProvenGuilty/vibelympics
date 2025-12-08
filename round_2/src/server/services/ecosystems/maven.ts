import { ScanRequest, ScanResponse, Dependency, Vulnerability } from '../../types.js';
import { queryOsv } from '../scanner/osv.js';
import { logger } from '../../logger.js';
import { parseStringPromise } from 'xml2js';

export async function scanMaven(request: ScanRequest): Promise<Partial<ScanResponse>> {
  const packageName = request.package!;
  const version = request.version || 'latest';
  
  logger.info({ packageName, version }, 'Scanning Maven package');
  
  const dependencies = await resolveMavenDependencies(packageName, version);
  const actualVersion = dependencies[0]?.version || version;
  
  // Collect all vulnerabilities from dependencies
  const vulnerabilities: Vulnerability[] = [];
  for (const dep of dependencies) {
    const vulns = await queryOsv(dep.name, 'Maven', dep.version);
    vulnerabilities.push(...vulns);
  }
  
  const summary = {
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length,
    total: vulnerabilities.length,
  };
  
  logger.info({ packageName, actualVersion, dependencyCount: dependencies.length, vulnerabilityCount: vulnerabilities.length }, 'Maven scan complete');
  
  return {
    ecosystem: 'maven',
    target: packageName,
    version: actualVersion,
    dependencies,
    vulnerabilities,
    summary,
  };
}

interface MavenMetadata {
  groupId: string;
  artifactId: string;
  version: string;
  dependencies?: Array<{
    groupId: string;
    artifactId: string;
    version: string;
    scope?: string;
  }>;
}

export async function resolveMavenDependencies(
  packageName: string,
  version: string = 'latest'
): Promise<Dependency[]> {
  const dependencies: Dependency[] = [];
  const visited = new Set<string>();

  // Parse Maven coordinates (groupId:artifactId)
  const [groupId, artifactId] = packageName.includes(':') 
    ? packageName.split(':') 
    : ['', packageName];

  async function fetchMavenMetadata(group: string, artifact: string, ver: string): Promise<MavenMetadata | null> {
    try {
      // Fetch from Maven Central
      const groupPath = group.replace(/\./g, '/');
      
      // Get latest version if needed
      let actualVersion = ver;
      if (ver === 'latest') {
        const metadataUrl = `https://repo1.maven.org/maven2/${groupPath}/${artifact}/maven-metadata.xml`;
        const metadataResponse = await fetch(metadataUrl);
        if (metadataResponse.ok) {
          const metadataXml = await metadataResponse.text();
          const metadata = await parseStringPromise(metadataXml);
          actualVersion = metadata?.metadata?.versioning?.[0]?.latest?.[0] || 
                        metadata?.metadata?.versioning?.[0]?.release?.[0] || ver;
        }
      }

      // Fetch POM
      const pomUrl = `https://repo1.maven.org/maven2/${groupPath}/${artifact}/${actualVersion}/${artifact}-${actualVersion}.pom`;
      const pomResponse = await fetch(pomUrl);
      if (!pomResponse.ok) return null;

      const pomXml = await pomResponse.text();
      const pom = await parseStringPromise(pomXml);

      const deps = pom?.project?.dependencies?.[0]?.dependency || [];
      
      return {
        groupId: group,
        artifactId: artifact,
        version: actualVersion,
        dependencies: deps.map((d: any) => ({
          groupId: d.groupId?.[0] || '',
          artifactId: d.artifactId?.[0] || '',
          version: d.version?.[0]?.replace(/[\[\]()]/g, '') || 'latest',
          scope: d.scope?.[0] || 'compile',
        })),
      };
    } catch (error) {
      logger.error({ error, group, artifact, ver }, 'Failed to fetch Maven metadata');
      return null;
    }
  }

  async function resolveDep(group: string, artifact: string, ver: string, depth: number = 0): Promise<void> {
    const key = `${group}:${artifact}@${ver}`;
    if (visited.has(key) || depth > 2) return;
    visited.add(key);

    const metadata = await fetchMavenMetadata(group, artifact, ver);
    if (!metadata) return;

    const pkgName = `${group}:${artifact}`;
    const vulnerabilities = await queryOsv(pkgName, 'Maven', metadata.version);
    const severities = vulnerabilities.map(v => v.severity);
    const maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 
      severities.includes('critical') ? 'critical' :
      severities.includes('high') ? 'high' :
      severities.includes('medium') ? 'medium' :
      severities.includes('low') ? 'low' : 'none';
    
    const dep: Dependency = {
      name: pkgName,
      version: metadata.version,
      ecosystem: 'maven',
      direct: depth === 0,
      vulnerabilityCount: vulnerabilities.length,
      maxSeverity,
    };

    dependencies.push(dep);

    // Resolve compile-scope dependencies only
    if (metadata.dependencies && depth < 1) {
      for (const d of metadata.dependencies) {
        if (d.scope === 'compile' || !d.scope) {
          await resolveDep(d.groupId, d.artifactId, d.version, depth + 1);
        }
      }
    }
  }

  await resolveDep(groupId, artifactId, version);
  return dependencies;
}
