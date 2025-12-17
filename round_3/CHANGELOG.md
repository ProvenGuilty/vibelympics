# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Initial project scaffold with Vite + React + Express
- AI meme generation with DALL-E 3 + GPT-4o-mini captions
- Classic meme templates (Drake, Distracted BF, This Is Fine, Expanding Brain, Change My Mind, Two Buttons)
- Cyberpunk theme with 31337 M0D3 easter egg (double-click Linky's hat)
- Security/DevOps humor mode with themed prompts
- Linky mascot component
- Chainguard Dockerfile

### Fixed
- Switched from GPT-4 to GPT-4o-mini (JSON response format support)
- Added dotenv for .env file loading
- Classic template images now use imgflip CDN URLs
- Download button opens new tab (CORS workaround for OpenAI blob storage)
- Added imgflip.com to CSP img-src directive

---

## [1.0.0] - 2025-12-18

### Added
- Initial release for Vibelympics Round 3
- AI-powered meme generation
- Classic template support (Drake, Distracted BF, This Is Fine, etc.)
- Security/DevOps humor mode
- Download/share functionality
