# AI Development Guide - Meme Generator 3000

> **Purpose**: AI-powered meme generator for Vibelympics Round 3  
> **Repository**: https://github.com/ProvenGuilty/vibelympics/tree/main/round_3  
> **Status**: In Development

---

## Project Overview

An AI-powered meme generator that creates original, entertaining memes based on user input. Features both AI-generated images (DALL-E 3) and classic meme templates with AI-generated captions (GPT-4). Built with a cyberpunk aesthetic and Linky the octopus mascot.

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
| **AI** | OpenAI (GPT-4 + DALL-E 3) | Meme generation |
| **Image Processing** | node-canvas | Text overlay on templates |

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
│   │   ├── App.tsx             # Main app component
│   │   ├── main.tsx            # Entry point
│   │   ├── components/
│   │   │   ├── Header.tsx      # App header with Linky
│   │   │   ├── MemeGenerator.tsx # Main generation UI
│   │   │   ├── MemeGallery.tsx # Generated memes display
│   │   │   ├── TemplateSelector.tsx # Classic template picker
│   │   │   └── Linky.tsx       # Animated mascot
│   │   ├── context/
│   │   │   └── ThemeContext.tsx # Cyberpunk theme toggle
│   │   └── styles/
│   │       └── index.css       # Tailwind + custom styles
│   │
│   └── server/                 # Express Backend
│       ├── index.ts            # Server entry
│       ├── routes/
│       │   ├── health.ts       # Health check
│       │   └── meme.ts         # Meme generation API
│       └── services/
│           ├── openai.ts       # OpenAI client wrapper
│           ├── templates.ts    # Classic meme templates
│           └── imageGen.ts     # Image generation logic
│
├── public/
│   ├── templates/              # Classic meme template images
│   └── linky.svg               # Mascot logo
│
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
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       └───────────▶│  node-canvas│ (template overlay)
                    └─────────────┘
```

### Key Components

1. **MemeGenerator** (`src/client/components/MemeGenerator.tsx`)
   - Main UI for meme creation
   - Mode selection (AI-generated vs templates)
   - Topic/prompt input

2. **OpenAI Service** (`src/server/services/openai.ts`)
   - GPT-4 for caption generation
   - DALL-E 3 for image generation
   - Prompt engineering for humor

3. **Template Service** (`src/server/services/templates.ts`)
   - Classic meme template definitions
   - Text positioning coordinates
   - node-canvas rendering

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
| `src/server/services/openai.ts` | AI integration | Changing prompts, models |
| `src/client/components/MemeGenerator.tsx` | Main UI | Adding features |
| `src/server/services/templates.ts` | Template definitions | Adding new templates |
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

2. **Canvas build fails**
   - Cause: Missing system dependencies
   - Solution: Install cairo, pango (see node-canvas docs)

3. **DALL-E content policy**
   - Cause: Prompt triggered content filter
   - Solution: Adjust prompt to be less edgy

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

---

## Contact & Support

- **Team**: ProvenGuilty
- **Members**: [@ProvenGuilty](https://github.com/ProvenGuilty), [@mrshaun13](https://github.com/mrshaun13)
- **Issues**: https://github.com/ProvenGuilty/vibelympics/issues
