import { Vulnerability } from '../../types.js';

interface ScoreInput {
  vulnerabilities: Vulnerability[];
  dependencyCount: number;
  directDependencyCount: number;
}

export function calculateSecurityScore(input: ScoreInput): number {
  let score = 100;
  
  // Deduct points for vulnerabilities
  for (const vuln of input.vulnerabilities) {
    switch (vuln.severity) {
      case 'critical':
        score -= 25;
        break;
      case 'high':
        score -= 15;
        break;
      case 'medium':
        score -= 5;
        break;
      case 'low':
        score -= 1;
        break;
    }
  }
  
  // Slight penalty for large dependency trees (more attack surface)
  if (input.dependencyCount > 100) {
    score -= Math.min(10, Math.floor((input.dependencyCount - 100) / 50));
  }
  
  return Math.max(0, Math.min(100, score));
}
