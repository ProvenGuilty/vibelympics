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

# Run (with shared API key)
docker run -p 8080:8080 -e OPENAI_API_KEY=sk-your-key meme-gen-3000

# Or run without a key - users will be prompted to enter their own
docker run -p 8080:8080 meme-gen-3000

# Open http://localhost:8080
```

> **Note:** If no `OPENAI_API_KEY` is provided, users will be prompted to enter their own API key in the browser. Keys are stored in the browser's localStorage for the session.

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/ProvenGuilty/vibelympics.git
cd vibelympics/round_3

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start development server
npm run dev

# Open http://localhost:5173
```

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

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4 and DALL-E 3 |
| `PORT` | No | Server port (default: 8080) |

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
