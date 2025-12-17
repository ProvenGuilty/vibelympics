# Testing Methodology - Meme Generator 3000

---

## Testing Philosophy

- **Automated Testing**: Unit and integration tests with Vitest
- **API Testing**: Verify endpoints and OpenAI integration
- **Component Testing**: React Testing Library for UI components
- **Manual Testing**: Visual verification and E2E flows

---

## Test Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner with native ESM support |
| **Supertest** | HTTP assertions for API routes |
| **React Testing Library** | Component testing |
| **@testing-library/jest-dom** | DOM matchers |

---

## Running Tests

| Task | Command |
|------|---------|
| Run all tests | `npm test` |
| Watch mode | `npm run test:watch` |
| Coverage report | `npm run test:coverage` |
| Dev server | `npm run dev` |
| Build check | `npm run build` |
| Type check | `npx tsc --noEmit` |

---

## Test Structure

```
src/
├── server/
│   ├── routes/
│   │   ├── health.test.ts      # Health endpoint tests
│   │   └── meme.test.ts        # Meme API tests (mocked OpenAI)
│   └── services/
│       └── memeService.test.ts # Template & service unit tests
├── client/
│   ├── components/
│   │   ├── Header.test.tsx     # Header component tests
│   │   └── Linky.test.tsx      # Linky mascot tests
│   └── context/
│       └── ThemeContext.test.tsx # Theme toggle tests
└── test/
    └── setup.ts                # Test setup (jest-dom matchers)
```

---

## Test Coverage

### Server Tests (16 tests)

**memeService.test.ts** (7 tests)
- Template structure validation
- Template properties (name, description, url, textAreas)
- `getTemplates()` returns correct format

**health.test.ts** (4 tests)
- Returns status ok
- Returns timestamp
- Returns service name
- Returns JSON content type

**meme.test.ts** (12 tests)
- GET /api/meme/templates returns list
- POST /api/meme/generate validation (missing topic, invalid type, length)
- POST /api/meme/generate success with mocked OpenAI
- POST /api/meme/template validation
- POST /api/meme/template success
- Error handling (500 responses)
- Rate limiting behavior

### Client Tests (14 tests)

**Header.test.tsx** (6 tests)
- Renders header element
- Displays app title
- Shows subtitle
- GitHub link with correct attributes
- Renders Linky component
- Shows 31337 M0D3 in cyberpunk mode

**Linky.test.tsx** (4 tests)
- Renders octopus emoji
- Renders hat emoji
- Has double-click hint
- Theme toggle on double-click

**ThemeContext.test.tsx** (4 tests)
- Default theme is cyberpunk
- Toggle switches to default
- Toggle back to cyberpunk
- Throws error outside provider

---

## Manual API Tests

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

---

## UI Smoke Tests

- [ ] Page loads without errors
- [ ] Can enter topic and generate meme
- [ ] Can select template and generate
- [ ] Generated meme displays correctly
- [ ] Download button works
- [ ] 31337 M0D3 easter egg works (double-click Linky's hat)

---

## Error Handling Tests

- [ ] Invalid API key shows helpful error
- [ ] Rate limiting works (10 req/min)
- [ ] Empty prompt shows validation error
- [ ] Network error shows retry option

---

## Pre-Demo Checklist

- [ ] `npm test` passes (37 tests)
- [ ] `.env` has valid OPENAI_API_KEY
- [ ] `npm run build` succeeds
- [ ] Docker build works
- [ ] Can generate AI meme
- [ ] Can generate template meme
- [ ] UI looks good (cyberpunk theme)
- [ ] No console errors
- [ ] Linky animates correctly

---

## Adding New Tests

### Server Route Test Example

```typescript
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import myRoutes from './myRoutes.js';

describe('My Routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/my', myRoutes);

  it('should return expected data', async () => {
    const response = await request(app).get('/api/my/endpoint');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

### React Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';
import { ThemeProvider } from '../context/ThemeContext';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(
      <ThemeProvider>
        <MyComponent />
      </ThemeProvider>
    );
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-17 | Initial testing methodology |
| 2.0.0 | 2024-12-17 | Added Vitest automated testing infrastructure |
