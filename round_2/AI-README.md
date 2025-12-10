# AI-README.md — Technical Reference for The Weakest Lynx

> Technical documentation for AI coding assistants working on this project.

---

## 🎯 Project Overview

**The Weakest Lynx** is a supply chain security auditor that:
1. Accepts a package name and ecosystem
2. Resolves the dependency tree via registry APIs
3. Scans for vulnerabilities using OSV.dev
4. Calculates a security score
5. Suggests version upgrades

---

## ✅ What's Implemented

### Backend (Express.js + TypeScript)

| Component | File | Status |
|-----------|------|--------|
| Server Entry | `src/server/index.ts` | ✅ |
| Configuration | `src/server/config.ts` | ✅ |
| Logging | `src/server/logger.ts` | ✅ |
| Types | `src/server/types.ts` | ✅ |
| Health Routes | `src/server/routes/health.ts` | ✅ |
| Scan Routes | `src/server/routes/scan.ts` | ✅ |
| Config Routes | `src/server/routes/config.ts` | ✅ |
| PyPI Resolver | `src/server/services/ecosystems/pypi.ts` | ✅ |
| npm Resolver | `src/server/services/ecosystems/npm.ts` | ✅ |
| Maven Resolver | `src/server/services/ecosystems/maven.ts` | ✅ |
| Go Resolver | `src/server/services/ecosystems/go.ts` | ✅ |
| RubyGems Resolver | `src/server/services/ecosystems/rubygems.ts` | ✅ |
| Scanner Orchestrator | `src/server/services/scanner/index.ts` | ✅ |
| OSV Client | `src/server/services/scanner/osv.ts` | ✅ |
| Score Calculator | `src/server/services/scanner/score.ts` | ✅ |
| Remediation Engine | `src/server/services/remediation/engine.ts` | ✅ |
| Changelog Fetcher | `src/server/services/remediation/changelog.ts` | ✅ |
| Pattern Database | `src/server/services/remediation/patterns.ts` | ✅ |
| Markdown Export | `src/server/services/export/markdown.ts` | ✅ |

### Frontend (React + TypeScript + Tailwind)

| Component | File | Status |
|-----------|------|--------|
| App Entry | `src/client/App.tsx` | ✅ |
| Main Entry | `src/client/main.tsx` | ✅ |
| Header | `src/client/components/layout/Header.tsx` | ✅ |
| Mascot | `src/client/components/LynxMascot.tsx` | ✅ |
| Scan Form | `src/client/components/scan/ScanForm.tsx` | ✅ |
| Results View | `src/client/components/results/ResultsView.tsx` | ✅ |
| Score Card | `src/client/components/results/ScoreCard.tsx` | ✅ |
| Dependency Tree | `src/client/components/results/DependencyTree.tsx` | ✅ |
| Dependency Modal | `src/client/components/results/DependencyModal.tsx` | ✅ |
| Vulnerability List | `src/client/components/results/VulnerabilityList.tsx` | ✅ |
| Vulnerability Card | `src/client/components/results/VulnerabilityCard.tsx` | ✅ |
| Version Selector | `src/client/components/results/VersionSelector.tsx` | ✅ |
| Remediation Queue | `src/client/components/results/RemediationQueue.tsx` | ✅ |
| Scan Metadata | `src/client/components/results/ScanMetadataPanel.tsx` | ✅ |
| Styles | `src/client/styles/index.css` | ✅ |

---

## ❌ What's NOT Implemented

| Feature | Status |
|---------|--------|
| CLI Mode | ✅ Implemented |
| Container/Image Scanning | ❌ Not implemented |
| File Upload (requirements.txt, etc.) | ❌ Not implemented |
| Grype Integration | ❌ Not implemented (OSV only) |
| Syft SBOM | ❌ Not implemented |
| AI Code Suggestions | ❌ Not implemented |
| GitHub PR Creation | ❌ Not implemented |
| GitHub OAuth | ❌ Not implemented |
| SARIF Export | ❌ Not implemented |
| Code Pattern Matching | ❌ Not implemented |
| Side-by-Side Comparison View | ❌ Not implemented |
| Interactive Accept/Skip Fixes | ❌ Not implemented |
| D3.js/Cytoscape Dependency Graph | ❌ Not implemented (list only) |

---

## 🖥️ CLI Reference

### Installation

```bash
# Run directly with npm
npm run lynx -- <command>

# Or build and install globally
npm run build:cli
npm link
lynx <command>
```

### Commands

```bash
# Scan a package (standalone mode - no server needed)
lynx scan <ecosystem> <package> [options]

# Examples:
lynx scan npm lodash                    # Scan latest lodash
lynx scan pypi requests -o json         # Output as JSON
lynx scan npm express -o markdown       # Output as Markdown
lynx scan go github.com/gin-gonic/gin   # Scan Go module

# Scan via remote server (API client mode)
lynx scan npm axios --server http://localhost:8080

# Check server health
lynx health http://localhost:8080

# Start the web server
lynx server --port 8080
```

### Scan Options

| Option | Description | Default |
|--------|-------------|--------|
| `-v, --version <ver>` | Specific version to scan | latest |
| `-o, --output <fmt>` | Output format: table, json, markdown, summary | table |
| `-s, --server <url>` | Use remote server instead of local scan | - |
| `-t, --timeout <sec>` | Timeout in seconds | 60 |
| `--verbose` | Enable verbose logging | false |

### Exit Codes

| Code | Meaning |
|------|--------|
| 0 | Success, no critical/high vulnerabilities |
| 1 | Scan completed but critical/high vulnerabilities found |
| 2 | Scan failed (error) |

### CLI Files

| File | Purpose |
|------|--------|
| `src/cli/index.ts` | CLI entry point |
| `src/cli/commands/scan.ts` | Scan command |
| `src/cli/commands/server.ts` | Server command |
| `src/cli/commands/health.ts` | Health check command |
| `src/cli/formatters/output.ts` | Table/JSON/Markdown formatters |
| `src/cli/utils/api-client.ts` | Remote server API client |

---

## 📋 API Reference

### Implemented Endpoints

```
GET  /health                           # Health check
GET  /ready                            # Readiness check
POST /api/scan                         # Start scan
GET  /api/scan/:id                     # Get scan results
GET  /api/scan/:id/dependencies        # Get dependencies
GET  /api/scan/:id/vulnerabilities     # Get vulnerabilities
GET  /api/scan/:id/remediations        # Get remediations
GET  /api/scan/:id/export?format=...   # Export (json, markdown)
GET  /api/versions/:ecosystem/:package # Get package versions
GET  /api/config                       # Get config
PUT  /api/config                       # Update config
```

### Scan Request Schema

```typescript
interface ScanRequest {
  ecosystem: 'pypi' | 'npm' | 'maven' | 'go' | 'rubygems';
  package: string;
  version?: string;  // Optional, defaults to 'latest'
}
```

### Scan Response Schema

```typescript
interface ScanResponse {
  id: string;
  status: 'scanning' | 'completed' | 'error';
  ecosystem: string;
  target: string;
  version: string;
  scanDate: string;
  scanTime: number;
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
```

---

## 🔧 Key Implementation Details

### OSV API Integration

The OSV client queries with version for accurate filtering:

```typescript
// src/server/services/scanner/osv.ts
const response = await fetch('https://api.osv.dev/v1/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    package: { name: pkg, ecosystem },
    version: version,  // Include version for accurate filtering
  }),
});
```

### Ecosystem Resolvers

Each ecosystem has a resolver that:
1. Fetches package metadata from the registry
2. Resolves transitive dependencies (depth limit: 2)
3. Queries OSV for each dependency
4. Returns a list of `Dependency` objects

Registry APIs used:
- **PyPI**: `https://pypi.org/pypi/{package}/json`
- **npm**: `https://registry.npmjs.org/{package}`
- **Maven**: `https://search.maven.org/solrsearch/select`
- **Go**: `https://proxy.golang.org/{module}/@v/list`
- **RubyGems**: `https://rubygems.org/api/v1/gems/{gem}.json`

### Security Score Calculation

```typescript
// src/server/services/scanner/score.ts
let score = 100;
for (const vuln of vulnerabilities) {
  switch (vuln.severity) {
    case 'critical': score -= 25; break;
    case 'high': score -= 15; break;
    case 'medium': score -= 5; break;
    case 'low': score -= 1; break;
  }
}
// Penalty for large dependency trees
if (dependencyCount > 100) {
  score -= Math.min(10, Math.floor((dependencyCount - 100) / 50));
}
return Math.max(0, Math.min(100, score));
```

### Version Proxy (CORS Workaround)

The frontend can't call registry APIs directly due to CORS. The backend provides a proxy:

```
GET /api/versions/:ecosystem/:package
```

Returns: `{ versions: ["1.0.0", "1.0.1", ...] }`

---

## 🎨 UI Architecture

### Component Hierarchy

```
App
├── Header (with mascot)
├── ScanForm (when no scan)
│   ├── Ecosystem dropdown
│   ├── Package input
│   └── Popular packages
└── ResultsView (when scan complete)
    ├── Sticky Header (package@version + New Scan)
    ├── VersionSelector
    ├── ScoreCard
    ├── DependencyTree
    │   └── DependencyModal (on click)
    ├── VulnerabilityList
    │   └── VulnerabilityCard
    ├── RemediationQueue
    └── ScanMetadataPanel
```

### State Management

Simple React state in App.tsx:
- `view`: 'scan' | 'results'
- `scanId`: string | null

ResultsView polls `/api/scan/:id` until status is 'completed'.

---

## 🔒 HTTPS Configuration

The server supports HTTPS with automatic HTTP→HTTPS redirect:

```typescript
// Environment variables
HTTPS_PORT=8443        // HTTPS server port
ENABLE_HTTPS=true      // Enable HTTPS (auto-enabled in production)
PORT=8080              // HTTP port (redirects to HTTPS when enabled)
```

Certificates are stored in `certs/server.key` and `certs/server.crt` (self-signed for development).

---

## 📁 File Structure (Actual)

```
certs/
├── server.key         # TLS private key
└── server.crt         # TLS certificate

src/
├── client/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── LynxMascot.tsx
│   │   ├── layout/Header.tsx
│   │   ├── scan/ScanForm.tsx
│   │   └── results/
│   │       ├── ResultsView.tsx
│   │       ├── ScoreCard.tsx
│   │       ├── DependencyTree.tsx
│   │       ├── DependencyModal.tsx
│   │       ├── VulnerabilityList.tsx
│   │       ├── VulnerabilityCard.tsx
│   │       ├── VersionSelector.tsx
│   │       ├── RemediationQueue.tsx
│   │       └── ScanMetadataPanel.tsx
│   └── styles/index.css
│
└── server/
    ├── index.ts
    ├── config.ts
    ├── logger.ts
    ├── types.ts
    ├── routes/
    │   ├── health.ts
    │   ├── scan.ts
    │   └── config.ts
    ├── services/
    │   ├── ecosystems/
    │   │   ├── pypi.ts
    │   │   ├── npm.ts
    │   │   ├── maven.ts
    │   │   ├── go.ts
    │   │   └── rubygems.ts
    │   ├── scanner/
    │   │   ├── index.ts
    │   │   ├── osv.ts
    │   │   └── score.ts
    │   ├── remediation/
    │   │   ├── engine.ts
    │   │   ├── changelog.ts
    │   │   └── patterns.ts
    │   └── export/
    │       └── markdown.ts
    └── data/
        └── patterns/pypi.json
```

---

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Start dev server (frontend + backend with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npx tsc --noEmit
```

---

## 📊 Code Stats

- **Total Lines**: ~3,260
- **Frontend**: ~1,700 lines (14 files)
- **Backend**: ~1,500 lines (14 files)
- **Ecosystems**: 5 (PyPI, npm, Maven, Go, RubyGems)

---

## 🎨 Design System

### Colors (Dark Mode)
- Background: `slate-900` (#0f172a)
- Cards: `slate-800` (#1e293b)
- Text: `slate-50` (#f8fafc)
- Accent: `violet-500` (#8b5cf6)
- Critical: `red-500` (#ef4444)
- High: `orange-500` (#f97316)
- Medium: `yellow-500` (#eab308)
- Low: `green-500` (#22c55e)

### Typography
- Font: System UI
- Code: Monospace

---

*Last updated: December 2024*
