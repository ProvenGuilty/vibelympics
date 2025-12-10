# Test Manifests

Sample manifest files with **known vulnerable packages** for testing The Weakest Lynx.

## Files

| File | Ecosystem | Packages | Expected Vulns |
|------|-----------|----------|----------------|
| `package.json` | npm | 10 | ~41 vulnerabilities |
| `requirements.txt` | PyPI | 10 | varies |

## Usage

### Web UI

1. Start the server: `npm run start`
2. Open http://localhost:8080
3. Click "Upload File" tab
4. Drag & drop one of these files (or click to browse)
5. Watch the real-time scan progress
6. View results sorted by vulnerability count

### CLI

```bash
# Tree view (visual)
npm run lynx -- file test-manifests/package.json -o tree

# JSON output
npm run lynx -- file test-manifests/package.json -o json

# SARIF (GitHub Security format)
npm run lynx -- file test-manifests/package.json -o sarif > report.sarif

# Markdown report
npm run lynx -- file test-manifests/package.json -o markdown > report.md

# Python packages
npm run lynx -- file test-manifests/requirements.txt -o tree
```

## Expected Results

### package.json (npm)

```
Score: ~47/100
Total: ~41 vulnerabilities

Top vulnerable packages:
- handlebars@4.0.0 - 10 vulns
- axios@0.18.0 - 6 vulns
- marked@0.3.5 - 6 vulns
- jquery@2.2.4 - 4 vulns
- lodash@4.17.11 - 4 vulns
```

### requirements.txt (PyPI)

Results vary based on OSV database updates. These older versions
of popular Python packages typically have known vulnerabilities.

## Adding More Test Files

You can add any supported manifest file:
- `package.json` (npm)
- `requirements.txt` (PyPI)
- `go.mod` (Go)
- `Gemfile` (RubyGems)
- `pom.xml` (Maven)
