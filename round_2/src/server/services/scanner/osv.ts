import { Vulnerability } from '../../types.js';
import { logger } from '../../logger.js';

const OSV_API = 'https://api.osv.dev/v1';

interface OsvQuery {
  package: {
    name: string;
    ecosystem: string;
  };
  version: string;
}

interface OsvVulnerability {
  id: string;
  summary: string;
  details: string;
  severity?: { type: string; score: string }[];
  affected: {
    package: { name: string; ecosystem: string };
    ranges: { type: string; events: { introduced?: string; fixed?: string }[] }[];
    versions?: string[];
  }[];
  references: { type: string; url: string }[];
}

export async function queryOsv(pkg: string, ecosystem: string, version: string): Promise<Vulnerability[]> {
  try {
    logger.debug({ pkg, ecosystem, version }, 'Querying OSV API');
    
    // Query WITH version to let OSV do the filtering (more accurate)
    const response = await fetch(`${OSV_API}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: { name: pkg, ecosystem },
        version: version,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ pkg, ecosystem, version, status: response.status, errorText }, 'OSV API returned error');
      throw new Error(`OSV API error: ${response.statusText}`);
    }
    
    const data = await response.json() as { vulns?: OsvVulnerability[] };
    const vulns: OsvVulnerability[] = data.vulns || [];
    
    logger.debug({ 
      pkg, 
      ecosystem, 
      version, 
      vulnCount: vulns.length 
    }, 'OSV query complete');
    
    return vulns.map(v => convertOsvToVulnerability(v, pkg, version));
  } catch (error: any) {
    logger.error({ error: error.message, pkg, ecosystem, version }, 'OSV query failed');
    return [];
  }
}

function isVersionAffected(vuln: OsvVulnerability, version: string): boolean {
  // If no affected info, assume it might be relevant (conservative approach)
  if (!vuln.affected || vuln.affected.length === 0) {
    return true;
  }
  
  for (const affected of vuln.affected) {
    // Check if version is explicitly listed
    if (affected.versions && affected.versions.includes(version)) {
      return true;
    }
    
    // Check ranges
    for (const range of affected.ranges) {
      if (range.type === 'ECOSYSTEM' || range.type === 'SEMVER') {
        let isAffected = false;
        let hasIntroduced = false;
        
        for (const event of range.events) {
          if (event.introduced !== undefined) {
            hasIntroduced = true;
            const introduced = event.introduced;
            
            // "0" means all versions from the start
            if (introduced === '0' || compareVersions(version, introduced) >= 0) {
              isAffected = true;
            }
          }
          
          if (event.fixed !== undefined && isAffected) {
            const fixed = event.fixed;
            // If our version is >= fixed version, it's not affected
            if (compareVersions(version, fixed) >= 0) {
              isAffected = false;
            }
          }
        }
        
        // If no introduced event was found, be conservative and include it
        if (!hasIntroduced) {
          return true;
        }
        
        if (isAffected) {
          return true;
        }
      }
    }
  }
  
  return false;
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(p => parseInt(p) || 0);
  const parts2 = v2.split('.').map(p => parseInt(p) || 0);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  
  return 0;
}

function convertOsvToVulnerability(osv: OsvVulnerability, pkg: string, installedVersion: string): Vulnerability {
  // Determine severity from CVSS score or default to medium
  let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
  let cvss: number | undefined;
  
  if (osv.severity && osv.severity.length > 0) {
    const cvssScore = parseFloat(osv.severity[0].score);
    cvss = cvssScore;
    
    if (cvssScore >= 9.0) severity = 'critical';
    else if (cvssScore >= 7.0) severity = 'high';
    else if (cvssScore >= 4.0) severity = 'medium';
    else severity = 'low';
  }
  
  // Find fixed version
  let fixedVersion: string | undefined;
  for (const affected of osv.affected) {
    for (const range of affected.ranges) {
      for (const event of range.events) {
        if (event.fixed) {
          fixedVersion = event.fixed;
          break;
        }
      }
      if (fixedVersion) break;
    }
    if (fixedVersion) break;
  }
  
  return {
    id: osv.id,
    severity,
    cvss,
    package: pkg,
    installedVersion,
    fixedVersion,
    description: osv.summary || osv.details || 'No description available',
    references: osv.references.map(r => r.url),
  };
}
