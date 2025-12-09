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

// Note: isVersionAffected and compareVersions were removed as dead code.
// OSV API handles version filtering when version is included in the query.

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
