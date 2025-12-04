export interface Vulnerability {
  id: string;           // CVE-2024-1234
  severity: 'critical' | 'high' | 'medium' | 'low';
  package: string;      // openssl
  version: string;      // 1.1.1k
  fixedIn: string;      // 1.1.1l or 'No fix available'
  description: string;  // Brief description
}

export interface Container {
  id: string;
  name: string;
  emoji: string;
  tag: string;
  signed: boolean;
  maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  vulnCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  vulnerabilities: Vulnerability[];  // Actual vulnerability details
  rating: number; // 1-5 Uber-style rating
  burritoScore: number; // 1-100 burrito health score
  hat: string; // Current hat emoji
  lastScanned: string;
  sbomPackages: number;
  isChainGuard: boolean; // Is this a Chainguard image?
  labels: string[]; // User-defined labels
  registry: string; // Source registry
}

// Sample CVE data for generating realistic vulnerabilities
const sampleVulns = {
  critical: [
    { pkg: 'openssl', desc: 'Remote code execution via buffer overflow in SSL handshake' },
    { pkg: 'log4j', desc: 'JNDI injection allowing remote code execution (Log4Shell)' },
    { pkg: 'glibc', desc: 'Heap buffer overflow in __vsyslog_internal' },
    { pkg: 'curl', desc: 'SOCKS5 heap buffer overflow' },
  ],
  high: [
    { pkg: 'libxml2', desc: 'Use-after-free vulnerability in xmlXPathCompOpEval' },
    { pkg: 'zlib', desc: 'Heap-based buffer over-read in inflate' },
    { pkg: 'expat', desc: 'Integer overflow in storeRawNames' },
    { pkg: 'sqlite', desc: 'Potential denial of service via malformed database' },
    { pkg: 'openssh', desc: 'Authentication bypass in keyboard-interactive' },
  ],
  medium: [
    { pkg: 'python', desc: 'ReDoS vulnerability in email parsing module' },
    { pkg: 'nodejs', desc: 'HTTP request smuggling via malformed headers' },
    { pkg: 'libpng', desc: 'Integer overflow in png_set_text_2' },
    { pkg: 'freetype', desc: 'Out-of-bounds write in Load_SBit_Png' },
    { pkg: 'pcre2', desc: 'Out-of-bounds read in compile_xclass_matchingpath' },
    { pkg: 'krb5', desc: 'Memory leak in KDC TGS handling' },
  ],
  low: [
    { pkg: 'bash', desc: 'Possible information disclosure via PS4 variable' },
    { pkg: 'coreutils', desc: 'Race condition in recursive directory operations' },
    { pkg: 'tar', desc: 'Improper handling of extended attributes' },
    { pkg: 'grep', desc: 'Stack exhaustion with deeply nested patterns' },
    { pkg: 'sed', desc: 'Heap buffer overflow with large line numbers' },
  ],
};

// Helper to generate mock vulnerabilities based on counts
function generateVulnerabilities(vulnCount: { critical: number; high: number; medium: number; low: number }): Vulnerability[] {
  const vulns: Vulnerability[] = [];
  const year = 2024;
  let cveNum = 1000 + Math.floor(Math.random() * 9000);
  
  const addVulns = (severity: 'critical' | 'high' | 'medium' | 'low', count: number) => {
    const samples = sampleVulns[severity];
    for (let i = 0; i < count && i < 10; i++) { // Cap at 10 per severity for display
      const sample = samples[i % samples.length];
      vulns.push({
        id: `CVE-${year}-${cveNum++}`,
        severity,
        package: sample.pkg,
        version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`,
        fixedIn: Math.random() > 0.3 ? `${Math.floor(Math.random() * 3) + 2}.${Math.floor(Math.random() * 10)}.0` : 'No fix available',
        description: sample.desc,
      });
    }
  };
  
  addVulns('critical', vulnCount.critical);
  addVulns('high', vulnCount.high);
  addVulns('medium', vulnCount.medium);
  addVulns('low', vulnCount.low);
  
  return vulns;
}

// Mock container data with Chainguard-themed names
export const mockContainers: Container[] = [
  {
    id: 'cg-node-001',
    name: '📦node',
    emoji: '💚',
    tag: 'latest',
    signed: true,
    maxSeverity: 'none',
    vulnCount: { critical: 0, high: 0, medium: 0, low: 0 },
    vulnerabilities: [],
    rating: 5,
    burritoScore: 100,
    hat: '🎩',
    lastScanned: '2024-12-03T10:00:00Z',
    sbomPackages: 42,
    isChainGuard: true,
    labels: ['production', 'web'],
    registry: 'cgr.dev/chainguard',
  },
  {
    id: 'cg-python-002',
    name: '📦python',
    emoji: '🐍',
    tag: 'latest',
    signed: true,
    maxSeverity: 'low',
    vulnCount: { critical: 0, high: 0, medium: 0, low: 2 },
    vulnerabilities: generateVulnerabilities({ critical: 0, high: 0, medium: 0, low: 2 }),
    rating: 4.8,
    burritoScore: 95,
    hat: '🧢',
    lastScanned: '2024-12-03T09:30:00Z',
    sbomPackages: 156,
    isChainGuard: true,
    labels: ['ml', 'data'],
    registry: 'cgr.dev/chainguard',
  },
  {
    id: 'cg-nginx-003',
    name: '📦nginx',
    emoji: '🌐',
    tag: 'latest',
    signed: true,
    maxSeverity: 'none',
    vulnCount: { critical: 0, high: 0, medium: 0, low: 0 },
    vulnerabilities: [],
    rating: 5,
    burritoScore: 100,
    hat: '👒',
    lastScanned: '2024-12-03T08:45:00Z',
    sbomPackages: 23,
    isChainGuard: true,
    labels: ['proxy', 'web'],
    registry: 'cgr.dev/chainguard',
  },
  {
    id: 'legacy-app-004',
    name: '📦legacy-app',
    emoji: '👴',
    tag: 'v1.2.3',
    signed: false,
    maxSeverity: 'critical',
    vulnCount: { critical: 3, high: 12, medium: 45, low: 89 },
    vulnerabilities: generateVulnerabilities({ critical: 3, high: 12, medium: 45, low: 89 }),
    rating: 1.2,
    burritoScore: 15,
    hat: '🎓',
    lastScanned: '2024-11-15T14:20:00Z',
    sbomPackages: 892,
    isChainGuard: false,
    labels: ['legacy', 'deprecated'],
    registry: 'docker.io',
  },
  {
    id: 'cg-go-005',
    name: '📦go',
    emoji: '🐹',
    tag: 'latest',
    signed: true,
    maxSeverity: 'none',
    vulnCount: { critical: 0, high: 0, medium: 0, low: 0 },
    vulnerabilities: [],
    rating: 5,
    burritoScore: 100,
    hat: '🤠',
    lastScanned: '2024-12-03T11:00:00Z',
    sbomPackages: 18,
    isChainGuard: true,
    labels: ['api', 'microservice'],
    registry: 'cgr.dev/chainguard',
  },
  {
    id: 'old-redis-006',
    name: '📦redis',
    emoji: '🔴',
    tag: 'v5.0.0',
    signed: false,
    maxSeverity: 'high',
    vulnCount: { critical: 0, high: 5, medium: 12, low: 8 },
    vulnerabilities: generateVulnerabilities({ critical: 0, high: 5, medium: 12, low: 8 }),
    rating: 2.5,
    burritoScore: 45,
    hat: '🎭',
    lastScanned: '2024-12-01T16:30:00Z',
    sbomPackages: 67,
    isChainGuard: false,
    labels: ['cache', 'database'],
    registry: 'docker.io',
  },
  {
    id: 'cg-rust-007',
    name: '📦rust',
    emoji: '🦀',
    tag: 'latest',
    signed: true,
    maxSeverity: 'none',
    vulnCount: { critical: 0, high: 0, medium: 0, low: 0 },
    vulnerabilities: [],
    rating: 5,
    burritoScore: 100,
    hat: '⛑️',
    lastScanned: '2024-12-03T10:30:00Z',
    sbomPackages: 31,
    isChainGuard: true,
    labels: ['systems', 'performance'],
    registry: 'cgr.dev/chainguard',
  },
  {
    id: 'sketchy-img-008',
    name: '📦mystery-box',
    emoji: '❓',
    tag: 'yolo',
    signed: false,
    maxSeverity: 'critical',
    vulnCount: { critical: 15, high: 42, medium: 78, low: 234 },
    vulnerabilities: generateVulnerabilities({ critical: 15, high: 42, medium: 78, low: 234 }),
    rating: 0.5,
    burritoScore: 3,
    hat: '🃏',
    lastScanned: '2024-06-01T00:00:00Z',
    sbomPackages: 1847,
    isChainGuard: false,
    labels: ['unknown', 'risky'],
    registry: 'docker.io',
  },
  {
    id: 'cg-wolfi-009',
    name: '📦wolfi-base',
    emoji: '🐺',
    tag: 'latest',
    signed: true,
    maxSeverity: 'none',
    vulnCount: { critical: 0, high: 0, medium: 0, low: 0 },
    vulnerabilities: [],
    rating: 5,
    burritoScore: 100,
    hat: '👑',
    lastScanned: '2024-12-03T11:30:00Z',
    sbomPackages: 12,
    isChainGuard: true,
    labels: ['base', 'minimal'],
    registry: 'cgr.dev/chainguard',
  },
  {
    id: 'med-vuln-010',
    name: '📦postgres',
    emoji: '🐘',
    tag: 'v14.2',
    signed: true,
    maxSeverity: 'medium',
    vulnCount: { critical: 0, high: 0, medium: 4, low: 11 },
    vulnerabilities: generateVulnerabilities({ critical: 0, high: 0, medium: 4, low: 11 }),
    rating: 3.8,
    burritoScore: 72,
    hat: '🎪',
    lastScanned: '2024-12-02T20:00:00Z',
    sbomPackages: 145,
    isChainGuard: false,
    labels: ['database', 'production'],
    registry: 'docker.io',
  },
];

// Linky's available hats
export const availableHats = ['🎩', '🧢', '👒', '🎓', '🤠', '⛑️', '👑', '🎭', '🪖', '🎪', '🃏'];

// Severity to emoji mapping
export const severityEmoji = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
  none: '⚪',
};
