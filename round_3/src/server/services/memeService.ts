import OpenAI from 'openai';

// Lazy initialization to avoid crash on startup without API key
let openai: OpenAI | null = null;
let currentApiKey: string | null = null;

// Custom error class for API key issues
export class ApiKeyError extends Error {
  code: string;
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
    this.code = 'API_KEY_REQUIRED';
  }
}

function getOpenAI(userApiKey?: string): OpenAI {
  const apiKey = userApiKey || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new ApiKeyError('OpenAI API key is required. Please provide your API key to generate memes.');
  }
  
  // If user provided a key or key changed, create new instance
  if (userApiKey || apiKey !== currentApiKey) {
    currentApiKey = apiKey;
    openai = new OpenAI({ apiKey });
  }
  
  if (!openai) {
    openai = new OpenAI({ apiKey });
    currentApiKey = apiKey;
  }
  
  return openai;
}

// Meme templates with text positioning - using imgflip template IDs
export const TEMPLATES = {
  drake: {
    name: 'Drake Approves',
    description: 'Drake disapproving then approving',
    url: 'https://i.imgflip.com/30b1gx.jpg',
    textAreas: [
      { position: 'top-right', label: 'Bad thing' },
      { position: 'bottom-right', label: 'Good thing' }
    ]
  },
  distracted: {
    name: 'Distracted Boyfriend',
    description: 'Guy looking at another girl while girlfriend watches',
    url: 'https://i.imgflip.com/1ur9b0.jpg',
    textAreas: [
      { position: 'left', label: 'Current thing' },
      { position: 'center', label: 'You' },
      { position: 'right', label: 'New shiny thing' }
    ]
  },
  thisisfine: {
    name: 'This Is Fine',
    description: 'Dog in burning room saying this is fine',
    url: 'https://i.imgflip.com/wxica.jpg',
    textAreas: [
      { position: 'top', label: 'Situation' },
      { position: 'bottom', label: 'Response' }
    ]
  },
  expandingbrain: {
    name: 'Expanding Brain',
    description: 'Brain getting bigger with each panel',
    url: 'https://i.imgflip.com/1jwhww.jpg',
    textAreas: [
      { position: '1', label: 'Basic' },
      { position: '2', label: 'Better' },
      { position: '3', label: 'Advanced' },
      { position: '4', label: 'Galaxy brain' }
    ]
  },
  changemymind: {
    name: 'Change My Mind',
    description: 'Steven Crowder at table with sign',
    url: 'https://i.imgflip.com/24y43o.jpg',
    textAreas: [
      { position: 'sign', label: 'Hot take' }
    ]
  },
  twobuttons: {
    name: 'Two Buttons',
    description: 'Sweating guy choosing between two buttons',
    url: 'https://i.imgflip.com/1g8my4.jpg',
    textAreas: [
      { position: 'left-button', label: 'Option A' },
      { position: 'right-button', label: 'Option B' }
    ]
  }
};

// Humor style instructions for GPT captions
const HUMOR_STYLE_INSTRUCTIONS: Record<string, string> = {
  security: 'DevOps/security humor, references to CVEs, containers, Kubernetes, CI/CD. Make jokes developers and SREs would appreciate.',
  general: 'General internet humor, relatable everyday situations, classic meme energy.',
  sarcastic: 'Dry, ironic humor with deadpan delivery. Use phrases like "Oh great", "Wow, shocking", "Who could have predicted this". Heavy on the eye-roll energy.',
  roast: 'Playful roasting and calling things out. Be savage but funny, not mean-spirited. Roast the subject like a comedy central roast.',
  'self-deprecating': 'Self-deprecating humor where the speaker is the butt of the joke. "Me pretending I know what Im doing", "My life choices", relatable failure energy.'
};

// Image style instructions for DALL-E (only non-general styles modify the image)
const IMAGE_STYLE_INSTRUCTIONS: Record<string, string> = {
  security: 'Include visual elements like computer screens, server racks, code, terminals, or tech office settings.',
  sarcastic: 'Characters should have deadpan, unimpressed, or eye-rolling expressions. Flat affect, raised eyebrows, side-eye looks.',
  roast: 'Exaggerated shocked or burned expressions, dramatic reactions, someone looking roasted or called out.',
  'self-deprecating': 'Show a relatable failure moment, someone looking defeated, embarrassed, or in an awkward situation they caused themselves.'
};

// Security/DevOps themed prompts
const SECURITY_THEMES = [
  'CVEs in production',
  'supply chain attacks',
  'container security',
  'zero-day vulnerabilities',
  'npm audit warnings',
  'Docker image sizes',
  'Kubernetes complexity',
  'YAML indentation',
  'merge conflicts',
  'production deployments on Friday',
  'technical debt',
  'legacy code',
  'microservices',
  'serverless cold starts'
];

export async function generateAIMeme(topic: string, style: string = 'general', userApiKey?: string) {
  // Enhance topic for security style
  let enhancedTopic = topic;
  if (style === 'security') {
    const randomTheme = SECURITY_THEMES[Math.floor(Math.random() * SECURITY_THEMES.length)];
    enhancedTopic = `${topic} (in the context of ${randomTheme})`;
  }

  // Generate caption with GPT-4o-mini
  const captionResponse = await getOpenAI(userApiKey).chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a meme caption generator. Create short, punchy, funny meme text.
        Style: ${HUMOR_STYLE_INSTRUCTIONS[style] || HUMOR_STYLE_INSTRUCTIONS.general}
        Rules:
        - Keep it under 100 characters total
        - Be clever and witty
        - Use internet meme language appropriately
        - Match the humor style specified above
        - Return JSON with "topText" and "bottomText" fields`
      },
      {
        role: 'user',
        content: `Create meme text about: ${enhancedTopic}`
      }
    ],
    response_format: { type: 'json_object' }
  });

  const captionData = JSON.parse(captionResponse.choices[0].message.content || '{}');

  // Generate image with DALL-E 3
  const imageStyleAddition = IMAGE_STYLE_INSTRUCTIONS[style] || '';
  const imagePrompt = `A funny meme image about ${enhancedTopic}. 
    Style: colorful, exaggerated expressions, meme-worthy, internet humor aesthetic.
    ${imageStyleAddition}
    Do NOT include any text in the image - just the visual scene.
    Make it suitable for a professional audience but still funny.`;

  const imageResponse = await getOpenAI(userApiKey).images.generate({
    model: 'dall-e-3',
    prompt: imagePrompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard'
  });

  return {
    imageUrl: imageResponse.data?.[0]?.url || '',
    topText: captionData.topText || '',
    bottomText: captionData.bottomText || '',
    style,
    type: 'ai-generated'
  };
}

export async function generateTemplateMeme(templateId: string, topic: string, style: string = 'general', userApiKey?: string) {
  const template = TEMPLATES[templateId as keyof typeof TEMPLATES];
  
  if (!template) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  // Enhance topic for security style
  let enhancedTopic = topic;
  if (style === 'security') {
    const randomTheme = SECURITY_THEMES[Math.floor(Math.random() * SECURITY_THEMES.length)];
    enhancedTopic = `${topic} (in the context of ${randomTheme})`;
  }

  // Generate captions for each text area
  const textAreasDescription = template.textAreas
    .map(area => `"${area.label}"`)
    .join(', ');

  // Template-specific instructions
  let templateInstructions = '';
  if (templateId === 'changemymind') {
    templateInstructions = `
        - IMPORTANT: Do NOT include "Change my mind" in the text - the image already has that phrase on it
        - Just write the controversial opinion/hot take that goes on the sign above "Change my mind"`;
  }

  const styleInstruction = HUMOR_STYLE_INSTRUCTIONS[style] || HUMOR_STYLE_INSTRUCTIONS.general;

  const captionResponse = await getOpenAI(userApiKey).chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a meme caption generator for the "${template.name}" meme format.
        This meme has these text areas: ${textAreasDescription}
        Style: ${styleInstruction}
        
        Rules:
        - Each text should be short (under 50 chars)
        - Be clever and match the meme format's typical humor
        - Return JSON with keys matching the text area labels${templateInstructions}`
      },
      {
        role: 'user',
        content: `Create meme text about: ${enhancedTopic}`
      }
    ],
    response_format: { type: 'json_object' }
  });

  const captions = JSON.parse(captionResponse.choices[0].message.content || '{}');

  return {
    templateId,
    templateUrl: template.url,
    templateName: template.name,
    captions,
    type: 'template'
  };
}

export function getTemplates() {
  return Object.entries(TEMPLATES).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description,
    url: template.url,
    textAreas: template.textAreas
  }));
}
