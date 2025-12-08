# AI-README.md — Implementation Guide for The Weakest Lynx

> This document is written for AI coding assistants (Cursor, Windsurf, Copilot, etc.) to implement the project. It contains technical specifications, implementation order, and detailed requirements.

---

## 🎯 Project Overview

**The Weakest Lynx** is a supply chain security auditor that:
1. Accepts a package name, manifest file, or container image
2. Resolves the full dependency tree
3. Scans for vulnerabilities using OSV + Grype
4. Suggests version upgrades with breaking change warnings
5. Optionally uses AI to suggest code patches
6. Optionally creates GitHub PRs with fixes

**Key Principle:** Everything works without AI. AI features are optional enhancements behind feature toggles.

---

## 🏗️ Implementation Order

Build in this exact order. Each phase should be fully functional before moving to the next.

### Phase 1: Project Scaffolding
1. Initialize Node.js project with TypeScript
2. Set up Vite for frontend bundling
3. Configure Tailwind CSS + shadcn/ui
4. Create Express.js server with health endpoints
5. Create Dockerfile with Chainguard base image
6. Verify: `docker build` and `docker run` work, health endpoint responds

### Phase 2: Configuration System
1. Create `src/server/config.ts` with all feature toggles
2. Environment variable parsing with defaults
3. Runtime toggle API (`GET /api/config`, `PUT /api/config`)
4. Verify: Can toggle features via API and env vars

### Phase 3: PyPI Ecosystem (First Ecosystem)
1. PyPI package metadata fetcher (pypi.org JSON API)
2. Dependency tree resolver (parse requires_dist)
3. Requirements.txt parser
4. Verify: Can resolve full dependency tree for `requests`

### Phase 4: Vulnerability Scanning
1. OSV API client (api.osv.dev)
2. Grype CLI wrapper (shell out to grype binary)
3. Vulnerability aggregator (merge results, dedupe)
4. Security score calculator
5. Verify: Scan `requests==2.28.0` and get CVE list

### Phase 5: Basic Web UI
1. Layout components (Header, Footer, ThemeToggle)
2. Scan form (package input, ecosystem selector)
3. Results view (score card, vulnerability list)
4. Dark mode toggle (default on)
5. Verify: Can scan a package and see results in browser

### Phase 6: Dependency Visualization
1. Dependency tree data structure
2. D3.js or Cytoscape.js graph component
3. Color nodes by vulnerability status
4. Click-to-expand details
5. Verify: Interactive dependency map renders

### Phase 7: Remediation Engine (No AI)
1. Version upgrade suggester (find latest non-vulnerable version)
2. Changelog fetcher (GitHub raw file)
3. Breaking change parser (extract from changelog)
4. Migration guide linker (curated URL database)
5. Compatibility checker (resolve with upgraded versions)
6. Verify: Get remediation suggestions with breaking change warnings

### Phase 8: Code Pattern Matching
1. Pattern database (JSON files per ecosystem)
2. Grep service (search user-provided code)
3. Match reporter (file, line, pattern, suggestion)
4. Verify: Upload code, get "your code uses affected patterns" results

### Phase 9: Side-by-Side Comparison View
1. Current state panel
2. Remediated state panel
3. Remediation queue component
4. Accept/skip individual fixes
5. Accept all button
6. Verify: Full two-panel UI working

### Phase 10: Export Functionality
1. JSON exporter
2. SARIF formatter
3. Markdown exporter
4. Patched manifest generator (requirements.txt, package.json)
5. Verify: All export formats download correctly

### Phase 11: CLI Mode
1. Command parser (yargs or commander)
2. Scan command with all options
3. JSON/Markdown output to stdout
4. Exit codes (0 = clean, 1 = vulnerabilities found)
5. Verify: `docker run weakest-lynx scan --package requests` works

### Phase 12: Additional Ecosystems
1. npm (registry.npmjs.org API, package-lock.json parser)
2. Maven (Maven Central API, pom.xml parser)
3. Go (proxy.golang.org API, go.mod parser)
4. RubyGems (rubygems.org API, Gemfile.lock parser)
5. Containers (Syft for SBOM, then scan SBOM)
6. Each ecosystem behind its own feature toggle
7. Verify: Each ecosystem works independently

### Phase 13: AI Integration (Optional Feature)
1. AI provider abstraction layer
2. OpenAI client (GPT-4 for code analysis)
3. Anthropic client (Claude for code analysis)
4. Ollama client (local models)
5. Code patch generator prompt
6. UI toggle and API key input
7. Verify: With API key, get AI-generated code patches

### Phase 14: GitHub Integration
1. GitHub OAuth flow (for web UI)
2. PAT validation (for CLI/env var)
3. Repository file fetcher
4. Branch creation
5. Commit creation
6. PR creation with diff
7. Verify: Can create PR with fixes

### Phase 15: Polish
1. Error handling and user-friendly messages
2. Loading states and progress indicators
3. Rate limiting
4. Input validation
5. Logging (Pino, structured JSON)
6. Final Dockerfile optimization

---

## 📋 Technical Specifications

### Backend: Express.js + TypeScript

```typescript
// src/server/index.ts structure
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino';
import { healthRoutes } from './routes/health';
import { scanRoutes } from './routes/scan';
import { configRoutes } from './routes/config';
import { githubRoutes } from './routes/github';
import { config } from './config';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/', healthRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/config', configRoutes);
app.use('/api/github', githubRoutes);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist/client'));
}

app.listen(config.port);
```

### Configuration Schema

```typescript
// src/server/config.ts
export interface Config {
  // Server
  port: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Ecosystem toggles
  enablePypi: boolean;
  enableNpm: boolean;
  enableMaven: boolean;
  enableGo: boolean;
  enableRubygems: boolean;
  enableContainers: boolean;
  
  // AI toggles
  enableAi: boolean;
  aiProvider: 'openai' | 'anthropic' | 'ollama';
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaHost: string;
  
  // GitHub
  githubToken?: string;
  githubClientId?: string;
  githubClientSecret?: string;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '8080'),
  logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info',
  
  enablePypi: process.env.ENABLE_PYPI !== 'false',
  enableNpm: process.env.ENABLE_NPM !== 'false',
  enableMaven: process.env.ENABLE_MAVEN !== 'false',
  enableGo: process.env.ENABLE_GO !== 'false',
  enableRubygems: process.env.ENABLE_RUBYGEMS !== 'false',
  enableContainers: process.env.ENABLE_CONTAINERS !== 'false',
  
  enableAi: process.env.ENABLE_AI === 'true',
  aiProvider: (process.env.AI_PROVIDER as Config['aiProvider']) || 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  
  githubToken: process.env.GITHUB_TOKEN,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
};
```

### API Schemas

```typescript
// src/server/types.ts

// Scan Request
interface ScanRequest {
  ecosystem?: 'pypi' | 'npm' | 'maven' | 'go' | 'rubygems';
  package?: string;
  version?: string;
  file?: string; // base64 encoded manifest file
  fileName?: string; // original filename for type detection
  image?: string; // container image reference
  code?: string; // base64 encoded code archive for pattern matching
}

// Scan Response
interface ScanResponse {
  id: string;
  status: 'pending' | 'scanning' | 'complete' | 'error';
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
}

interface Dependency {
  name: string;
  version: string;
  ecosystem: string;
  direct: boolean;
  parent?: string;
  vulnerabilityCount: number;
  maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none';
}

interface Vulnerability {
  id: string; // CVE-2023-XXXXX
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss?: number;
  package: string;
  installedVersion: string;
  fixedVersion?: string;
  description: string;
  references: string[];
}

interface Remediation {
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
  aiPatch?: AiPatch; // Only present if AI enabled
}

interface BreakingChange {
  type: 'removed' | 'moved' | 'changed' | 'deprecated';
  description: string;
  oldSignature?: string;
  newSignature?: string;
}

interface AffectedPattern {
  file: string;
  line: number;
  code: string;
  pattern: string;
  suggestion: string;
}

interface AiPatch {
  files: {
    path: string;
    diff: string;
  }[];
  explanation: string;
}
```

### Frontend Component Structure

```typescript
// Use shadcn/ui components where possible
// Key components to install:
// - Button, Card, Badge, Dialog, Tabs, Switch, Input, Select
// - Tooltip, Progress, Separator, ScrollArea

// src/client/App.tsx structure
function App() {
  const [view, setView] = useState<'scan' | 'results'>('scan');
  const [scanId, setScanId] = useState<string | null>(null);
  const { config, updateConfig } = useConfig();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={theme}>
      <Header onSettingsClick={() => {}} onThemeToggle={toggleTheme} />
      {view === 'scan' && (
        <ScanForm onScanComplete={(id) => { setScanId(id); setView('results'); }} />
      )}
      {view === 'results' && scanId && (
        <ResultsView scanId={scanId} onBack={() => setView('scan')} />
      )}
      <Footer />
    </div>
  );
}
```

### Dependency Map Visualization

```typescript
// Use Cytoscape.js for the dependency graph
// src/client/components/results/DependencyMap.tsx

import cytoscape from 'cytoscape';

interface DependencyMapProps {
  dependencies: Dependency[];
  onNodeClick: (dep: Dependency) => void;
}

// Node colors based on maxSeverity:
// critical: #ef4444 (red-500)
// high: #f97316 (orange-500)
// medium: #eab308 (yellow-500)
// low: #22c55e (green-500)
// none: #6b7280 (gray-500)

// Layout: dagre (hierarchical) or cose (force-directed)
// Root node (scanned package) at top
// Direct dependencies in second row
// Transitive dependencies below
```

### Dockerfile

```dockerfile
# Multi-stage build using Chainguard base
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Install Grype and Syft during build
RUN curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
RUN curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

# Update vulnerability databases at build time
RUN grype db update

FROM cgr.dev/chainguard/node:latest

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /usr/local/bin/grype /usr/local/bin/
COPY --from=builder /usr/local/bin/syft /usr/local/bin/
COPY --from=builder /root/.cache/grype /root/.cache/grype

# Install ecosystem CLIs (pip, npm already available, add others)
# Note: This may require chainguard-dev image for package installation

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Entrypoint handles both web server and CLI modes
ENTRYPOINT ["node", "dist/server/index.js"]
```

### CLI Implementation

```typescript
// src/server/cli.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('weakest-lynx')
  .description('Supply chain security auditor')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan a package, file, or container')
  .option('-e, --ecosystem <ecosystem>', 'Package ecosystem (pypi, npm, maven, go, rubygems)')
  .option('-p, --package <package>', 'Package name')
  .option('-v, --version <version>', 'Package version')
  .option('-f, --file <file>', 'Manifest file path')
  .option('-i, --image <image>', 'Container image reference')
  .option('--format <format>', 'Output format (json, markdown)', 'json')
  .option('--sarif', 'Include SARIF in JSON output')
  .option('--ai', 'Enable AI-powered suggestions')
  .option('--ai-provider <provider>', 'AI provider (openai, anthropic, ollama)')
  .option('--create-pr', 'Create GitHub PR with fixes')
  .option('--repo <repo>', 'GitHub repo for PR (owner/repo)')
  .option('--disable-pypi', 'Disable PyPI ecosystem')
  .option('--disable-npm', 'Disable npm ecosystem')
  .option('--disable-maven', 'Disable Maven ecosystem')
  .option('--disable-go', 'Disable Go ecosystem')
  .option('--disable-rubygems', 'Disable RubyGems ecosystem')
  .action(async (options) => {
    // Implementation
  });

program
  .command('serve')
  .description('Start the web server')
  .option('-p, --port <port>', 'Port number', '8080')
  .action(async (options) => {
    // Start Express server
  });

// Default command is serve
if (process.argv.length === 2) {
  process.argv.push('serve');
}

program.parse();
```

### OSV API Client

```typescript
// src/server/services/scanner/osv.ts
const OSV_API = 'https://api.osv.dev/v1';

interface OsvQuery {
  package: {
    name: string;
    ecosystem: string;
  };
  version: string;
}

interface OsvVulnerability {
  id: string;
  summary: string;
  details: string;
  severity: { type: string; score: string }[];
  affected: {
    package: { name: string; ecosystem: string };
    ranges: { type: string; events: { introduced?: string; fixed?: string }[] }[];
  }[];
  references: { type: string; url: string }[];
}

export async function queryOsv(pkg: string, ecosystem: string, version: string): Promise<OsvVulnerability[]> {
  const response = await fetch(`${OSV_API}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      package: { name: pkg, ecosystem: mapEcosystem(ecosystem) },
      version,
    }),
  });
  
  const data = await response.json();
  return data.vulns || [];
}

function mapEcosystem(ecosystem: string): string {
  const map: Record<string, string> = {
    pypi: 'PyPI',
    npm: 'npm',
    maven: 'Maven',
    go: 'Go',
    rubygems: 'RubyGems',
  };
  return map[ecosystem] || ecosystem;
}
```

### Grype CLI Wrapper

```typescript
// src/server/services/scanner/grype.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GrypeMatch {
  vulnerability: {
    id: string;
    severity: string;
    description: string;
    fix?: { versions: string[] };
  };
  artifact: {
    name: string;
    version: string;
  };
}

export async function scanWithGrype(target: string): Promise<GrypeMatch[]> {
  try {
    const { stdout } = await execAsync(`grype ${target} -o json`, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large SBOMs
    });
    
    const result = JSON.parse(stdout);
    return result.matches || [];
  } catch (error) {
    console.error('Grype scan failed:', error);
    return [];
  }
}
```

### Breaking Change Pattern Database

```json
// src/server/data/patterns/pypi.json
{
  "urllib3": {
    "2.0.0": {
      "breakingChanges": [
        {
          "type": "removed",
          "description": "Removed urllib3.contrib.pyopenssl module",
          "pattern": "from urllib3\\.contrib\\.pyopenssl import",
          "suggestion": "Use standard ssl module or remove pyopenssl dependency"
        },
        {
          "type": "moved",
          "description": "Retry class moved from urllib3.util.retry to urllib3.util",
          "pattern": "from urllib3\\.util\\.retry import Retry",
          "suggestion": "Change to: from urllib3.util import Retry"
        },
        {
          "type": "changed",
          "description": "HTTPConnectionPool requires block parameter",
          "pattern": "HTTPConnectionPool\\([^)]*\\)",
          "suggestion": "Add block=True parameter to HTTPConnectionPool constructor"
        }
      ],
      "migrationGuide": "https://urllib3.readthedocs.io/en/stable/v2-migration-guide.html",
      "changelog": "https://github.com/urllib3/urllib3/blob/main/CHANGES.rst"
    }
  },
  "requests": {
    "2.29.0": {
      "breakingChanges": [],
      "migrationGuide": null,
      "changelog": "https://github.com/psf/requests/blob/main/HISTORY.md"
    }
  }
}
```

### AI Prompt for Code Patches

```typescript
// src/server/services/ai/prompts.ts

export function buildCodePatchPrompt(
  packageName: string,
  currentVersion: string,
  targetVersion: string,
  breakingChanges: BreakingChange[],
  affectedCode: AffectedPattern[]
): string {
  return `You are a code migration assistant. A user needs to upgrade ${packageName} from ${currentVersion} to ${targetVersion}.

## Breaking Changes in ${targetVersion}
${breakingChanges.map(bc => `- ${bc.type.toUpperCase()}: ${bc.description}`).join('\n')}

## User's Code That Needs Updates
${affectedCode.map(ac => `
File: ${ac.file}:${ac.line}
\`\`\`
${ac.code}
\`\`\`
Pattern matched: ${ac.pattern}
`).join('\n')}

## Your Task
Generate a unified diff for each file that needs changes. The diff should:
1. Fix all breaking changes
2. Maintain the existing code style
3. Add comments explaining non-obvious changes
4. Be minimal - only change what's necessary

Respond with JSON in this format:
{
  "files": [
    {
      "path": "path/to/file.py",
      "diff": "--- a/path/to/file.py\\n+++ b/path/to/file.py\\n@@ -40,3 +40,3 @@\\n..."
    }
  ],
  "explanation": "Brief explanation of all changes made"
}`;
}
```

### GitHub PR Creation

```typescript
// src/server/services/github/pr.ts
import { Octokit } from '@octokit/rest';

interface CreatePrOptions {
  token: string;
  owner: string;
  repo: string;
  title: string;
  body: string;
  baseBranch: string;
  changes: {
    path: string;
    content: string;
  }[];
}

export async function createPullRequest(options: CreatePrOptions): Promise<string> {
  const octokit = new Octokit({ auth: options.token });
  
  // 1. Get the base branch SHA
  const { data: ref } = await octokit.git.getRef({
    owner: options.owner,
    repo: options.repo,
    ref: `heads/${options.baseBranch}`,
  });
  const baseSha = ref.object.sha;
  
  // 2. Create a new branch
  const branchName = `weakest-lynx/security-fixes-${Date.now()}`;
  await octokit.git.createRef({
    owner: options.owner,
    repo: options.repo,
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });
  
  // 3. Create commits for each file change
  for (const change of options.changes) {
    // Get current file (if exists) to get its SHA
    let fileSha: string | undefined;
    try {
      const { data: file } = await octokit.repos.getContent({
        owner: options.owner,
        repo: options.repo,
        path: change.path,
        ref: branchName,
      });
      if (!Array.isArray(file)) {
        fileSha = file.sha;
      }
    } catch {
      // File doesn't exist, that's fine
    }
    
    await octokit.repos.createOrUpdateFileContents({
      owner: options.owner,
      repo: options.repo,
      path: change.path,
      message: `fix: Update ${change.path} for security remediation`,
      content: Buffer.from(change.content).toString('base64'),
      branch: branchName,
      sha: fileSha,
    });
  }
  
  // 4. Create the PR
  const { data: pr } = await octokit.pulls.create({
    owner: options.owner,
    repo: options.repo,
    title: options.title,
    body: options.body,
    head: branchName,
    base: options.baseBranch,
  });
  
  return pr.html_url;
}
```

### Security Score Calculation

```typescript
// src/server/services/scanner/score.ts

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
```

---

## 🧪 Testing Strategy

### Unit Tests
- Config parsing
- Ecosystem resolvers (mock HTTP responses)
- Vulnerability merging logic
- Score calculation
- Pattern matching

### Integration Tests
- Full scan flow with real packages (requests, lodash)
- Export format validation
- CLI argument parsing

### E2E Tests (Optional)
- Playwright for web UI
- Full Docker container test

---

## 🚨 Error Handling

### Ecosystem Failures
If one ecosystem fails (e.g., Maven Central is down), the scan should:
1. Log the error
2. Continue with other ecosystems
3. Return partial results with a warning
4. Never crash the entire scan

```typescript
// Example pattern
async function scanAllEcosystems(target: string): Promise<ScanResult> {
  const results: Partial<ScanResult> = {};
  const errors: string[] = [];
  
  if (config.enablePypi) {
    try {
      results.pypi = await scanPypi(target);
    } catch (e) {
      errors.push(`PyPI scan failed: ${e.message}`);
    }
  }
  
  // ... repeat for other ecosystems
  
  return {
    ...mergeResults(results),
    warnings: errors,
  };
}
```

### AI Failures
If AI is enabled but fails:
1. Return results without AI patches
2. Show message: "AI suggestions unavailable"
3. Never block the core functionality

### GitHub Failures
If PR creation fails:
1. Still show the diff to the user
2. Offer download as patch file
3. Show specific error (auth, permissions, etc.)

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "pino": "^8.17.2",
    "pino-http": "^9.0.0",
    "commander": "^11.1.0",
    "@octokit/rest": "^20.0.2",
    "openai": "^4.24.1",
    "@anthropic-ai/sdk": "^0.10.0",
    "ollama": "^0.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@types/react": "^18.2.45",
    "@types/node": "^20.10.6",
    "@types/express": "^4.17.21",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "cytoscape": "^3.27.0",
    "@types/cytoscape": "^3.19.16"
  }
}
```

---

## 🎨 UI/UX Guidelines

### Color Palette (Dark Mode Default)
- Background: `#0f172a` (slate-900)
- Card Background: `#1e293b` (slate-800)
- Text Primary: `#f8fafc` (slate-50)
- Text Secondary: `#94a3b8` (slate-400)
- Accent: `#8b5cf6` (violet-500)
- Critical: `#ef4444` (red-500)
- High: `#f97316` (orange-500)
- Medium: `#eab308` (yellow-500)
- Low: `#22c55e` (green-500)
- Clean: `#6b7280` (gray-500)

### Typography
- Font: Inter or system-ui
- Headings: Bold, larger sizes
- Code: JetBrains Mono or monospace

### Animations
- Subtle transitions (150-300ms)
- Loading spinners for async operations
- Graph node hover effects

---

## ✅ Definition of Done

A feature is complete when:
1. It works in the web UI
2. It works via CLI
3. It works via API
4. It has a feature toggle
5. It handles errors gracefully
6. It has basic tests
7. It's documented in README.md

---

## 🚀 Launch Checklist

Before demo:
- [ ] `docker build` succeeds
- [ ] `docker run -p 8080:8080` starts server
- [ ] Web UI loads at localhost:8080
- [ ] Can scan `requests` package
- [ ] Dependency map renders
- [ ] Vulnerabilities display
- [ ] Remediations show
- [ ] Export works (JSON, Markdown)
- [ ] CLI mode works
- [ ] Dark mode toggle works
- [ ] All feature toggles work

---

*This document should be sufficient for an AI coding assistant to implement the entire project. Start with Phase 1 and proceed sequentially.*
