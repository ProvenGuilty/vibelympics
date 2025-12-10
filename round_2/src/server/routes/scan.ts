import { Router } from 'express';
import { ScanRequest, ScanResponse, Dependency, Vulnerability } from '../types.js';
import { scanPackage } from '../services/scanner/index.js';
import { logger } from '../logger.js';
import { parseManifest, detectEcosystem } from '../services/parsers/manifest.js';
import { queryOsv } from '../services/scanner/osv.js';
import { calculateSecurityScore } from '../services/scanner/score.js';
import { generateRemediations } from '../services/remediation/engine.js';

const router = Router();

// In-memory scan storage with TTL cleanup
const scans = new Map<string, any>();
const scanProgress = new Map<string, { current: number; total: number; currentPackage: string; log: string[] }>();
const SCAN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_SCANS = 1000;

// Cleanup old scans periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, scan] of scans.entries()) {
    if (scan.createdAt && now - scan.createdAt > SCAN_TTL_MS) {
      scans.delete(id);
    }
  }
  // Also enforce max size
  if (scans.size > MAX_SCANS) {
    const entries = Array.from(scans.entries())
      .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0));
    const toDelete = entries.slice(0, scans.size - MAX_SCANS);
    for (const [id] of toDelete) {
      scans.delete(id);
    }
  }
}, 60 * 1000); // Run every minute

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
    const pkgName = request.package || 'unknown';
    const version = request.version || 'latest';
    
    // Initialize progress tracking for single package scan
    const progress = { 
      current: 0, 
      total: 1, 
      currentPackage: pkgName, 
      log: [
        `🔍 Scanning ${pkgName}@${version}`,
        '',
        `[ 1/1 ] ${pkgName}@${version} .............. scanning`,
      ] 
    };
    scanProgress.set(scanId, progress);
    
    // Store initial status with timestamp for TTL
    scans.set(scanId, {
      id: scanId,
      status: 'scanning',
      request,
      createdAt: Date.now(),
    });
    
    // Return scan ID immediately
    res.json({ id: scanId, status: 'scanning' });
    
    // Complete scan in background
    scanPackage(request).then(result => {
      const vulnCount = result.vulnerabilities?.length || 0;
      const depCount = result.dependencies?.length || 0;
      
      // Update progress log with results
      let status = '';
      if (vulnCount === 0) {
        status = `✓ ${depCount} deps`;
      } else {
        const summary = result.summary || {};
        const parts = [];
        if (summary.critical > 0) parts.push(`${summary.critical}C`);
        if (summary.high > 0) parts.push(`${summary.high}H`);
        if (summary.medium > 0) parts.push(`${summary.medium}M`);
        if (summary.low > 0) parts.push(`${summary.low}L`);
        status = `⚠ ${depCount} deps │ ${vulnCount} vulns (${parts.join(' ')})`;
      }
      
      progress.current = 1;
      progress.log[2] = `[ 1/1 ] ${pkgName}@${result.version || version} .............. ${status}`;
      progress.log.push('');
      progress.log.push('─'.repeat(50));
      progress.log.push(vulnCount === 0 
        ? `✓ No vulnerabilities found` 
        : `⚠ ${vulnCount} vulnerabilities in ${depCount} dependencies`);
      
      scans.set(scanId, { ...result, id: scanId, status: 'completed' });
    }).catch(error => {
      logger.error({ error, scanId }, 'Scan failed');
      progress.log[2] = `[ 1/1 ] ${pkgName}@${version} .............. ✗ error`;
      progress.log.push(`Error: ${error.message}`);
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

// File upload scan endpoint
router.post('/api/scan/file', async (req, res) => {
  try {
    const { content, fileName } = req.body;
    
    if (!content || !fileName) {
      return res.status(400).json({ error: 'Must provide content and fileName' });
    }
    
    // Parse the manifest file
    const manifest = parseManifest(content, fileName);
    
    if (manifest.dependencies.length === 0) {
      return res.status(400).json({ error: 'No dependencies found in file' });
    }
    
    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store initial status
    scans.set(scanId, {
      id: scanId,
      status: 'scanning',
      ecosystem: manifest.ecosystem,
      target: fileName,
      createdAt: Date.now(),
    });
    
    // Return scan ID immediately
    res.json({ id: scanId, status: 'scanning', dependencyCount: manifest.dependencies.length });
    
    // Scan dependencies in background
    scanManifestDependencies(scanId, manifest).catch(error => {
      logger.error({ error, scanId }, 'File scan failed');
      scans.set(scanId, {
        id: scanId,
        status: 'error',
        error: error.message,
      });
    });
    
  } catch (error: any) {
    logger.error({ error }, 'File scan request failed');
    res.status(500).json({ error: error.message });
  }
});

// Helper function to scan manifest dependencies - does DEEP scans of each package
async function scanManifestDependencies(scanId: string, manifest: ReturnType<typeof parseManifest>) {
  const packageScans: any[] = [];
  const allVulnerabilities: Vulnerability[] = [];
  const allDependencies: Dependency[] = [];
  const total = manifest.dependencies.length;
  
  // Initialize progress tracking
  const progress = { current: 0, total, currentPackage: '', log: [] as string[] };
  scanProgress.set(scanId, progress);
  
  const addLog = (msg: string) => {
    progress.log.push(msg);
    logger.info({ scanId, msg }, 'Scan progress');
  };
  
  addLog(`🔍 Scanning ${manifest.fileName} (${total} packages)`);
  addLog('');
  
  // Scan each dependency as a full package (with its transitive deps)
  for (let i = 0; i < manifest.dependencies.length; i++) {
    const dep = manifest.dependencies[i];
    const idx = `[${String(i + 1).padStart(2)}/${total}]`;
    progress.current = i + 1;
    progress.currentPackage = dep.name;
    
    try {
      // Use the full scanPackage function for deep scanning
      const result = await scanPackage({
        ecosystem: manifest.ecosystem as any,
        package: dep.name,
        version: dep.version,
      });
      
      const vulnCount = result.vulnerabilities?.length || 0;
      const depCount = result.dependencies?.length || 0;
      const version = result.version || dep.version || 'latest';
      const pkgName = `${dep.name}@${version}`;
      const dots = '.'.repeat(Math.max(2, 40 - pkgName.length));
      
      // Build compact status line
      let status = '';
      if (vulnCount === 0) {
        status = `✓ ${depCount} deps`;
      } else {
        const summary = result.summary || {};
        const parts = [];
        if (summary.critical > 0) parts.push(`${summary.critical}C`);
        if (summary.high > 0) parts.push(`${summary.high}H`);
        if (summary.medium > 0) parts.push(`${summary.medium}M`);
        if (summary.low > 0) parts.push(`${summary.low}L`);
        status = `⚠ ${depCount} deps │ ${vulnCount} vulns (${parts.join(' ')})`;
      }
      
      addLog(`${idx} ${pkgName} ${dots} ${status}`);
      
      // Store individual package scan
      const pkgScanId = `${scanId}-${dep.name}`;
      scans.set(pkgScanId, {
        ...result,
        id: pkgScanId,
        parentScanId: scanId,
      });
      
      packageScans.push({
        id: pkgScanId,
        name: dep.name,
        version: result.version,
        securityScore: result.securityScore,
        summary: result.summary,
        dependencyCount: depCount,
      });
      
      // Aggregate vulnerabilities and dependencies
      if (result.vulnerabilities) {
        allVulnerabilities.push(...result.vulnerabilities);
      }
      if (result.dependencies) {
        // Mark as coming from this package
        result.dependencies.forEach((d: Dependency) => {
          allDependencies.push({
            ...d,
            parent: d.parent || dep.name,
          });
        });
      }
    } catch (error: any) {
      const pkgName = `${dep.name}@${dep.version || 'latest'}`;
      const dots = '.'.repeat(Math.max(2, 40 - pkgName.length));
      addLog(`${idx} ${pkgName} ${dots} ✗ error: ${error.message}`);
      logger.error({ error, package: dep.name }, 'Failed to scan package from manifest');
      packageScans.push({
        id: `${scanId}-${dep.name}`,
        name: dep.name,
        version: dep.version || 'unknown',
        error: error.message,
        securityScore: 0,
        summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
        dependencyCount: 0,
      });
    }
  }
  
  // Summary line
  addLog('');
  addLog('─'.repeat(60));
  const vulnPkgs = packageScans.filter(p => p.summary?.total > 0).length;
  const cleanPkgs = packageScans.filter(p => !p.error && p.summary?.total === 0).length;
  const errorPkgs = packageScans.filter(p => p.error).length;
  addLog(`✓ ${cleanPkgs} clean  ⚠ ${vulnPkgs} vulnerable  ${errorPkgs > 0 ? `✗ ${errorPkgs} errors` : ''}`);
  addLog(`${allVulnerabilities.length} total vulnerabilities across ${allDependencies.length} dependencies`);
  
  // Calculate aggregate summary
  const summary = {
    critical: allVulnerabilities.filter(v => v.severity === 'critical').length,
    high: allVulnerabilities.filter(v => v.severity === 'high').length,
    medium: allVulnerabilities.filter(v => v.severity === 'medium').length,
    low: allVulnerabilities.filter(v => v.severity === 'low').length,
    total: allVulnerabilities.length,
  };
  
  // Dedupe vulnerabilities by ID
  const uniqueVulns = Array.from(
    new Map(allVulnerabilities.map(v => [v.id, v])).values()
  );
  
  const securityScore = calculateSecurityScore({
    vulnerabilities: uniqueVulns,
    dependencyCount: allDependencies.length,
    directDependencyCount: manifest.dependencies.length,
  });
  
  const remediations = await generateRemediations(uniqueVulns, allDependencies);
  
  // Store manifest scan with package list
  scans.set(scanId, {
    id: scanId,
    status: 'completed',
    ecosystem: manifest.ecosystem,
    target: manifest.fileName,
    version: 'manifest',
    scanDate: new Date().toISOString(),
    securityScore,
    summary,
    dependencies: allDependencies,
    vulnerabilities: uniqueVulns,
    remediations,
    // NEW: List of individual package scans for tabbed UI
    packageScans,
    isManifestScan: true,
  });
}

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
  } else if (format === 'sarif') {
    const { exportSarif } = await import('../services/export/sarif.js');
    const sarif = exportSarif(scan);
    res.setHeader('Content-Type', 'application/sarif+json');
    res.setHeader('Content-Disposition', `attachment; filename="scan-${scan.id}.sarif.json"`);
    res.json(sarif);
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

// SSE endpoint for scan progress
router.get('/api/scan/:id/progress', (req, res) => {
  const scanId = req.params.id;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendProgress = () => {
    const scan = scans.get(scanId);
    const progress = scanProgress.get(scanId);
    
    if (!scan) {
      res.write(`data: ${JSON.stringify({ error: 'Scan not found' })}\n\n`);
      res.end();
      return;
    }

    if (scan.status === 'completed' || scan.status === 'error') {
      res.write(`data: ${JSON.stringify({ 
        status: scan.status, 
        complete: true,
        error: scan.error 
      })}\n\n`);
      res.end();
      scanProgress.delete(scanId);
      return;
    }

    if (progress) {
      res.write(`data: ${JSON.stringify({
        status: 'scanning',
        current: progress.current,
        total: progress.total,
        currentPackage: progress.currentPackage,
        percent: Math.round((progress.current / progress.total) * 100),
        log: progress.log.slice(-10), // Last 10 log entries
      })}\n\n`);
    }
  };

  // Send initial progress
  sendProgress();

  // Poll for updates
  const interval = setInterval(sendProgress, 500);

  // Cleanup on close
  req.on('close', () => {
    clearInterval(interval);
  });
});

// Simple progress polling endpoint (non-SSE fallback)
router.get('/api/scan/:id/status', (req, res) => {
  const scanId = req.params.id;
  const scan = scans.get(scanId);
  const progress = scanProgress.get(scanId);
  
  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  res.json({
    status: scan.status,
    ...(progress && {
      current: progress.current,
      total: progress.total,
      currentPackage: progress.currentPackage,
      percent: Math.round((progress.current / progress.total) * 100),
      log: progress.log.slice(-20),
    }),
  });
});

export default router;
