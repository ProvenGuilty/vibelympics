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
  rating: number;
  burritoScore: number;
  hat: string;
  lastScanned: string;
  sbomPackages: number;
  isChainGuard: boolean;
  labels: string[];
  registry: string;
  locked?: boolean;  // If true, container won't be cleared by "erase all"
}

export type ViewMode = 'grid' | 'compact' | 'list';

export interface Stats {
  total: number;
  signed: number;
  unsigned: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    none: number;
  };
  averageRating: string;
}

export const SEVERITY_EMOJI: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
  none: '⚪',
};

export const AVAILABLE_HATS = ['🎩', '🧢', '👒', '🎓', '🤠', '⛑️', '👑', '🎭', '🪖', '🎪', '🃏'];
