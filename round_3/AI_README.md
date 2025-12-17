# AI Development Guide - Meme Generator 3000

> **Purpose**: AI-powered meme generator for Vibelympics Round 3  
> **Repository**: https://github.com/ProvenGuilty/vibelympics/tree/main/round_3  
> **Status**: ✅ MVP Working - Ready for Polish  
> **Last Updated**: 2025-12-17

---

## 🚀 Current State (for AI Handoff)

**What's Working:**
- ✅ AI meme generation with DALL-E 3 + GPT-4o-mini captions
- ✅ Classic template memes (Drake, Distracted BF, This Is Fine, etc.)
- ✅ Cyberpunk theme with 31337 M0D3 easter egg (double-click Linky's hat)
- ✅ Security/DevOps humor mode
- ✅ Frontend on localhost:5173, Backend on localhost:8080
- ✅ Health endpoint at /health

**Known Issues / TODO:**
- [ ] Download button opens new tab (CORS workaround) - could proxy through backend
- [ ] Text overlay on classic templates is CSS-based, not baked into image
- [ ] No unit tests yet
- [ ] Linky mascot SVG needs to be created (currently placeholder)

**Quick Start for AI Agent:**
```bash
cd /home/cryan/CascadeProjects/vibelympics/round_3
npm run dev  # Starts both frontend (5173) and backend (8080)
```

**Key Files to Know:**
- `src/server/services/memeService.ts` - OpenAI integration, template definitions
- `src/client/components/MemeGenerator.tsx` - Main UI component
- `src/client/components/MemeGallery.tsx` - Displays generated memes
- `.env` - Contains OPENAI_API_KEY (already configured)

---

## Project Overview

An AI-powered meme generator that creates original, entertaining memes based on user input. Features both AI-generated images (DALL-E 3) and classic meme templates with AI-generated captions (GPT-4o-mini). Built with a cyberpunk aesthetic and Linky the octopus mascot.

### Key Features
- **AI Image Generation**: Create original meme images with DALL-E 3
- **Classic Templates**: Drake, Distracted BF, This Is Fine, etc. with AI captions
- **Security/DevOps Humor**: Specialized mode for CVE jokes, supply chain memes
- **Cyberpunk Theme**: Neon cyan/magenta aesthetic with 31337 M0D3 easter egg
- **One-Click Export**: Download or share generated memes

---

## Tech Stack

### Language & Runtime
| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Language** | TypeScript | Type safety, great DX |
| **Runtime** | Node.js 22 | Latest LTS, ES modules |

### Frameworks & Libraries
| Component | Choice | Purpose |
|-----------|--------|---------|
| **Frontend** | React 18 + Vite | Fast dev, modern tooling |
| **Styling** | TailwindCSS | Rapid UI development |
| **Backend** | Express.js | Simple, proven API server |
| **AI** | OpenAI (GPT-4o-mini + DALL-E 3) | Meme generation |

### Infrastructure
| Component | Details |
|-----------|---------|
| **Container** | Chainguard Node (distroless, CVE-free) |
| **Deployment** | Docker |
| **CI/CD** | GitHub Actions (optional) |

---

## Directory Structure

```
round_3/
├── src/
│   ├── client/                 # React Frontend
│   │   ├── App.tsx             # Main app component + state
│   │   ├── main.tsx            # Entry point
│   │   ├── components/
│   │   │   ├── Header.tsx      # App header with Linky
│   │   │   ├── MemeGenerator.tsx # Main generation UI (mode, topic, style)
│   │   │   ├── MemeGallery.tsx # Displays generated memes
│   │   │   └── Linky.tsx       # Mascot with easter egg
│   │   ├── context/
│   │   │   └── ThemeContext.tsx # Cyberpunk theme toggle
│   │   └── styles/
│   │       └── index.css       # Tailwind + neon effects
│   │
│   └── server/                 # Express Backend
│       ├── index.ts            # Server entry + middleware
│       ├── routes/
│       │   ├── health.ts       # Health check endpoint
│       │   └── meme.ts         # /api/meme/* endpoints
│       └── services/
│           └── memeService.ts  # OpenAI + template logic (KEY FILE)
│
├── .env                        # OPENAI_API_KEY (gitignored)
├── .env.example                # Template for .env
├── AI_README.md                # This file
├── TESTING.md                  # Testing methodology
├── SECURITY.md                 # Security guidelines
├── CHANGELOG.md                # Version history
├── Dockerfile                  # Chainguard container
└── package.json                # Dependencies
```

---

## Architecture

### Data Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Express   │────▶│   OpenAI    │
│   Frontend  │◀────│   Backend   │◀────│   API       │
│  :5173      │     │   :8080     │     │ GPT-4o-mini │
└─────────────┘     └─────────────┘     │ + DALL-E 3  │
                                        └─────────────┘
```

### Key Components

1. **MemeGenerator** (`src/client/components/MemeGenerator.tsx`)
   - Main UI for meme creation
   - Mode selection (AI-generated vs classic templates)
   - Style selection (general vs security/DevOps humor)
   - Quick topic buttons for common themes

2. **MemeService** (`src/server/services/memeService.ts`) ⭐ KEY FILE
   - `generateAIMeme()` - GPT-4o-mini captions + DALL-E 3 images
   - `generateTemplateMeme()` - GPT-4o-mini captions for classic templates
   - `TEMPLATES` object - Drake, Distracted BF, This Is Fine, etc.
   - Template images served from imgflip CDN

3. **ThemeContext** (`src/client/context/ThemeContext.tsx`)
   - Cyberpunk theme toggle (31337 M0D3)
   - Easter egg: double-click Linky's hat to toggle

---

## Development Workflow

### Getting Started

```bash
# Clone repository
git clone https://github.com/ProvenGuilty/vibelympics.git
cd vibelympics/round_3

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# Run development server
npm run dev

# Open http://localhost:5173
```

### Common Tasks

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Start prod | `npm start` |
| Docker build | `docker build -t meme-gen .` |

---

## Code Patterns & Conventions

### Naming Conventions
- **Files**: kebab-case for utilities, PascalCase for components
- **Functions**: camelCase
- **Components**: PascalCase
- **Constants**: SCREAMING_SNAKE_CASE

### Error Handling Pattern
```typescript
try {
  const result = await openai.generateMeme(prompt);
  return { success: true, data: result };
} catch (error) {
  logger.error('Meme generation failed', { error, prompt });
  return { success: false, error: 'Failed to generate meme' };
}
```

### Logging Pattern
```typescript
import { logger } from '../logger';

logger.info('Generating meme', { mode: 'ai', topic });
logger.error('OpenAI API error', { error: err.message });
```

---

## API Reference

### Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Health check |
| `/api/meme/generate` | POST | Generate AI meme |
| `/api/meme/template` | POST | Generate template meme |
| `/api/templates` | GET | List available templates |

### Generate AI Meme
```bash
curl -X POST http://localhost:8080/api/meme/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "CVEs in production", "style": "security"}'
```

### Generate Template Meme
```bash
curl -X POST http://localhost:8080/api/meme/template \
  -H "Content-Type: application/json" \
  -d '{"template": "drake", "topic": "fixing bugs"}'
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for GPT-4 and DALL-E |
| `PORT` | No | `8080` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `LOG_LEVEL` | No | `info` | Logging verbosity |

---

## Key Files for AI Assistance

| File | Purpose | When to Modify |
|------|---------|----------------|
| `src/server/services/memeService.ts` | AI integration + templates | Changing prompts, models, adding templates |
| `src/client/components/MemeGenerator.tsx` | Main UI | Adding features, changing UX |
| `src/client/components/MemeGallery.tsx` | Meme display | Download, sharing features |
| `src/server/index.ts` | Server config | CSP, CORS, middleware |
| `tailwind.config.js` | Theme colors | Styling changes |

---

## External Dependencies

| Service | Purpose | Documentation |
|---------|---------|---------------|
| OpenAI API | GPT-4 + DALL-E 3 | https://platform.openai.com/docs |
| Chainguard Images | Secure container base | https://images.chainguard.dev |

---

## Troubleshooting

### Common Issues

1. **OpenAI API errors**
   - Cause: Invalid API key or rate limiting
   - Solution: Check .env file, verify API key, check usage limits

2. **CORS errors on download**
   - Cause: OpenAI blob storage doesn't allow cross-origin fetch
   - Solution: Download opens in new tab (current workaround), or proxy through backend

3. **DALL-E content policy**
   - Cause: Prompt triggered content filter
   - Solution: Adjust prompt to be less edgy

4. **Classic template images 404**
   - Cause: Template URLs pointing to wrong location
   - Solution: Templates now use imgflip CDN URLs (already fixed)

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

---

## Contact & Support

- **Team**: ProvenGuilty
- **Members**: [@ProvenGuilty](https://github.com/ProvenGuilty), [@mrshaun13](https://github.com/mrshaun13)
- **Issues**: https://github.com/ProvenGuilty/vibelympics/issues
