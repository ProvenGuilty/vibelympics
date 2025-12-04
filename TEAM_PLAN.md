# 🐙 Vibelympics Round 1 - Team Plan

> **Project**: Linky's Container Security Dashboard  
> **Deadline**: December 4, 2025 @ 11:59 PM EST  
> **Team**: [@ProvenGuilty](https://github.com/ProvenGuilty), [@mrshaun13](https://github.com/mrshaun13)

---

## 📋 Quick Start for Contributors

```bash
# Prerequisites (Windows 11 + WSL Ubuntu 24.04)
# 1. Install Docker
sudo apt update && sudo apt install -y docker.io
sudo usermod -aG docker $USER
# Log out and back in for group changes

# 2. Verify gh CLI is installed
gh --version

# 3. Clone and enter repo
git clone git@github.com:ProvenGuilty/vibelympics.git
cd vibelympics/round_1

# 4. Build and run
docker build -t linky-security .
docker run -p 3000:3000 linky-security

# 5. Open http://localhost:3000
```

---

## 🎯 Project Concept

**Linky's Container Security Dashboard** - An emoji-only web dashboard where Linky the octopus 🐙 helps visualize container security status.

### Why This Concept?
- Directly references Chainguard's mascot (Linky) and products
- Security-focused = strong score on 30% Security criteria
- Unique (not on "dumb ideas" list)
- Visual appeal with clear emoji semantics

---

## 📊 Judging Criteria Strategy

| Category | Weight | Our Approach |
|----------|--------|--------------|
| **Security** | 30% | CSP headers, input sanitization, non-root container, no secrets, health endpoints, Sigstore references |
| **Functionality** | 30% | Interactive dashboard, filtering, mock vulnerability data, Easter eggs |
| **Code Quality** | 30% | TypeScript, clean architecture, proper error handling, structured logging, comprehensive README |
| **Vibes** | 10% | Linky 🐙, burrito bowls 🌯, hats 🎩, Uber ratings ⭐, fun animations |
| **Bonus** | +5 | Polish, creativity, Chainguard product references |

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

## ✨ Features

### Core Features (MVP)
- [ ] 🐙 Linky mascot header/guide
- [ ] 📦 Container list with emoji health indicators
- [ ] 🔴🟠🟡🟢 Vulnerability severity display
- [ ] ✅❌ Signature verification status (Sigstore nod)
- [ ] 📊 Summary stats with emoji counters

### Bonus Features (Time Permitting)
- [ ] 🎩 Hat selector for Linky (Easter egg)
- [ ] 🌯 "Burrito Health Score" metric
- [ ] ⭐ Uber-style 5-star ratings for containers
- [ ] 📜 SBOM summary visualization
- [ ] 🔍 Filter/search by severity
- [ ] 🎨 Theme toggle (light/dark with emoji indicators)

---

## 📁 Project Structure

```
round_1/
├── README.md              # Project instructions (replaces challenge README)
├── Dockerfile             # Multi-stage Chainguard build
├── package.json           # Node dependencies
├── tsconfig.json          # TypeScript config
├── tailwind.config.js     # Tailwind config
├── src/
│   ├── server/
│   │   ├── index.ts       # Express server entry
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Security middleware
│   │   └── data/          # Mock container data
│   └── client/
│       ├── index.html     # Entry HTML
│       ├── App.tsx        # Main React component
│       ├── components/    # UI components
│       └── styles/        # Tailwind styles
└── public/                # Static assets
```

---

## 👥 Task Assignments

### cryan (Primary)
- [x] Initial planning and strategy
- [ ] Project scaffolding
- [ ] Backend (Express + security middleware)
- [ ] Dockerfile setup
- [ ] Health endpoints and logging
- [ ] Documentation

### Shaun (Contributor)
- [ ] Frontend components (React)
- [ ] Emoji design/selection
- [ ] Animations and polish
- [ ] Testing
- [ ] (Assign as available)

### Unassigned / Pair Work
- [ ] Final integration testing
- [ ] README polish
- [ ] Git push and verification

---

## 🔧 Tech Stack

| Layer | Technology | Chainguard Image |
|-------|------------|------------------|
| Runtime | Node.js 20 | `cgr.dev/chainguard/node:latest` |
| Build | Node.js + npm | `cgr.dev/chainguard/node:latest-dev` |
| Frontend | React 18 + TypeScript + Vite | (bundled) |
| Styling | TailwindCSS | (bundled) |
| Backend | Express.js | (bundled) |

---

## 🛡️ Security Checklist

- [ ] CSP headers configured
- [ ] CORS restricted
- [ ] Input validation on all endpoints
- [ ] No hardcoded secrets
- [ ] Non-root container user
- [ ] Health/readiness endpoints
- [ ] Structured logging (no sensitive data)
- [ ] Multi-stage Docker build
- [ ] Minimal production image

---

## 📝 Emoji Reference Guide

### Navigation & Actions
| Emoji | Meaning |
|-------|---------|
| 🐙 | Linky (home/mascot) |
| 🔍 | Search/filter |
| ⚙️ | Settings |
| 🔄 | Refresh |
| ❌ | Close/cancel |

### Security Status
| Emoji | Meaning |
|-------|---------|
| 🛡️ | Security/protected |
| 🔒 | Locked/secure |
| 🔓 | Unlocked/vulnerable |
| ✅ | Verified/signed |
| ❌ | Unverified/failed |

### Severity Levels
| Emoji | Meaning |
|-------|---------|
| 🔴 | Critical |
| 🟠 | High |
| 🟡 | Medium |
| 🟢 | Low/None |
| ⚪ | Unknown |

### Metrics & Ratings
| Emoji | Meaning |
|-------|---------|
| ⭐ | Rating star |
| 📊 | Statistics |
| 📈 | Trending up |
| 📉 | Trending down |
| 🌯 | Burrito score (Easter egg) |

### Container & Package
| Emoji | Meaning |
|-------|---------|
| 📦 | Container/package |
| 🏷️ | Tag/version |
| 📜 | SBOM/manifest |
| 🐳 | Docker reference |

### Fun/Easter Eggs
| Emoji | Meaning |
|-------|---------|
| 🎩 | Hat (Linky accessory) |
| 🌯 | Burrito bowl |
| 🧢 | Cap |
| 👒 | Sun hat |

---

## 🚀 Deployment Checklist

1. [ ] All code in `round_1/` folder
2. [ ] `round_1/README.md` has build/run instructions
3. [ ] Dockerfile builds successfully
4. [ ] Container runs on port 3000
5. [ ] App accessible at http://localhost:3000
6. [ ] No text in UI (emoji only)
7. [ ] Repository is public
8. [ ] All changes pushed to main branch

---

## 📞 Communication

- **GitHub Repo**: https://github.com/ProvenGuilty/vibelympics
- **Branch**: main (direct push for speed)
- **Commits**: Frequent, descriptive messages

---

## ⏰ Timeline

| Time | Milestone |
|------|-----------|
| Dec 3, 4:30 PM | Planning complete, scaffolding started |
| Dec 3, 6:00 PM | MVP backend + basic frontend |
| Dec 3, 8:00 PM | Core features complete |
| Dec 4, 12:00 PM | Polish and bonus features |
| Dec 4, 6:00 PM | Final testing and documentation |
| Dec 4, 11:00 PM | Final push (1 hour buffer) |

---

## 📚 References

- [Chainguard Node Image](https://images.chainguard.dev/directory/image/node/overview)
- [Chainguard Containers Docs](https://edu.chainguard.dev/chainguard/chainguard-images/how-to-use/how-to-use-chainguard-images/)
- [Vibelympics Rules](https://vibelympics.splashthat.com/)
- [Contest GitHub Template](https://github.com/chainguard-demo/vibelympics)
