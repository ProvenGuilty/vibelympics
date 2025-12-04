# 🐙 Linky's Container Security Dashboard

> An emoji-only web dashboard where Linky the octopus helps you visualize container security status.

```
🐙🛡️📦 - Secure containers, happy Linky!
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker** (required)
- **Windows 11 + WSL Ubuntu 24.04** (recommended) or any Linux/macOS with Docker

```bash
# Install Docker on Ubuntu/WSL
sudo apt update && sudo apt install -y docker.io
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

### Build & Run

```bash
# Clone the repository (if not already done)
git clone https://github.com/ProvenGuilty/vibelympics.git
cd vibelympics/round_1

# Build the container
docker build -t linky-security .

# Run the container (HTTP + HTTPS)
docker run -p 3000:3000 -p 3443:3443 linky-security

# Open in browser
# HTTP:  http://localhost:3000
# HTTPS: https://localhost:3443 (accept self-signed cert warning)
```

### Alternative: Local Development

```bash
# Install Node.js 20+ if not using Docker
cd round_1
npm install
npm run dev

# Open http://localhost:5173 in your browser
```

> **Note**: In dev mode, the frontend runs on port 5173 (Vite) and proxies API calls to port 3000 (Express). In production/Docker, everything runs on port 3000.

---

## 📖 What Does It Do?

Linky's Security Dashboard displays container security information using **only emojis** for the UI:

| Emoji | Meaning |
|-------|---------|
| 🐙 | Linky (mascot/home) |
| 📦 | Container |
| 🛡️ | Security |
| ✅ | Signed/Verified |
| ❌ | Unsigned/Failed |
| 🔴 | Critical severity |
| 🟠 | High severity |
| 🟡 | Medium severity |
| 🟢 | Low severity |
| ⚪ | No vulnerabilities |
| ⭐ | Rating (Uber-style) |
| 🌯 | Burrito Health Score |
| 🎩 | Hat (click Linky!) |

### Features

- 📊 **Dashboard Stats** - Total containers, signed/unsigned counts, severity breakdown
- 🔍 **Filter by Severity** - Click emoji buttons to filter containers
- 📦 **Container Cards** - Each container shows vulnerabilities, rating, and burrito score
- 🎩 **Hat Picker** - Click Linky to change his hat (Easter egg!)
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 🔄 **Refresh** - Reload container data
- ➕ **Add Containers** - Paste any Docker image URL to scan it
- 🔲📋📝 **View Modes** - Grid, Compact List, or Detailed List views
- 🔗 **Clickable Tags** - Filter by clicking on container labels
- ✏️ **Delete Containers** - Erase individual containers or reset all
- 🔍 **Vulnerability Details** - Click any container to see CVE details

---

## 📊 Scoring System

Each container in the dashboard is scored based on security metrics from vulnerability scans:

### Severity Colors

| Color | Severity | Description |
|-------|----------|-------------|
| 🔴 | **Critical** | Actively exploited vulnerabilities requiring immediate action |
| 🟠 | **High** | Serious vulnerabilities that should be patched soon |
| 🟡 | **Medium** | Moderate risk vulnerabilities to address in regular cycles |
| 🟢 | **Low** | Minor issues with limited security impact |
| ⚪ | **None** | No known vulnerabilities - clean image! |

### Container Metrics

| Metric | Range | Description |
|--------|-------|-------------|
| ⭐ **Rating** | 1-5 stars | Uber-style rating based on overall security posture |
| 🌯 **Burrito Score** | 0-100 | Health score (higher = healthier, like a fresh burrito) |
| ✅/❌ **Signed** | Yes/No | Whether the image is cryptographically signed (Sigstore) |
| 📦 **SBOM Packages** | Count | Number of packages in the Software Bill of Materials |

### How Scores Are Calculated

- **5 ⭐ / 100 🌯** - Zero vulnerabilities, signed image, minimal packages
- **4 ⭐ / 80-99 🌯** - Only low-severity vulnerabilities, signed
- **3 ⭐ / 50-79 🌯** - Medium vulnerabilities present
- **2 ⭐ / 20-49 🌯** - High vulnerabilities detected
- **1 ⭐ / 0-19 🌯** - Critical vulnerabilities, unsigned, or stale scan

### Sample Containers

The dashboard displays mock data representing typical container registry scenarios:

| Container | Status | Why |
|-----------|--------|-----|
| 📦node `latest` | ⚪ 5⭐ 100🌯 | Chainguard image - zero CVEs, signed |
| 📦python `latest` | 🟢 4.8⭐ 95🌯 | Minor low-severity issues only |
| 📦legacy-app `v1.2.3` | 🔴 1.2⭐ 15🌯 | Outdated, unsigned, critical vulns |
| 📦mystery-box `yolo` | 🔴 0.5⭐ 3🌯 | Unknown origin, massive attack surface |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (UI)                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           React + TypeScript + Tailwind          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │ 🐙 Nav  │ │📦 Cards │ │📊 Stats │           │   │
│  │  └─────────┘ └─────────┘ └─────────┘           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Express.js Backend (Node)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ /health  │ │ /ready   │ │ /api/*   │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│  • CSP Headers  • Structured Logging  • CORS          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         Chainguard Container (cgr.dev/chainguard/node)  │
│  • Multi-stage build (dev → production)                │
│  • Non-root user                                        │
│  • Minimal attack surface                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔬 How Container Security Scanning Works

This dashboard simulates what real container security tools do. Here's what happens when you scan a container image:

### Step 1: Unpack the Image 📦➡️📂

A container image is like a zip file with layers. The scanner downloads it and unpacks each layer to see all the files inside — the operating system, installed programs, config files, everything.

### Step 2: Find All the Software 🔍

The scanner looks for two types of software:

- **OS Packages** — Programs installed by the operating system (like `apt install nginx`). These are tracked in files like `/var/lib/dpkg/status` on Debian or `/lib/apk/db/installed` on Alpine.
- **App Dependencies** — Libraries your code uses. These come from files like `package-lock.json` (Node.js), `requirements.txt` (Python), or `go.sum` (Go).

### Step 3: Build a Software List (SBOM) 📜

The scanner creates a **Software Bill of Materials** — basically a receipt listing every piece of software in the container, including versions. This is like the ingredients list on food packaging.

### Step 4: Check for Known Vulnerabilities 🔴🟠🟡🟢

Now the scanner compares that list against databases of known security problems:

- **CVE Database** — The main list of publicly known vulnerabilities (like CVE-2024-1234)
- **Vendor Advisories** — Security alerts from companies like Red Hat, Ubuntu, or Chainguard
- **OSV** — Open Source Vulnerabilities database

Each vulnerability has a severity:
| Severity | What It Means |
|----------|---------------|
| 🔴 Critical | Attackers can take over your system remotely |
| 🟠 High | Serious problems that need fixing soon |
| 🟡 Medium | Should be fixed, but less urgent |
| 🟢 Low | Minor issues, fix when convenient |

### Step 5: Verify Signatures ✅❌

Good container images are **signed** — like a wax seal on a letter. The scanner checks:

- Was this image signed by someone you trust?
- Has the image been tampered with since it was signed?

Tools like **Sigstore/cosign** make this easy. Unsigned images (❌) could have been modified by anyone.

### Step 6: Make a Decision 🛡️

Based on all this, you decide:
- ✅ **Deploy it** — No critical issues, image is signed
- ⚠️ **Fix first** — Has vulnerabilities that need patching
- ❌ **Reject it** — Too risky, find a better base image

---

## ⚖️ What Actually Matters (Weighting)

Not all security signals are equal. Here's how a real security team would prioritize:

| Signal | Weight | Why |
|--------|--------|-----|
| 🔴 **Critical CVEs** | 🔥🔥🔥🔥🔥 | Immediate action. Attackers can exploit these right now. |
| ✅❌ **Signature** | 🔥🔥🔥🔥 | No signature = you can't trust where it came from. Could be tampered. |
| 🟠 **High CVEs** | 🔥🔥🔥 | Fix soon. Exploitable but may need specific conditions. |
| 📦 **Package Count** | 🔥🔥 | More packages = more attack surface. Minimal is better. |
| 🟡 **Medium CVEs** | 🔥🔥 | Plan to fix. Less urgent but still real risks. |
| 🟢 **Low CVEs** | 🔥 | Fix when convenient. Minor issues. |
| 📅 **Last Scanned** | 🔥 | Stale scans miss new vulnerabilities. Rescan regularly. |

### The Fun Metrics (Easter Eggs)

These are **just for vibes** — they don't represent real security calculations:

| Metric | What It Is |
|--------|------------|
| ⭐ **Rating** (1-5) | Uber-style rating. In this demo, it loosely correlates with security health but isn't a real formula. |
| 🌯 **Burrito Score** (0-100) | A joke metric. Higher = "healthier" container. Not a real thing. |
| 🎩 **Hat** | Just Linky having fun. Zero security value. |

### Real-World Priority Order

If you're an SRE deciding what to fix first:

1. **Unsigned + Critical CVEs** → 🚨 Stop everything, fix now
2. **Signed + Critical CVEs** → 🔴 High priority, patch ASAP
3. **Unsigned + No CVEs** → ⚠️ Why isn't this signed? Investigate.
4. **Signed + High CVEs** → 🟠 Schedule fix this sprint
5. **Signed + Medium/Low CVEs** → 🟡🟢 Backlog, fix when updating

**Signature matters a lot** — an unsigned image with zero CVEs is still suspicious because you can't verify its origin. A signed image with a few low CVEs from a trusted source (like Chainguard) is often safer than an unsigned "clean" image from Docker Hub.

---

### Why Chainguard Images? 🐙

Chainguard images (like `cgr.dev/chainguard/node`) are built to have:
- **Fewer packages** = fewer things that can have vulnerabilities
- **Daily rebuilds** = patches applied quickly
- **Signatures** = you know exactly where they came from

This dashboard shows you all of this at a glance using emojis!

---

## 🛡️ Security Features

This application was built with security as a priority (30% of judging criteria!):

- ✅ **Chainguard Containers** - Using `cgr.dev/chainguard/node` for minimal attack surface
- ✅ **Multi-stage Build** - Development dependencies not in production image
- ✅ **Non-root User** - Container runs as unprivileged user
- ✅ **TLS/HTTPS Support** - Self-signed certificates for encrypted transport
- ✅ **CSP Headers** - Content Security Policy via Helmet.js
- ✅ **CORS Restrictions** - Controlled cross-origin access
- ✅ **Input Validation** - All API inputs validated
- ✅ **No Hardcoded Secrets** - Environment variables for configuration
- ✅ **Health Endpoints** - `/health` and `/ready` for orchestration
- ✅ **Structured Logging** - JSON logs with Pino (no sensitive data)
- ✅ **Graceful Shutdown** - Proper SIGTERM/SIGINT handling

---

## 📁 Project Structure

```
round_1/
├── Dockerfile              # Multi-stage Chainguard build
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite bundler config
├── tailwind.config.js      # Tailwind CSS config
├── index.html              # Entry HTML
├── src/
│   ├── server/
│   │   ├── index.ts        # Express server
│   │   ├── logger.ts       # Pino logger
│   │   ├── routes/
│   │   │   ├── health.ts   # Health/ready endpoints
│   │   │   └── containers.ts # Container API
│   │   └── data/
│   │       └── containers.ts # Mock container data
│   └── client/
│       ├── main.tsx        # React entry
│       ├── App.tsx         # Main component
│       ├── types.ts        # TypeScript types
│       ├── styles/
│       │   └── index.css   # Tailwind styles
│       └── components/
│           ├── Header.tsx
│           ├── StatsBar.tsx
│           ├── FilterBar.tsx
│           ├── ContainerGrid.tsx
│           ├── ContainerCard.tsx
│           ├── ContainerRow.tsx
│           ├── AddContainerCard.tsx
│           ├── ViewToggle.tsx
│           ├── VulnerabilityModal.tsx
│           └── LinkyMascot.tsx
└── public/                 # Static assets
```

---

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness probe (🟢 status) |
| `/ready` | GET | Readiness probe (✅/❌) |
| `/metrics` | GET | Basic metrics (📊) |
| `/api/containers` | GET | List all containers |
| `/api/containers` | DELETE | Erase all containers (reset) |
| `/api/containers/:id` | GET | Get container by ID |
| `/api/containers/:id` | DELETE | Delete specific container |
| `/api/containers/filter/:severity` | GET | Filter by severity |
| `/api/containers/stats/summary` | GET | Get summary stats |
| `/api/containers/scan` | POST | Scan a new container image |

---

## 🌯 Easter Eggs

- 🎩 **Hat Picker** - Click on Linky to change his hat!
- 🌯 **Burrito Score** - Each container has a "burrito health score" (0-100)
- ⭐ **Uber Ratings** - Containers are rated 1-5 stars
- 🐙 **Linky Animation** - Watch Linky's tentacles wave!
- ✏️ **Pink Eraser** - Delete buttons styled like old-school pencil erasers

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
| Styling | TailwindCSS |
| Backend | Express.js |
| Logging | Pino |
| Security | Helmet.js |

---

## 📝 License

MIT

---

## 🐙💜🛡️

*Built with love for Vibelympics 2025*
