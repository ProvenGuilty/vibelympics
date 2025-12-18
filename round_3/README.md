# 🐙 Meme Generator 3000

> AI-powered meme generator for Vibelympics Round 3

```
🐙 + 🤖 = 😂
   Your memes, powered by AI
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and build
git clone https://github.com/ProvenGuilty/vibelympics.git
cd vibelympics/round_3
docker build -t meme-gen-3000 .

# Run (users provide their own keys via browser UI)
docker run -p 8080:8080 meme-gen-3000

# Or run with a shared fallback API key
docker run -p 8080:8080 -e OPENAI_API_KEY=sk-your-key meme-gen-3000

# Open http://localhost:8080
```

> **Note:** Users can configure their own API keys via the 🔑 button in the header. Keys are stored in the browser's localStorage and can be set separately for text (GPT) and image (DALL-E) generation.

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/ProvenGuilty/vibelympics.git
cd vibelympics/round_3

# Install dependencies
npm install

# (Optional) Set up environment for shared fallback key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start development server
npm run dev

# Open http://localhost:5173
```

> **Tip:** Even without a `.env` file, users can provide their own API keys via the browser UI.

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Image Generation** | Create original meme images with DALL-E 3 |
| 📋 **Classic Templates** | Drake, Distracted BF, This Is Fine, and more |
| 🔐 **Security Humor Mode** | CVE jokes, container memes, DevOps humor |
| ⚡ **Quick Topics** | One-click topic suggestions |
| 🎨 **Cyberpunk Theme** | Neon aesthetic with 31337 M0D3 easter egg |
| ⬇️ **Download & Share** | Save memes locally or copy URL |
| 🔑 **Flexible API Keys** | Set separate keys for text and image generation |

---

## 🎨 Meme Creation

### AI Generated
Uses DALL-E 3 to create completely original meme images with GPT-4 generated captions.

### Classic Templates
Choose from iconic meme formats:
- 🎵 **Drake Approves** - The classic approve/disapprove
- 👀 **Distracted Boyfriend** - Looking at the new shiny thing
- 🔥 **This Is Fine** - Everything is fine (it's not)
- 🧠 **Expanding Brain** - Galaxy brain takes
- ☕ **Change My Mind** - Hot takes only
- 😰 **Two Buttons** - Impossible choices

---

## 🔐 Security/DevOps Humor

Built-in topics for the security crowd:
- CVEs in production
- Docker image sizes
- Kubernetes YAML complexity
- npm audit warnings
- Friday deployments
- Legacy code maintenance
- AI coding assistants

---

## 🛡️ Security

- **Chainguard Container** - Zero CVE base image
- **No Secrets in Code** - API key via environment variable
- **Rate Limiting** - 10 requests/minute per IP
- **Content Moderation** - OpenAI's built-in filters

---

## 📁 Project Structure

```
round_3/
├── src/
│   ├── client/          # React frontend
│   │   ├── components/  # UI components
│   │   └── context/     # Theme context
│   └── server/          # Express backend
│       ├── routes/      # API endpoints
│       └── services/    # OpenAI integration
├── public/              # Static assets
├── Dockerfile           # Chainguard container
└── package.json
```

---

## ⚙️ Configuration

### Environment Variables (Server-side)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | Generic fallback key (used for both text and image if specific keys not set) |
| `OPENAI_TEXT_API_KEY` | No | Key for text/caption generation only (GPT-4o-mini) |
| `OPENAI_IMAGE_API_KEY` | No | Key for image generation only (DALL-E 3) |
| `PORT` | No | Server port (default: 8080) |

**Key Priority (highest to lowest):**
1. User-provided key via browser UI
2. Specific env var (`OPENAI_TEXT_API_KEY` or `OPENAI_IMAGE_API_KEY`)
3. Generic env var (`OPENAI_API_KEY`)

**Example configurations:**

```bash
# Provide both text and image via single key
docker run -p 8080:8080 -e OPENAI_API_KEY=sk-xxx meme-gen-3000

# Provide only text generation - users must supply their own image key
docker run -p 8080:8080 -e OPENAI_TEXT_API_KEY=sk-xxx meme-gen-3000

# Provide separate keys for text and image
docker run -p 8080:8080 \
  -e OPENAI_TEXT_API_KEY=sk-text-xxx \
  -e OPENAI_IMAGE_API_KEY=sk-image-xxx \
  meme-gen-3000
```

### Browser API Key Settings

Click the 🔑 button in the header to configure your own API keys:

| Option | Description |
|--------|-------------|
| **Both** | Set the same key for text and image generation |
| **Text** | Key for GPT-4o-mini caption generation only |
| **Image** | Key for DALL-E 3 image generation only |

> **Why separate keys?** You might want to use different API keys with different rate limits or billing accounts for text vs image generation. Or use a cheaper model for captions while keeping DALL-E on a separate budget.

Keys are stored in your browser's `localStorage` and sent directly to OpenAI.

---

## 👥 Team

**Team ProvenGuilty**
- [@ProvenGuilty](https://github.com/ProvenGuilty)
- [@mrshaun13](https://github.com/mrshaun13)

---

## 📜 Tech Stack

| Component | Technology |
|-----------|------------|
| Container | Chainguard Node |
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Express.js + TypeScript |
| AI | OpenAI GPT-4 + DALL-E 3 |

---

*Built for Vibelympics 2025 Round 3* 🐙✨
