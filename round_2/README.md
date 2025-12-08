# 🐆 The Weakest Lynx

> A supply chain security auditor that finds your weakest dependencies and shows you exactly how to fix them.

```
🐆🔗💀 → 🐆🔗✅
   Your dependencies have dependencies. We find the weak ones.
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker** (required)
- **Git** (required)

```bash
# Install Docker on Ubuntu/WSL
sudo apt update && sudo apt install -y docker.io
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

### Build & Run

```bash
# Clone the repository
git clone https://github.com/ProvenGuilty/vibelympics.git
cd vibelympics/round_2

# Build the container (fetches latest vulnerability databases)
docker build -t weakest-lynx .

# Run the web UI
docker run -p 8080:8080 weakest-lynx

# Open in browser
# http://localhost:8080
```

### CLI Usage

```bash
# Scan a PyPI package
docker run weakest-lynx scan --ecosystem pypi --package requests

# Scan an npm package
docker run weakest-lynx scan --ecosystem npm --package lodash

# Scan from a requirements file
docker run -v $(pwd):/workspace weakest-lynx scan --file /workspace/requirements.txt

# Scan a container image
docker run weakest-lynx scan --image python:3.11-slim

# Output as JSON with SARIF
docker run weakest-lynx scan --ecosystem pypi --package requests --format json --sarif

# Enable AI-powered code suggestions (requires API key)
docker run -e OPENAI_API_KEY=sk-... weakest-lynx scan --ecosystem pypi --package requests --ai
```

---

## 📖 What Does It Do?

The Weakest Lynx audits your software dependencies and tells you:

1. **What's installed** — Every package and its transitive dependencies, visualized as an interactive map
2. **What's vulnerable** — CVEs, severity scores, and exploit information from OSV and Grype databases
3. **What to fix** — Specific version upgrades with breaking change warnings
4. **How to fix it** — Migration guides, changelog excerpts, and (optionally) AI-generated code patches

### The Two-Screen Philosophy

| Screen 1: "How Bad You Are" | Screen 2: "How Good You Could Be" |
|-----------------------------|-----------------------------------|
| Current dependency tree | Proposed dependency tree |
| Vulnerabilities highlighted in red | Vulnerabilities resolved in green |
| Risk score: 34/100 | Risk score: 98/100 |
| Click any vulnerability → see details | Click any fix → see what changes |

### Interactive Remediation

- **Accept one fix at a time** — Review each change individually
- **Skip fixes you can't apply** — Maybe you need that old version for compatibility
- **Accept all** — Blind acceptance is absolutely part of our business
- **Export your choices** — Get a patched `requirements.txt`, `package.json`, or diff file

---

## 🎯 Features

### Core Features (Always Available)

| Feature | Description |
|---------|-------------|
| 🗺️ **Dependency Map** | Interactive visualization of your entire dependency tree |
| 🔴 **Vulnerability Detection** | CVE scanning via OSV + Grype databases |
| 📊 **Risk Scoring** | Overall security score with breakdown by severity |
| 📋 **Version Suggestions** | "Upgrade X to Y" recommendations |
| ⚠️ **Breaking Change Warnings** | Flags major version bumps that may break your code |
| 📚 **Migration Guides** | Links to official upgrade documentation |
| 📜 **Changelog Parsing** | Extracts breaking changes from release notes |
| 🔍 **Code Pattern Matching** | Greps your code for patterns affected by upgrades |
| ✅ **Compatibility Matrix** | Shows which versions work together |
| 📥 **Export Reports** | JSON, Markdown, SARIF formats |

### AI-Powered Features (Optional, Off by Default)

| Feature | Description |
|---------|-------------|
| 💻 **Code Patch Suggestions** | AI analyzes your code and suggests specific changes |
| 🔄 **Automated PR Creation** | Creates a GitHub PR with all fixes applied |
| 📝 **Migration Summaries** | AI-generated plain-English upgrade guides |

---

## 🌐 Supported Ecosystems

All ecosystems are enabled by default. Disable any via feature toggles if issues arise.

| Ecosystem | Package Manager | Manifest Files |
|-----------|-----------------|----------------|
| 🐍 **PyPI** | pip, poetry, pipenv | `requirements.txt`, `pyproject.toml`, `Pipfile.lock` |
| 📦 **npm** | npm, yarn, pnpm | `package.json`, `package-lock.json`, `yarn.lock` |
| ☕ **Maven** | Maven, Gradle | `pom.xml`, `build.gradle` |
| 🐹 **Go** | go modules | `go.mod`, `go.sum` |
| 💎 **RubyGems** | bundler | `Gemfile`, `Gemfile.lock` |
| 🐳 **Containers** | Docker, OCI | Image references |

---

## 🎨 User Interface

### Web UI

```
┌─────────────────────────────────────────────────────────────────────┐
│  🐆 THE WEAKEST LYNX                          [🌙 Dark] [⚙️ Settings]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  WHAT WOULD YOU LIKE TO AUDIT?                                      │
│  ─────────────────────────────                                      │
│                                                                     │
│  ○ Package:    [requests        ] Ecosystem: [PyPI         ▼]      │
│  ○ File:       [📁 Drop requirements.txt / package.json here  ]     │
│  ○ Container:  [python:3.11-slim                              ]     │
│                                                                     │
│                         [🔍 Scan]                                   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  FEATURE TOGGLES                                                    │
│  ───────────────                                                    │
│  [✓] PyPI  [✓] npm  [✓] Maven  [✓] Go  [✓] RubyGems  [✓] Containers│
│  [ ] AI Code Suggestions (requires API key)                         │
│  [ ] GitHub PR Creation (requires authentication)                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Results View

```
┌────────────────────────────────┬────────────────────────────────────┐
│  🔴 CURRENT STATE              │  🟢 AFTER REMEDIATION              │
│  Security Score: 34/100        │  Security Score: 98/100            │
├────────────────────────────────┼────────────────────────────────────┤
│                                │                                    │
│  [Interactive Dependency Map]  │  [Interactive Dependency Map]      │
│                                │                                    │
│  🔴 urllib3 1.26.5 (2 CVEs)   │  ✅ urllib3 2.0.4                  │
│  🔴 requests 2.28.0 (1 CVE)   │  ✅ requests 2.31.0                │
│  🟡 idna 3.3 (1 CVE)          │  ✅ idna 3.6                       │
│                                │                                    │
├────────────────────────────────┴────────────────────────────────────┤
│  REMEDIATION QUEUE                                                  │
│  ─────────────────                                                  │
│                                                                     │
│  ☐ urllib3 1.26.5 → 2.0.4     ⚠️ Breaking changes    [View] [Skip] │
│  ☐ requests 2.28.0 → 2.31.0   ✅ Drop-in             [View] [Skip] │
│  ☐ idna 3.3 → 3.6             ✅ Drop-in             [View] [Skip] │
│                                                                     │
│  [Accept Selected]  [Accept All]  [Export Report]  [Create PR]      │
└─────────────────────────────────────────────────────────────────────┘
```

### Remediation Detail (Expanded)

```
┌─────────────────────────────────────────────────────────────────────┐
│  📦 urllib3: 1.26.5 → 2.0.4                                         │
│  ─────────────────────────────                                      │
│                                                                     │
│  🔴 CVE-2023-43804 (HIGH) — Cookie header leakage                   │
│  🟡 CVE-2023-45803 (MEDIUM) — Request smuggling                     │
│                                                                     │
│  ⚠️ BREAKING CHANGES DETECTED                                       │
│  ───────────────────────────                                        │
│  • Removed: urllib3.contrib.pyopenssl                               │
│  • Moved: urllib3.util.retry.Retry → urllib3.util.Retry             │
│  • Changed: HTTPConnectionPool() requires 'block' parameter         │
│                                                                     │
│  🔍 YOUR CODE USES AFFECTED PATTERNS                                │
│  ───────────────────────────────────                                │
│  app/client.py:42                                                   │
│  │ from urllib3.util.retry import Retry                             │
│  │ ─────────────────────────────────                                │
│  │ This import path was removed. Use: from urllib3.util import Retry│
│                                                                     │
│  📚 RESOURCES                                                       │
│  • Migration Guide: https://urllib3.readthedocs.io/en/stable/v2-mi… │
│  • Changelog: https://github.com/urllib3/urllib3/blob/main/CHANGES… │
│                                                                     │
│  💻 SUGGESTED CODE CHANGES (AI-generated, toggle on to see)         │
│  ──────────────────────────────────────────────────────────         │
│  [Enable AI suggestions in Settings to see code patches]            │
│                                                                     │
│  [☐ Accept This Fix]  [Skip]  [Back]                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Web server port | `8080` |
| `LOG_LEVEL` | Logging verbosity (debug, info, warn, error) | `info` |
| `ENABLE_PYPI` | Enable PyPI ecosystem | `true` |
| `ENABLE_NPM` | Enable npm ecosystem | `true` |
| `ENABLE_MAVEN` | Enable Maven ecosystem | `true` |
| `ENABLE_GO` | Enable Go ecosystem | `true` |
| `ENABLE_RUBYGEMS` | Enable RubyGems ecosystem | `true` |
| `ENABLE_CONTAINERS` | Enable container scanning | `true` |
| `ENABLE_AI` | Enable AI-powered suggestions | `false` |
| `AI_PROVIDER` | AI provider (openai, anthropic, ollama) | `openai` |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `ANTHROPIC_API_KEY` | Anthropic API key | — |
| `OLLAMA_HOST` | Ollama server URL | `http://localhost:11434` |
| `GITHUB_TOKEN` | GitHub PAT for PR creation | — |

### Feature Toggles via CLI

```bash
# Disable specific ecosystems
docker run weakest-lynx scan --package lodash --disable-maven --disable-go

# Enable AI with specific provider
docker run -e ANTHROPIC_API_KEY=sk-... weakest-lynx scan --package requests --ai --ai-provider anthropic

# Use local Ollama
docker run --network host weakest-lynx scan --package requests --ai --ai-provider ollama
```

---

## 🔐 GitHub Integration

### Option A: Personal Access Token (Simple)

```bash
# Set token via environment variable
docker run -e GITHUB_TOKEN=ghp_xxxx weakest-lynx scan --package requests --create-pr --repo owner/repo

# Or paste in the UI under Settings → GitHub → Personal Access Token
```

Required token scopes: `repo` (for private repos) or `public_repo` (for public only)

### Option B: OAuth Login (User-Friendly)

1. Click **"Login with GitHub"** in the web UI
2. Authorize The Weakest Lynx
3. PR creation is now enabled for your repositories

---

## 📊 Output Formats

### JSON (Default)

```bash
docker run weakest-lynx scan --package requests --format json > report.json
```

```json
{
  "package": "requests",
  "version": "2.28.0",
  "ecosystem": "pypi",
  "scan_date": "2024-12-08T06:00:00Z",
  "security_score": 34,
  "vulnerabilities": [
    {
      "id": "CVE-2023-32681",
      "severity": "HIGH",
      "package": "requests",
      "installed_version": "2.28.0",
      "fixed_version": "2.31.0",
      "description": "..."
    }
  ],
  "dependencies": [...],
  "remediations": [...]
}
```

### JSON with SARIF

```bash
docker run weakest-lynx scan --package requests --format json --sarif > report.sarif.json
```

SARIF format integrates with GitHub Code Scanning, VS Code, and other security tools.

### Markdown

```bash
docker run weakest-lynx scan --package requests --format markdown > report.md
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (UI)                                │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              React + TypeScript + Tailwind + shadcn/ui         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │ │
│  │  │ 🐆 Nav   │ │ 🗺️ Map   │ │ 📊 Score │ │ 📋 Queue │         │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Express.js Backend (Node)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ /health  │ │ /api/scan│ │ /api/fix │ │ /api/pr  │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Core Services                               │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │ │
│  │  │ Ecosystem   │ │ Vuln        │ │ Remediation │             │ │
│  │  │ Resolvers   │ │ Scanner     │ │ Engine      │             │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │ │
│  │  │ Changelog   │ │ Pattern     │ │ AI Provider │             │ │
│  │  │ Parser      │ │ Matcher     │ │ (optional)  │             │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘             │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Chainguard Container (cgr.dev/chainguard/node)         │
│  • Grype (vulnerability scanner)                                    │
│  • Syft (SBOM generator)                                            │
│  • Ecosystem CLIs (pip, npm, mvn, go, gem)                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 API Reference

All UI functionality is available via API for CLI and automation use.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness probe |
| `/ready` | GET | Readiness probe |
| `/api/scan` | POST | Scan a package, file, or container |
| `/api/scan/:id` | GET | Get scan results by ID |
| `/api/scan/:id/dependencies` | GET | Get dependency tree |
| `/api/scan/:id/vulnerabilities` | GET | Get vulnerability list |
| `/api/scan/:id/remediations` | GET | Get remediation suggestions |
| `/api/scan/:id/remediation/:rid` | GET | Get specific remediation detail |
| `/api/scan/:id/accept` | POST | Accept selected remediations |
| `/api/scan/:id/export` | GET | Export report (format query param) |
| `/api/scan/:id/pr` | POST | Create GitHub PR with fixes |
| `/api/config` | GET | Get current feature toggle state |
| `/api/config` | PUT | Update feature toggles |

### Example: Scan via API

```bash
curl -X POST http://localhost:8080/api/scan \
  -H "Content-Type: application/json" \
  -d '{"ecosystem": "pypi", "package": "requests"}'
```

### Example: Export Report

```bash
curl http://localhost:8080/api/scan/abc123/export?format=markdown
```

---

## 📁 Project Structure

```
round_2/
├── Dockerfile                    # Multi-stage Chainguard build
├── docker-compose.yml            # Local development setup
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite bundler config
├── tailwind.config.js            # Tailwind CSS config
├── .env.example                  # Environment variable template
├── README.md                     # This file (human-readable)
├── AI-README.md                  # AI implementation guide
│
├── src/
│   ├── server/
│   │   ├── index.ts              # Express server entry
│   │   ├── config.ts             # Feature toggle configuration
│   │   ├── logger.ts             # Pino structured logging
│   │   │
│   │   ├── routes/
│   │   │   ├── health.ts         # Health/ready endpoints
│   │   │   ├── scan.ts           # Scan API endpoints
│   │   │   ├── config.ts         # Config API endpoints
│   │   │   └── github.ts         # GitHub OAuth + PR endpoints
│   │   │
│   │   ├── services/
│   │   │   ├── ecosystems/
│   │   │   │   ├── index.ts      # Ecosystem router
│   │   │   │   ├── pypi.ts       # PyPI resolver
│   │   │   │   ├── npm.ts        # npm resolver
│   │   │   │   ├── maven.ts      # Maven resolver
│   │   │   │   ├── go.ts         # Go modules resolver
│   │   │   │   ├── rubygems.ts   # RubyGems resolver
│   │   │   │   └── container.ts  # Container image scanner
│   │   │   │
│   │   │   ├── scanner/
│   │   │   │   ├── grype.ts      # Grype vulnerability scanner
│   │   │   │   ├── osv.ts        # OSV database client
│   │   │   │   └── sbom.ts       # Syft SBOM generator
│   │   │   │
│   │   │   ├── remediation/
│   │   │   │   ├── engine.ts     # Remediation suggestion engine
│   │   │   │   ├── changelog.ts  # Changelog parser
│   │   │   │   ├── patterns.ts   # Breaking change patterns DB
│   │   │   │   ├── matcher.ts    # Code pattern matcher
│   │   │   │   └── compatibility.ts # Version compatibility checker
│   │   │   │
│   │   │   ├── ai/
│   │   │   │   ├── index.ts      # AI provider router
│   │   │   │   ├── openai.ts     # OpenAI client
│   │   │   │   ├── anthropic.ts  # Anthropic client
│   │   │   │   └── ollama.ts     # Ollama client
│   │   │   │
│   │   │   ├── github/
│   │   │   │   ├── oauth.ts      # GitHub OAuth flow
│   │   │   │   ├── api.ts        # GitHub API client
│   │   │   │   └── pr.ts         # PR creation logic
│   │   │   │
│   │   │   └── export/
│   │   │       ├── json.ts       # JSON exporter
│   │   │       ├── sarif.ts      # SARIF formatter
│   │   │       └── markdown.ts   # Markdown exporter
│   │   │
│   │   └── data/
│   │       └── patterns/         # Known breaking change patterns
│   │           ├── pypi.json
│   │           ├── npm.json
│   │           └── ...
│   │
│   └── client/
│       ├── main.tsx              # React entry
│       ├── App.tsx               # Main app component
│       ├── types.ts              # TypeScript types
│       │
│       ├── styles/
│       │   └── index.css         # Tailwind + custom styles
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.tsx
│       │   │   ├── Footer.tsx
│       │   │   └── ThemeToggle.tsx
│       │   │
│       │   ├── scan/
│       │   │   ├── ScanForm.tsx
│       │   │   ├── EcosystemSelector.tsx
│       │   │   └── FileUpload.tsx
│       │   │
│       │   ├── results/
│       │   │   ├── ResultsView.tsx
│       │   │   ├── ScoreCard.tsx
│       │   │   ├── DependencyMap.tsx
│       │   │   ├── VulnerabilityList.tsx
│       │   │   └── ComparisonView.tsx
│       │   │
│       │   ├── remediation/
│       │   │   ├── RemediationQueue.tsx
│       │   │   ├── RemediationCard.tsx
│       │   │   ├── RemediationDetail.tsx
│       │   │   ├── CodeDiff.tsx
│       │   │   └── AcceptButtons.tsx
│       │   │
│       │   ├── settings/
│       │   │   ├── SettingsPanel.tsx
│       │   │   ├── FeatureToggles.tsx
│       │   │   ├── AIConfig.tsx
│       │   │   └── GitHubConfig.tsx
│       │   │
│       │   └── export/
│       │       └── ExportMenu.tsx
│       │
│       └── hooks/
│           ├── useScan.ts
│           ├── useRemediation.ts
│           ├── useConfig.ts
│           └── useGitHub.ts
│
└── public/
    └── lynx-logo.svg             # Logo asset
```

---

## 🛡️ Security Features

- ✅ **Chainguard Base Image** — Minimal attack surface
- ✅ **Non-root User** — Container runs unprivileged
- ✅ **No Secrets in Image** — All credentials via environment variables
- ✅ **CSP Headers** — Content Security Policy via Helmet.js
- ✅ **Input Validation** — All user inputs sanitized
- ✅ **Rate Limiting** — Prevents abuse
- ✅ **Structured Logging** — No sensitive data in logs
- ✅ **Graceful Shutdown** — Proper signal handling

---

## 🐆 Why "The Weakest Lynx"?

- **Lynx** — A sharp-eyed predator that spots prey others miss
- **Links** — Your dependency chain is only as strong as its weakest link
- **Wordplay** — Because security tools don't have to be boring

---

## 👥 Team

**Team ProvenGuilty**
- [@ProvenGuilty](https://github.com/ProvenGuilty)
- [@mrshaun13](https://github.com/mrshaun13)

---

## 📜 Tech Stack

| Component | Technology |
|-----------|------------|
| Container | Chainguard Node (`cgr.dev/chainguard/node`) |
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS + shadcn/ui |
| Backend | Express.js + TypeScript |
| Vuln Scanner | Grype + OSV |
| SBOM | Syft |
| Visualization | D3.js / Cytoscape.js |
| AI (optional) | OpenAI / Anthropic / Ollama |
| Logging | Pino |
| Security | Helmet.js |

---

## 📝 License

MIT

---

## 🐆🔗✅

*Built with love for Vibelympics 2025*
