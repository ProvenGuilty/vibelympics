/**
 * SARIF (Static Analysis Results Interchange Format) Exporter
 * 
 * Exports scan results in SARIF 2.1.0 format for GitHub Security tab
 * and other SARIF-compatible tools.
 * 
 * Spec: https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html
 */

import { ScanResponse, Vulnerability } from '../../types.js';

interface SarifReport {
  $schema: string;
  version: string;
  runs: SarifRun[];
}

interface SarifRun {
  tool: {
    driver: {
      name: string;
      version: string;
      informationUri: string;
      rules: SarifRule[];
    };
  };
  results: SarifResult[];
  invocations: SarifInvocation[];
}

interface SarifRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  fullDescription?: { text: string };
  helpUri?: string;
  defaultConfiguration: {
    level: 'error' | 'warning' | 'note' | 'none';
  };
  properties?: {
    tags?: string[];
    'security-severity'?: string;
  };
}

interface SarifResult {
  ruleId: string;
  level: 'error' | 'warning' | 'note' | 'none';
  message: { text: string };
  locations?: SarifLocation[];
  partialFingerprints?: Record<string, string>;
  properties?: Record<string, unknown>;
}

interface SarifLocation {
  physicalLocation?: {
    artifactLocation: {
      uri: string;
      uriBaseId?: string;
    };
  };
  logicalLocations?: Array<{
    name: string;
    fullyQualifiedName: string;
    kind: string;
  }>;
}

interface SarifInvocation {
  executionSuccessful: boolean;
  endTimeUtc: string;
  toolExecutionNotifications?: Array<{
    level: string;
    message: { text: string };
  }>;
}

/**
 * Map vulnerability severity to SARIF level
 */
function severityToLevel(severity: string): 'error' | 'warning' | 'note' {
  switch (severity.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
    default:
      return 'note';
  }
}

/**
 * Map severity to CVSS-like score for security-severity property
 */
function severityToScore(severity: string, cvss?: number): string {
  if (cvss) return cvss.toFixed(1);
  
  switch (severity.toLowerCase()) {
    case 'critical': return '9.0';
    case 'high': return '7.0';
    case 'medium': return '4.0';
    case 'low': return '2.0';
    default: return '0.0';
  }
}

/**
 * Export scan results to SARIF format
 */
export function exportSarif(scan: ScanResponse): SarifReport {
  // Build rules from unique vulnerabilities
  const rulesMap = new Map<string, SarifRule>();
  
  for (const vuln of scan.vulnerabilities) {
    if (!rulesMap.has(vuln.id)) {
      rulesMap.set(vuln.id, {
        id: vuln.id,
        name: vuln.id,
        shortDescription: {
          text: `${vuln.severity.toUpperCase()} vulnerability in ${vuln.package}`,
        },
        fullDescription: {
          text: vuln.description || `Security vulnerability ${vuln.id} affecting ${vuln.package}`,
        },
        helpUri: vuln.references[0] || `https://osv.dev/vulnerability/${vuln.id}`,
        defaultConfiguration: {
          level: severityToLevel(vuln.severity),
        },
        properties: {
          tags: ['security', 'dependency', vuln.severity],
          'security-severity': severityToScore(vuln.severity, vuln.cvss),
        },
      });
    }
  }

  // Build results
  const results: SarifResult[] = scan.vulnerabilities.map(vuln => ({
    ruleId: vuln.id,
    level: severityToLevel(vuln.severity),
    message: {
      text: buildResultMessage(vuln),
    },
    locations: [
      {
        logicalLocations: [
          {
            name: vuln.package,
            fullyQualifiedName: `${scan.ecosystem}:${vuln.package}@${vuln.installedVersion}`,
            kind: 'package',
          },
        ],
      },
    ],
    partialFingerprints: {
      primaryLocationLineHash: `${vuln.id}:${vuln.package}:${vuln.installedVersion}`,
    },
    properties: {
      ecosystem: scan.ecosystem,
      package: vuln.package,
      installedVersion: vuln.installedVersion,
      fixedVersion: vuln.fixedVersion || null,
      cvss: vuln.cvss || null,
    },
  }));

  const report: SarifReport = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'The Weakest Lynx',
            version: '1.0.0',
            informationUri: 'https://github.com/ProvenGuilty/vibelympics',
            rules: Array.from(rulesMap.values()),
          },
        },
        results,
        invocations: [
          {
            executionSuccessful: scan.status !== 'error',
            endTimeUtc: scan.scanDate,
          },
        ],
      },
    ],
  };

  return report;
}

/**
 * Build a descriptive message for a vulnerability result
 */
function buildResultMessage(vuln: Vulnerability): string {
  let msg = `${vuln.severity.toUpperCase()} severity vulnerability found in ${vuln.package}@${vuln.installedVersion}.`;
  
  if (vuln.fixedVersion) {
    msg += ` Upgrade to version ${vuln.fixedVersion} to fix.`;
  } else {
    msg += ' No fix is currently available.';
  }
  
  if (vuln.description) {
    // Truncate long descriptions
    const desc = vuln.description.length > 200 
      ? vuln.description.slice(0, 197) + '...'
      : vuln.description;
    msg += ` ${desc}`;
  }
  
  return msg;
}
