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
  rating: number;
  burritoScore: number;
  hat: string;
  lastScanned: string;
  sbomPackages: number;
}

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
