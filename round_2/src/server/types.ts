// Core types for The Weakest Lynx

export interface Config {
  port: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  enablePypi: boolean;
  enableNpm: boolean;
  enableMaven: boolean;
  enableGo: boolean;
  enableRubygems: boolean;
  enableContainers: boolean;
  
  enableAi: boolean;
  aiProvider: 'openai' | 'anthropic' | 'ollama';
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaHost: string;
  
  githubToken?: string;
  githubClientId?: string;
  githubClientSecret?: string;
}

export interface ScanRequest {
  ecosystem?: 'pypi' | 'npm' | 'maven' | 'go' | 'rubygems';
  package?: string;
  version?: string;
  file?: string;
  fileName?: string;
  image?: string;
  code?: string;
}

export interface ScanResponse {
  id: string;
  status: 'pending' | 'scanning' | 'completed' | 'error';
  ecosystem: string;
  target: string;
  version: string;
  scanDate: string;
  securityScore: number;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  dependencies: Dependency[];
  vulnerabilities: Vulnerability[];
  remediations: Remediation[];
  warnings?: string[];
  scanMetadata?: ScanMetadata;
}

export interface ScanMetadata {
  scanDurationMs: number;
  toolsUsed: {
    name: string;
    version?: string;
    purpose: string;
    url?: string;
  }[];
  dataSourcesQueried: {
    name: string;
    url: string;
    queriesCount: number;
    responseTimeMs?: number;
  }[];
  ecosystemDetails: {
    packageRegistry: string;
    dependencyResolver: string;
    manifestParsed?: string;
  };
  scanSteps: {
    step: string;
    status: 'complete' | 'skipped' | 'failed';
    durationMs: number;
    details?: string;
  }[];
}

export interface Dependency {
  name: string;
  version: string;
  ecosystem: string;
  direct: boolean;
  parent?: string;
  vulnerabilityCount: number;
  maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none';
}

export interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss?: number;
  package: string;
  installedVersion: string;
  fixedVersion?: string;
  description: string;
  references: string[];
}

export interface Remediation {
  id: string;
  package: string;
  currentVersion: string;
  targetVersion: string;
  vulnerabilitiesFixed: string[];
  riskLevel: 'low' | 'medium' | 'high';
  isBreaking: boolean;
  breakingChanges?: BreakingChange[];
  migrationGuideUrl?: string;
  changelogUrl?: string;
  affectedPatterns?: AffectedPattern[];
  aiPatch?: AiPatch;
}

export interface BreakingChange {
  type: 'removed' | 'moved' | 'changed' | 'deprecated';
  description: string;
  oldSignature?: string;
  newSignature?: string;
}

export interface AffectedPattern {
  file: string;
  line: number;
  code: string;
  pattern: string;
  suggestion: string;
}

export interface AiPatch {
  files: {
    path: string;
    diff: string;
  }[];
  explanation: string;
}

export interface PackageMetadata {
  name: string;
  version: string;
  dependencies: Record<string, string>;
}
