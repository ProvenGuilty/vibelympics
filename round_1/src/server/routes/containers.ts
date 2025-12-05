import { Router, Request, Response } from 'express';
import { mockContainers, Container, Vulnerability, availableHats, resetToDefaults } from '../data/containers.js';
import { createLogger } from '../logger.js';

const logger = createLogger('containers-api');
const router = Router();

// In-memory store for user-added containers (resets on restart)
const userContainers: Container[] = [];

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
  ],
  low: [
    { pkg: 'bash', desc: 'Possible information disclosure via PS4 variable' },
    { pkg: 'coreutils', desc: 'Race condition in recursive directory operations' },
    { pkg: 'tar', desc: 'Improper handling of extended attributes' },
    { pkg: 'grep', desc: 'Stack exhaustion with deeply nested patterns' },
  ],
};

// Simple hash function to generate consistent pseudo-random numbers from a string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Seeded random number generator for consistent results
function seededRandom(seed: number, index: number = 0): number {
  const x = Math.sin(seed + index) * 10000;
  return x - Math.floor(x);
}

// Helper to generate mock vulnerabilities based on counts (deterministic based on seed)
function generateVulnerabilities(vulnCount: { critical: number; high: number; medium: number; low: number }, seed: number): Vulnerability[] {
  const vulns: Vulnerability[] = [];
  const year = 2024;
  let cveNum = 1000 + Math.floor(seededRandom(seed, 100) * 9000);
  let seedIndex = 101;
  
  const addVulns = (severity: 'critical' | 'high' | 'medium' | 'low', count: number) => {
    const samples = sampleVulns[severity];
    for (let i = 0; i < count && i < 10; i++) {
      const sample = samples[i % samples.length];
      vulns.push({
        id: `CVE-${year}-${cveNum++}`,
        severity,
        package: sample.pkg,
        version: `${Math.floor(seededRandom(seed, seedIndex++) * 3) + 1}.${Math.floor(seededRandom(seed, seedIndex++) * 10)}.${Math.floor(seededRandom(seed, seedIndex++) * 20)}`,
        fixedIn: seededRandom(seed, seedIndex++) > 0.3 ? `${Math.floor(seededRandom(seed, seedIndex++) * 3) + 2}.${Math.floor(seededRandom(seed, seedIndex++) * 10)}.0` : 'No fix available',
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

// Helper to get all containers (mock + user-added)
const getAllContainers = () => [...mockContainers, ...userContainers];

// Get all containers
router.get('/', (_req: Request, res: Response) => {
  const all = getAllContainers();
  logger.debug({ count: all.length }, 'Fetching all containers');
  res.json(all);
});

// Get container by ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Input validation
  if (!id || typeof id !== 'string' || id.length > 50) {
    logger.warn({ id }, 'Invalid container ID requested');
    return res.status(400).json({ error: '❌🔤' });
  }
  
  const container = getAllContainers().find((c: Container) => c.id === id);
  
  if (!container) {
    logger.info({ id }, 'Container not found');
    return res.status(404).json({ error: '❓📦' });
  }
  
  logger.debug({ id, name: container.name }, 'Container found');
  res.json(container);
});

// Get containers by severity filter
router.get('/filter/:severity', (req: Request, res: Response) => {
  const { severity } = req.params;
  const validSeverities = ['critical', 'high', 'medium', 'low', 'none'];
  
  if (!validSeverities.includes(severity.toLowerCase())) {
    logger.warn({ severity }, 'Invalid severity filter');
    return res.status(400).json({ error: '❌🎚️' });
  }
  
  const filtered = getAllContainers().filter(
    (c: Container) => c.maxSeverity.toLowerCase() === severity.toLowerCase()
  );
  
  logger.debug({ severity, count: filtered.length }, 'Filtered containers by severity');
  res.json(filtered);
});

// Get summary statistics
router.get('/stats/summary', (_req: Request, res: Response) => {
  const all = getAllContainers();
  const stats = {
    total: all.length,
    signed: all.filter((c: Container) => c.signed).length,
    unsigned: all.filter((c: Container) => !c.signed).length,
    bySeverity: {
      critical: all.filter((c: Container) => c.maxSeverity === 'critical').length,
      high: all.filter((c: Container) => c.maxSeverity === 'high').length,
      medium: all.filter((c: Container) => c.maxSeverity === 'medium').length,
      low: all.filter((c: Container) => c.maxSeverity === 'low').length,
      none: all.filter((c: Container) => c.maxSeverity === 'none').length,
    },
    averageRating: all.length > 0
      ? (all.reduce((sum: number, c: Container) => sum + c.rating, 0) / all.length).toFixed(1)
      : '0.0',
  };
  
  logger.debug({ stats }, 'Generated summary statistics');
  res.json(stats);
});

// Scan a new container image (mock scan with simulated delay)
router.post('/scan', async (req: Request, res: Response) => {
  const { imageUrl, labels } = req.body;
  
  // Validate input
  if (!imageUrl || typeof imageUrl !== 'string') {
    logger.warn({ imageUrl }, 'Invalid image URL for scan');
    return res.status(400).json({ error: '❌🔗' });
  }
  
  // Validate format: supports both FQDN (registry.io/path:tag) and Docker Hub shorthand (org/image:tag or image:tag)
  const fqdnPattern = /^[a-z0-9.-]+\.[a-z]{2,}(:[0-9]+)?\/[a-z0-9._\/-]+(:[a-z0-9._-]+)?$/i;
  const dockerHubPattern = /^[a-z0-9_-]+\/[a-z0-9._-]+(:[a-z0-9._-]+)?$/i;
  const officialPattern = /^[a-z0-9._-]+(:[a-z0-9._-]+)?$/i; // Official images like "nginx:latest"
  
  const trimmedUrl = imageUrl.trim().toLowerCase(); // Normalize to lowercase for consistent hashing
  if (!fqdnPattern.test(trimmedUrl) && !dockerHubPattern.test(trimmedUrl) && !officialPattern.test(trimmedUrl)) {
    logger.warn({ imageUrl }, 'Invalid image URL format');
    return res.status(400).json({ error: '❌📦🔗' });
  }
  
  // Normalize the image reference
  let normalizedUrl = trimmedUrl;
  let registry = 'docker.io';
  
  if (fqdnPattern.test(trimmedUrl)) {
    registry = trimmedUrl.split('/')[0];
  } else if (dockerHubPattern.test(trimmedUrl)) {
    normalizedUrl = `docker.io/${trimmedUrl}`;
  } else {
    normalizedUrl = `docker.io/library/${trimmedUrl}`;
  }
  
  // Check if already scanned (in both user and mock containers)
  const imageName = trimmedUrl.split('/').pop()?.split(':')[0] || trimmedUrl.split(':')[0];
  const allContainers = getAllContainers();
  const existing = allContainers.find(c => c.name === `📦${imageName}`);
  if (existing) {
    logger.info({ imageUrl }, 'Container already scanned');
    return res.json(existing);
  }
  
  logger.info({ imageUrl, normalizedUrl }, '🔍 Starting container scan');
  
  // Simulate scan delay (1-3 seconds)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Parse image URL
  const tag = trimmedUrl.includes(':') ? trimmedUrl.split(':').pop() || 'latest' : 'latest';
  
  // Generate DETERMINISTIC scan results based on image name hash
  // This ensures the same image always gets the same vulnerability profile
  const seed = hashString(normalizedUrl);
  const rand = seededRandom(seed, 0);
  
  let maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  let vulnCount: { critical: number; high: number; medium: number; low: number };
  let signed: boolean;
  let rating: number;
  let burritoScore: number;
  
  // Chainguard images are clean, others vary based on deterministic hash
  const isChainguard = registry.includes('cgr.dev') || registry.includes('chainguard');
  
  if (isChainguard) {
    maxSeverity = 'none';
    vulnCount = { critical: 0, high: 0, medium: 0, low: 0 };
    signed = true;
    rating = 5;
    burritoScore = 100;
  } else if (rand < 0.2) {
    // 20% chance: clean image
    maxSeverity = 'none';
    vulnCount = { critical: 0, high: 0, medium: 0, low: Math.floor(seededRandom(seed, 1) * 3) };
    signed = seededRandom(seed, 2) > 0.3;
    rating = 4.5 + seededRandom(seed, 3) * 0.5;
    burritoScore = 90 + Math.floor(seededRandom(seed, 4) * 10);
  } else if (rand < 0.5) {
    // 30% chance: low/medium vulns
    maxSeverity = seededRandom(seed, 5) > 0.5 ? 'medium' : 'low';
    vulnCount = {
      critical: 0,
      high: 0,
      medium: Math.floor(seededRandom(seed, 6) * 8),
      low: Math.floor(seededRandom(seed, 7) * 15),
    };
    signed = seededRandom(seed, 8) > 0.4;
    rating = 3 + seededRandom(seed, 9) * 1.5;
    burritoScore = 60 + Math.floor(seededRandom(seed, 10) * 25);
  } else if (rand < 0.8) {
    // 30% chance: high vulns
    maxSeverity = 'high';
    vulnCount = {
      critical: 0,
      high: Math.floor(seededRandom(seed, 11) * 10) + 1,
      medium: Math.floor(seededRandom(seed, 12) * 20),
      low: Math.floor(seededRandom(seed, 13) * 30),
    };
    signed = seededRandom(seed, 14) > 0.6;
    rating = 2 + seededRandom(seed, 15) * 1;
    burritoScore = 30 + Math.floor(seededRandom(seed, 16) * 30);
  } else {
    // 20% chance: critical vulns
    maxSeverity = 'critical';
    vulnCount = {
      critical: Math.floor(seededRandom(seed, 17) * 5) + 1,
      high: Math.floor(seededRandom(seed, 18) * 15),
      medium: Math.floor(seededRandom(seed, 19) * 30),
      low: Math.floor(seededRandom(seed, 20) * 50),
    };
    signed = seededRandom(seed, 21) > 0.8;
    rating = 0.5 + seededRandom(seed, 22) * 1.5;
    burritoScore = 5 + Math.floor(seededRandom(seed, 23) * 25);
  }
  
  // Adjust maxSeverity based on actual counts
  if (vulnCount.critical > 0) maxSeverity = 'critical';
  else if (vulnCount.high > 0) maxSeverity = 'high';
  else if (vulnCount.medium > 0) maxSeverity = 'medium';
  else if (vulnCount.low > 0) maxSeverity = 'low';
  else maxSeverity = 'none';
  
  // Pick a random emoji based on image name
  const emojiMap: Record<string, string> = {
    'bazarr': '📺', 'radarr': '🎬', 'sonarr': '📡', 'lidarr': '🎵',
    'plex': '▶️', 'jellyfin': '🎞️', 'nginx': '🌐', 'redis': '🔴',
    'postgres': '🐘', 'mysql': '🐬', 'mongo': '🍃', 'node': '💚',
    'python': '🐍', 'go': '🐹', 'rust': '🦀', 'java': '☕',
    'tautulli': '📊', 'prowlarr': '🔎', 'overseerr': '🎫', 'portainer': '🐳',
  };
  const emoji = emojiMap[imageName.toLowerCase()] || '📦';
  
  // Parse user-provided labels or generate defaults
  const userLabels = Array.isArray(labels) ? labels.filter((l: unknown) => typeof l === 'string').slice(0, 5) : [];
  const defaultLabels = isChainguard ? ['chainguard'] : ['user-added'];
  
  const newContainer: Container = {
    id: `user-${Date.now()}-${Math.floor(seededRandom(seed, 24) * 1000000).toString(36)}`,
    name: `📦${imageName}`,
    emoji,
    tag,
    signed,
    maxSeverity,
    vulnCount,
    vulnerabilities: generateVulnerabilities(vulnCount, seed),
    rating: Math.round(rating * 10) / 10,
    burritoScore,
    hat: availableHats[Math.floor(seededRandom(seed, 25) * availableHats.length)],
    lastScanned: new Date().toISOString(),
    sbomPackages: 20 + Math.floor(seededRandom(seed, 26) * 200),
    isChainGuard: isChainguard,
    labels: userLabels.length > 0 ? userLabels : defaultLabels,
    registry,
  };
  
  userContainers.push(newContainer);
  
  logger.info({ 
    imageUrl, 
    id: newContainer.id, 
    maxSeverity, 
    signed,
    vulnCount 
  }, '✅ Container scan complete');
  
  res.json(newContainer);
});

// Delete a specific container by ID
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Input validation
  if (!id || typeof id !== 'string' || id.length > 100) {
    logger.warn({ id }, 'Invalid container ID for deletion');
    return res.status(400).json({ error: '❌🔤' });
  }
  
  // Check if it's a mock container - remove from mockContainers
  const mockIndex = mockContainers.findIndex((c: Container) => c.id === id);
  if (mockIndex !== -1) {
    const deleted = mockContainers.splice(mockIndex, 1)[0];
    logger.info({ id, name: deleted.name }, '🗑️ Mock container deleted');
    return res.json({ deleted: true, id, emoji: '🗑️' });
  }
  
  // Find and remove from user containers
  const index = userContainers.findIndex(c => c.id === id);
  if (index === -1) {
    logger.info({ id }, 'Container not found for deletion');
    return res.status(404).json({ error: '❓📦' });
  }
  
  const deleted = userContainers.splice(index, 1)[0];
  logger.info({ id, name: deleted.name }, '🗑️ Container deleted');
  
  res.json({ deleted: true, id, emoji: '🗑️' });
});

// Delete all containers (full reset - both mock and user-added)
router.delete('/', (_req: Request, res: Response) => {
  const userCount = userContainers.length;
  const mockCount = mockContainers.length;
  
  userContainers.length = 0; // Clear user containers
  mockContainers.length = 0; // Clear mock containers too
  
  logger.info({ userCount, mockCount }, '✏️ All containers erased - starting fresh!');
  
  res.json({ deleted: true, userCount, mockCount, total: userCount + mockCount, emoji: '✏️' });
});

// Reset to default containers (restore initial state)
router.post('/reset', (_req: Request, res: Response) => {
  userContainers.length = 0; // Clear user containers
  resetToDefaults(); // Restore mock containers to defaults
  
  const count = mockContainers.length;
  logger.info({ count }, '🔄 Containers reset to defaults');
  
  res.json({ reset: true, count, emoji: '🔄' });
});

export { router as containersRouter };
