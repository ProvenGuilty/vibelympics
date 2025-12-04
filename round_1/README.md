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
| `/api/containers/:id` | GET | Get container by ID |
| `/api/containers/filter/:severity` | GET | Filter by severity |
| `/api/containers/stats/summary` | GET | Get summary stats |

---

## 🌯 Easter Eggs

- 🎩 **Hat Picker** - Click on Linky to change his hat!
- 🌯 **Burrito Score** - Each container has a "burrito health score" (0-100)
- ⭐ **Uber Ratings** - Containers are rated 1-5 stars
- 🐙 **Linky Animation** - Watch Linky's tentacles wave!

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
