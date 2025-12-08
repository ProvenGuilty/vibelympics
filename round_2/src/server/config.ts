import { Config } from './types.js';

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

export const config: Config = {
  port: parseInt(process.env.PORT || '8080'),
  logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info',
  
  enablePypi: parseBoolean(process.env.ENABLE_PYPI, true),
  enableNpm: parseBoolean(process.env.ENABLE_NPM, true),
  enableMaven: parseBoolean(process.env.ENABLE_MAVEN, true),
  enableGo: parseBoolean(process.env.ENABLE_GO, true),
  enableRubygems: parseBoolean(process.env.ENABLE_RUBYGEMS, true),
  enableContainers: parseBoolean(process.env.ENABLE_CONTAINERS, true),
  
  enableAi: parseBoolean(process.env.ENABLE_AI, false),
  aiProvider: (process.env.AI_PROVIDER as Config['aiProvider']) || 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  
  githubToken: process.env.GITHUB_TOKEN,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
};

export function updateConfig(updates: Partial<Config>): void {
  Object.assign(config, updates);
}
