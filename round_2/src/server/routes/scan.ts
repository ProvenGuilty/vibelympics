import { Router } from 'express';
import { ScanRequest } from '../types.js';
import { scanPackage } from '../services/scanner/index.js';
import { logger } from '../logger.js';

const router = Router();

// In-memory scan storage (stateless per-request, but keep recent for demo)
const scans = new Map<string, any>();

router.post('/api/scan', async (req, res) => {
  try {
    const request: ScanRequest = req.body;
    
    // Validate request
    if (!request.ecosystem && !request.image) {
      return res.status(400).json({ error: 'Must specify ecosystem or image' });
    }
    
    if (request.ecosystem && !request.package && !request.file) {
      return res.status(400).json({ error: 'Must specify package name or file' });
    }
    
    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Start scan asynchronously
    const scanPromise = scanPackage(request);
    
    // Store initial status
    scans.set(scanId, {
      id: scanId,
      status: 'scanning',
      request,
    });
    
    // Return scan ID immediately
    res.json({ id: scanId, status: 'scanning' });
    
    // Complete scan in background
    scanPromise.then(result => {
      scans.set(scanId, { ...result, id: scanId, status: 'completed' });
    }).catch(error => {
      logger.error({ error, scanId }, 'Scan failed');
      scans.set(scanId, {
        id: scanId,
        status: 'error',
        error: error.message,
      });
    });
    
  } catch (error: any) {
    logger.error({ error }, 'Scan request failed');
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/scan/:id', (req, res) => {
  const scan = scans.get(req.params.id);
  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }
  res.json(scan);
});

router.get('/api/scan/:id/dependencies', (req, res) => {
  const scan = scans.get(req.params.id);
  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }
  res.json({ dependencies: scan.dependencies || [] });
});

router.get('/api/scan/:id/vulnerabilities', (req, res) => {
  const scan = scans.get(req.params.id);
  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }
  res.json({ vulnerabilities: scan.vulnerabilities || [] });
});

router.get('/api/scan/:id/remediations', (req, res) => {
  const scan = scans.get(req.params.id);
  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }
  res.json({ remediations: scan.remediations || [] });
});

router.get('/api/scan/:id/export', async (req, res) => {
  const scan = scans.get(req.params.id);
  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }
  
  const format = req.query.format || 'json';
  
  if (format === 'markdown') {
    const { exportMarkdown } = await import('../services/export/markdown.js');
    const md = exportMarkdown(scan);
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="scan-${scan.id}.md"`);
    res.send(md);
  } else {
    res.json(scan);
  }
});

// Proxy endpoint for fetching package versions (avoids CORS issues)
router.get('/api/versions/:ecosystem/:package', async (req, res) => {
  const { ecosystem } = req.params;
  const packageName = req.params.package;
  
  try {
    let versions: string[] = [];
    
    if (ecosystem === 'pypi') {
      const response = await fetch(`https://pypi.org/pypi/${packageName}/json`);
      const data = await response.json() as { releases?: Record<string, unknown[]> };
      versions = Object.keys(data.releases || {}).filter(v => {
        const releases = data.releases?.[v];
        return Array.isArray(releases) && releases.length > 0;
      });
    } else if (ecosystem === 'npm') {
      const response = await fetch(`https://registry.npmjs.org/${packageName}`);
      const data = await response.json() as { versions?: Record<string, unknown> };
      versions = Object.keys(data.versions || {});
    } else if (ecosystem === 'rubygems') {
      const response = await fetch(`https://rubygems.org/api/v1/versions/${packageName}.json`);
      const data = await response.json() as Array<{ number: string }>;
      versions = data.map(v => v.number);
    } else if (ecosystem === 'go') {
      const response = await fetch(`https://proxy.golang.org/${packageName}/@v/list`);
      const text = await response.text();
      versions = text.split('\n').filter(v => v.trim());
    } else {
      return res.status(400).json({ error: 'Unsupported ecosystem' });
    }
    
    // Sort versions (newest first)
    const sortedVersions = versions.sort((a, b) => {
      const aParts = a.replace(/^v/, '').split('.').map(n => parseInt(n) || 0);
      const bParts = b.replace(/^v/, '').split('.').map(n => parseInt(n) || 0);
      
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aNum = aParts[i] || 0;
        const bNum = bParts[i] || 0;
        if (aNum !== bNum) return bNum - aNum;
      }
      return 0;
    });
    
    res.json({ versions: sortedVersions });
  } catch (error: any) {
    logger.error({ error, ecosystem, packageName }, 'Failed to fetch versions');
    res.status(500).json({ error: error.message });
  }
});

export default router;
