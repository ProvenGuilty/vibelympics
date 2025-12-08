import { ScanRequest, ScanResponse } from '../../types.js';
import { logger } from '../../logger.js';
import { scanPypi } from '../ecosystems/pypi.js';
import { scanNpm } from '../ecosystems/npm.js';
import { scanMaven } from '../ecosystems/maven.js';
import { scanGo } from '../ecosystems/go.js';
import { scanRubyGems } from '../ecosystems/rubygems.js';
import { calculateSecurityScore } from './score.js';
import { generateRemediations } from '../remediation/engine.js';

export async function scanPackage(request: ScanRequest): Promise<ScanResponse> {
  const startTime = Date.now();
  
  try {
    // Route to appropriate ecosystem scanner
    let result: Partial<ScanResponse>;
    
    if (request.ecosystem === 'pypi') {
      result = await scanPypi(request);
    } else if (request.ecosystem === 'npm') {
      result = await scanNpm(request);
    } else if (request.ecosystem === 'maven') {
      result = await scanMaven(request);
    } else if (request.ecosystem === 'go') {
      result = await scanGo(request);
    } else if (request.ecosystem === 'rubygems') {
      result = await scanRubyGems(request);
    } else {
      throw new Error(`Unsupported ecosystem: ${request.ecosystem}`);
    }
    
    // Calculate security score
    const securityScore = calculateSecurityScore({
      vulnerabilities: result.vulnerabilities || [],
      dependencyCount: result.dependencies?.length || 0,
      directDependencyCount: result.dependencies?.filter(d => d.direct).length || 0,
    });
    
    // Generate remediations
    const remediations = await generateRemediations(
      result.vulnerabilities || [],
      result.dependencies || []
    );
    
    const scanTime = Date.now() - startTime;
    logger.info({ scanTime, target: request.package }, 'Scan completed');
    
    return {
      ...result,
      securityScore,
      remediations,
      scanDate: new Date().toISOString(),
    } as ScanResponse;
    
  } catch (error: any) {
    logger.error({ error, request }, 'Scan failed');
    throw error;
  }
}
