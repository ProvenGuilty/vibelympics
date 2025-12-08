import { BreakingChange } from '../../types.js';
import pypiPatterns from '../../data/patterns/pypi.json' with { type: 'json' };

interface PatternData {
  breakingChanges?: BreakingChange[];
  migrationGuide?: string;
  changelog?: string;
}

export function getPatterns(ecosystem: string, packageName: string, version: string): PatternData | null {
  if (ecosystem === 'pypi') {
    const pkgData = (pypiPatterns as any)[packageName];
    if (pkgData && pkgData[version]) {
      return pkgData[version];
    }
  }
  
  return null;
}
