import { BreakingChange } from '../../types.js';
import { logger } from '../../logger.js';

export async function fetchChangelog(packageName: string, ecosystem: string): Promise<string | null> {
  // Try common changelog locations on GitHub
  const possibleUrls = [
    `https://raw.githubusercontent.com/${packageName}/${packageName}/main/CHANGELOG.md`,
    `https://raw.githubusercontent.com/${packageName}/${packageName}/master/CHANGELOG.md`,
    `https://raw.githubusercontent.com/${packageName}/${packageName}/main/HISTORY.md`,
    `https://raw.githubusercontent.com/${packageName}/${packageName}/main/CHANGES.rst`,
  ];
  
  for (const url of possibleUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      // Continue to next URL
    }
  }
  
  logger.warn({ packageName }, 'Could not fetch changelog');
  return null;
}

export function parseBreakingChanges(changelog: string, targetVersion: string): BreakingChange[] {
  const changes: BreakingChange[] = [];
  
  // Simple regex-based parsing for "Breaking", "BREAKING", etc.
  const lines = changelog.split('\n');
  let inVersionSection = false;
  
  for (const line of lines) {
    // Check if we're in the target version section
    if (line.includes(targetVersion)) {
      inVersionSection = true;
      continue;
    }
    
    // Exit version section on next version header
    if (inVersionSection && line.match(/^#+\s+\d+\.\d+/)) {
      break;
    }
    
    // Look for breaking change indicators
    if (inVersionSection && line.match(/breaking|BREAKING|removed|REMOVED|deprecated|DEPRECATED/i)) {
      changes.push({
        type: line.toLowerCase().includes('removed') ? 'removed' : 'changed',
        description: line.trim(),
      });
    }
  }
  
  return changes;
}
