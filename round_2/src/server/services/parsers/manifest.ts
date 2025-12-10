/**
 * Manifest file parsers for dependency extraction
 * 
 * Supports:
 * - requirements.txt (Python/PyPI)
 * - package.json (Node/npm)
 * - go.mod (Go)
 * - Gemfile (Ruby)
 * - pom.xml (Maven) - basic support
 */

export interface ParsedDependency {
  name: string;
  version?: string;
  isDev?: boolean;
}

export interface ParsedManifest {
  ecosystem: 'pypi' | 'npm' | 'maven' | 'go' | 'rubygems';
  dependencies: ParsedDependency[];
  fileName: string;
}

/**
 * Detect ecosystem from filename
 */
export function detectEcosystem(fileName: string): ParsedManifest['ecosystem'] | null {
  const name = fileName.toLowerCase();
  
  if (name === 'requirements.txt' || name.endsWith('.txt') && name.includes('requirements')) {
    return 'pypi';
  }
  if (name === 'package.json' || name === 'package-lock.json') {
    return 'npm';
  }
  if (name === 'go.mod' || name === 'go.sum') {
    return 'go';
  }
  if (name === 'gemfile' || name === 'gemfile.lock') {
    return 'rubygems';
  }
  if (name === 'pom.xml') {
    return 'maven';
  }
  
  return null;
}

/**
 * Parse a manifest file and extract dependencies
 */
export function parseManifest(content: string, fileName: string): ParsedManifest {
  const ecosystem = detectEcosystem(fileName);
  
  if (!ecosystem) {
    throw new Error(`Unsupported manifest file: ${fileName}`);
  }
  
  let dependencies: ParsedDependency[];
  
  switch (ecosystem) {
    case 'pypi':
      dependencies = parseRequirementsTxt(content);
      break;
    case 'npm':
      dependencies = parsePackageJson(content);
      break;
    case 'go':
      dependencies = parseGoMod(content);
      break;
    case 'rubygems':
      dependencies = parseGemfile(content);
      break;
    case 'maven':
      dependencies = parsePomXml(content);
      break;
    default:
      throw new Error(`Parser not implemented for: ${ecosystem}`);
  }
  
  return {
    ecosystem,
    dependencies,
    fileName,
  };
}

/**
 * Parse Python requirements.txt
 * Formats:
 *   package==1.0.0
 *   package>=1.0.0
 *   package~=1.0.0
 *   package
 *   -e git+https://...#egg=package
 */
function parseRequirementsTxt(content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Skip options like -r, -e, --index-url, etc.
    if (trimmed.startsWith('-')) {
      // Handle editable installs: -e git+...#egg=name
      const eggMatch = trimmed.match(/#egg=([a-zA-Z0-9_-]+)/);
      if (eggMatch) {
        deps.push({ name: eggMatch[1] });
      }
      continue;
    }
    
    // Parse package specification
    // Matches: package, package==1.0, package>=1.0, package[extra]==1.0
    const match = trimmed.match(/^([a-zA-Z0-9_-]+)(?:\[.*?\])?(?:([=<>~!]+)(.+))?/);
    if (match) {
      const [, name, , version] = match;
      deps.push({
        name: name.toLowerCase(),
        version: version?.trim(),
      });
    }
  }
  
  return deps;
}

/**
 * Parse Node.js package.json
 */
function parsePackageJson(content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  
  try {
    const pkg = JSON.parse(content);
    
    // Production dependencies
    if (pkg.dependencies) {
      for (const [name, version] of Object.entries(pkg.dependencies)) {
        deps.push({
          name,
          version: cleanNpmVersion(version as string),
          isDev: false,
        });
      }
    }
    
    // Dev dependencies
    if (pkg.devDependencies) {
      for (const [name, version] of Object.entries(pkg.devDependencies)) {
        deps.push({
          name,
          version: cleanNpmVersion(version as string),
          isDev: true,
        });
      }
    }
  } catch (e) {
    throw new Error('Invalid package.json format');
  }
  
  return deps;
}

/**
 * Clean npm version specifier (remove ^, ~, etc.)
 */
function cleanNpmVersion(version: string): string | undefined {
  if (!version) return undefined;
  
  // Handle special cases
  if (version === '*' || version === 'latest') return undefined;
  if (version.startsWith('git') || version.startsWith('http')) return undefined;
  if (version.startsWith('file:') || version.startsWith('link:')) return undefined;
  
  // Remove range specifiers
  return version.replace(/^[\^~>=<]+/, '').split(' ')[0];
}

/**
 * Parse Go go.mod file
 */
function parseGoMod(content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  const lines = content.split('\n');
  
  let inRequireBlock = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Track require block
    if (trimmed.startsWith('require (')) {
      inRequireBlock = true;
      continue;
    }
    if (trimmed === ')') {
      inRequireBlock = false;
      continue;
    }
    
    // Single-line require
    if (trimmed.startsWith('require ') && !trimmed.includes('(')) {
      const match = trimmed.match(/require\s+(\S+)\s+(\S+)/);
      if (match) {
        deps.push({ name: match[1], version: match[2] });
      }
      continue;
    }
    
    // Inside require block
    if (inRequireBlock && trimmed && !trimmed.startsWith('//')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        deps.push({
          name: parts[0],
          version: parts[1].replace(/\/\/.*$/, '').trim(),
        });
      }
    }
  }
  
  return deps;
}

/**
 * Parse Ruby Gemfile (basic support)
 */
function parseGemfile(content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Match gem declarations: gem 'name', '~> 1.0'
    const match = trimmed.match(/gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/);
    if (match) {
      deps.push({
        name: match[1],
        version: match[2]?.replace(/^[~>=<]+\s*/, ''),
      });
    }
  }
  
  return deps;
}

/**
 * Parse Maven pom.xml (basic support - no XML parser, regex-based)
 */
function parsePomXml(content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  
  // Simple regex to extract dependencies
  // This is basic and won't handle all cases, but works for simple pom.xml files
  const depRegex = /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>(?:\s*<version>([^<]+)<\/version>)?/g;
  
  let match;
  while ((match = depRegex.exec(content)) !== null) {
    const [, groupId, artifactId, version] = match;
    deps.push({
      name: `${groupId}:${artifactId}`,
      version: version || undefined,
    });
  }
  
  return deps;
}
