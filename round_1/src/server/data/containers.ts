export interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  package: string;
  emoji: string;
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
  rating: number; // 1-5 Uber-style rating
  burritoScore: number; // 1-100 burrito health score
  hat: string; // Current hat emoji
  lastScanned: string;
  sbomPackages: number;
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
    rating: 5,
    burritoScore: 100,
    hat: '🎩',
    lastScanned: '2024-12-03T10:00:00Z',
    sbomPackages: 42,
  },
  {
    id: 'cg-python-002',
    name: '📦python',
    emoji: '🐍',
    tag: 'latest',
    signed: true,
    maxSeverity: 'low',
    vulnCount: { critical: 0, high: 0, medium: 0, low: 2 },
    rating: 4.8,
    burritoScore: 95,
    hat: '🧢',
    lastScanned: '2024-12-03T09:30:00Z',
    sbomPackages: 156,
  },
  {
    id: 'cg-nginx-003',
    name: '📦nginx',
    emoji: '🌐',
    tag: 'latest',
    signed: true,
    maxSeverity: 'none',
    vulnCount: { critical: 0, high: 0, medium: 0, low: 0 },
    rating: 5,
    burritoScore: 100,
    hat: '👒',
    lastScanned: '2024-12-03T08:45:00Z',
    sbomPackages: 23,
  },
  {
    id: 'legacy-app-004',
    name: '📦legacy-app',
    emoji: '👴',
    tag: 'v1.2.3',
    signed: false,
    maxSeverity: 'critical',
    vulnCount: { critical: 3, high: 12, medium: 45, low: 89 },
    rating: 1.2,
    burritoScore: 15,
    hat: '🎓',
    lastScanned: '2024-11-15T14:20:00Z',
    sbomPackages: 892,
  },
  {
    id: 'cg-go-005',
    name: '📦go',
    emoji: '🐹',
    tag: 'latest',
    signed: true,
    maxSeverity: 'none',
    vulnCount: { critical: 0, high: 0, medium: 0, low: 0 },
    rating: 5,
    burritoScore: 100,
    hat: '🤠',
    lastScanned: '2024-12-03T11:00:00Z',
    sbomPackages: 18,
  },
  {
    id: 'old-redis-006',
    name: '📦redis',
    emoji: '🔴',
    tag: 'v5.0.0',
    signed: false,
    maxSeverity: 'high',
    vulnCount: { critical: 0, high: 5, medium: 12, low: 8 },
    rating: 2.5,
    burritoScore: 45,
    hat: '🎭',
    lastScanned: '2024-12-01T16:30:00Z',
    sbomPackages: 67,
  },
  {
    id: 'cg-rust-007',
    name: '📦rust',
    emoji: '🦀',
    tag: 'latest',
    signed: true,
    maxSeverity: 'none',
    vulnCount: { critical: 0, high: 0, medium: 0, low: 0 },
    rating: 5,
    burritoScore: 100,
    hat: '⛑️',
    lastScanned: '2024-12-03T10:30:00Z',
    sbomPackages: 31,
  },
  {
    id: 'sketchy-img-008',
    name: '📦mystery-box',
    emoji: '❓',
    tag: 'yolo',
    signed: false,
    maxSeverity: 'critical',
    vulnCount: { critical: 15, high: 42, medium: 78, low: 234 },
    rating: 0.5,
    burritoScore: 3,
    hat: '🃏',
    lastScanned: '2024-06-01T00:00:00Z',
    sbomPackages: 1847,
  },
  {
    id: 'cg-wolfi-009',
    name: '📦wolfi-base',
    emoji: '🐺',
    tag: 'latest',
    signed: true,
    maxSeverity: 'none',
    vulnCount: { critical: 0, high: 0, medium: 0, low: 0 },
    rating: 5,
    burritoScore: 100,
    hat: '👑',
    lastScanned: '2024-12-03T11:30:00Z',
    sbomPackages: 12,
  },
  {
    id: 'med-vuln-010',
    name: '📦postgres',
    emoji: '🐘',
    tag: 'v14.2',
    signed: true,
    maxSeverity: 'medium',
    vulnCount: { critical: 0, high: 0, medium: 4, low: 11 },
    rating: 3.8,
    burritoScore: 72,
    hat: '🎪',
    lastScanned: '2024-12-02T20:00:00Z',
    sbomPackages: 145,
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
