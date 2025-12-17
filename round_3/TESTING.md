# Testing Methodology - Meme Generator 3000

---

## Testing Philosophy

- **Manual Testing First**: Given tight deadline, focus on manual verification
- **API Testing**: Verify OpenAI integration works correctly
- **Visual Testing**: Ensure memes render properly

---

## Test Types

### 1. Manual API Tests

```bash
# Health check
curl http://localhost:8080/health

# Generate AI meme
curl -X POST http://localhost:8080/api/meme/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "CVEs", "style": "security"}'

# Generate template meme
curl -X POST http://localhost:8080/api/meme/template \
  -H "Content-Type: application/json" \
  -d '{"template": "drake", "topic": "fixing bugs"}'

# List templates
curl http://localhost:8080/api/templates
```

### 2. UI Smoke Tests

- [ ] Page loads without errors
- [ ] Can enter topic and generate meme
- [ ] Can select template and generate
- [ ] Generated meme displays correctly
- [ ] Download button works
- [ ] 31337 M0D3 easter egg works (double-click Linky's hat)

### 3. Error Handling Tests

- [ ] Invalid API key shows helpful error
- [ ] Rate limiting works (10 req/min)
- [ ] Empty prompt shows validation error
- [ ] Network error shows retry option

---

## Running Tests

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build check | `npm run build` |
| Type check | `npx tsc --noEmit` |

---

## Pre-Demo Checklist

- [ ] `.env` has valid OPENAI_API_KEY
- [ ] `npm run build` succeeds
- [ ] Docker build works
- [ ] Can generate AI meme
- [ ] Can generate template meme
- [ ] UI looks good (cyberpunk theme)
- [ ] No console errors
- [ ] Linky animates correctly

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-17 | Initial testing methodology |
