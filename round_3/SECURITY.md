# Security Guidelines - Meme Generator 3000

> **Source**: Adapted from [Project CodeGuard](https://github.com/project-codeguard/rules)

---

## Core Principles

1. **Secure by Default**: OpenAI API key never exposed to client
2. **Least Privilege**: Only request necessary API permissions
3. **Defense in Depth**: Rate limiting + content filtering + input validation
4. **Fail Securely**: Errors don't expose API keys or system info

---

## Secrets Management

### ✅ Implementation
- OpenAI API key stored in `.env` (gitignored)
- Server-side only API calls (never expose key to browser)
- `.env.example` provided with placeholder values

### .gitignore entries
```gitignore
.env
.env.local
.env.*.local
```

---

## Input Validation

### User Prompts
- Maximum length: 500 characters
- Sanitize before sending to OpenAI
- OpenAI's built-in content moderation handles inappropriate content

### API Requests
- Validate Content-Type headers
- Rate limit: 10 requests/minute per IP
- Request size limit: 1MB

---

## API Security

### Implemented
- [x] HTTPS in production (Chainguard container)
- [x] CORS restricted to allowed origins
- [x] Helmet.js security headers
- [x] No internal IDs exposed (use UUIDs)
- [x] Rate limiting on generation endpoints

### Content Moderation
- OpenAI API has built-in content filters
- Additional keyword blocklist for edge cases
- Log flagged content for review

---

## Dependency Security

### Container
- Chainguard Node base image (zero CVEs)
- Multi-stage build (no dev deps in prod)
- Non-root user

### npm
- `npm audit` clean
- Lockfile for reproducible builds

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-17 | Initial security guidelines |
