import OpenAI from 'openai';

// Lazy initialization to avoid crash on startup without API key
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

// Meme templates with text positioning
export const TEMPLATES = {
  drake: {
    name: 'Drake Approves',
    description: 'Drake disapproving then approving',
    url: '/templates/drake.jpg',
    textAreas: [
      { position: 'top-right', label: 'Bad thing' },
      { position: 'bottom-right', label: 'Good thing' }
    ]
  },
  distracted: {
    name: 'Distracted Boyfriend',
    description: 'Guy looking at another girl while girlfriend watches',
    url: '/templates/distracted.jpg',
    textAreas: [
      { position: 'left', label: 'Current thing' },
      { position: 'center', label: 'You' },
      { position: 'right', label: 'New shiny thing' }
    ]
  },
  thisisfine: {
    name: 'This Is Fine',
    description: 'Dog in burning room saying this is fine',
    url: '/templates/thisisfine.jpg',
    textAreas: [
      { position: 'top', label: 'Situation' },
      { position: 'bottom', label: 'Response' }
    ]
  },
  expandingbrain: {
    name: 'Expanding Brain',
    description: 'Brain getting bigger with each panel',
    url: '/templates/expandingbrain.jpg',
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
    url: '/templates/changemymind.jpg',
    textAreas: [
      { position: 'sign', label: 'Hot take' }
    ]
  },
  twobuttons: {
    name: 'Two Buttons',
    description: 'Sweating guy choosing between two buttons',
    url: '/templates/twobuttons.jpg',
    textAreas: [
      { position: 'left-button', label: 'Option A' },
      { position: 'right-button', label: 'Option B' }
    ]
  }
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

export async function generateAIMeme(topic: string, style: string = 'general') {
  // Enhance topic for security style
  let enhancedTopic = topic;
  if (style === 'security') {
    const randomTheme = SECURITY_THEMES[Math.floor(Math.random() * SECURITY_THEMES.length)];
    enhancedTopic = `${topic} (in the context of ${randomTheme})`;
  }

  // Generate caption with GPT-4o-mini
  const captionResponse = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a meme caption generator. Create short, punchy, funny meme text.
        Style: ${style === 'security' ? 'DevOps/security humor, references to CVEs, containers, Kubernetes, CI/CD' : 'general internet humor'}
        Rules:
        - Keep it under 100 characters total
        - Be clever and witty
        - Use internet meme language appropriately
        - If security themed, make jokes developers and SREs would appreciate
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
  const imagePrompt = `A funny meme image about ${enhancedTopic}. 
    Style: colorful, exaggerated expressions, meme-worthy, internet humor aesthetic.
    Do NOT include any text in the image - just the visual scene.
    Make it suitable for a professional audience but still funny.`;

  const imageResponse = await getOpenAI().images.generate({
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

export async function generateTemplateMeme(templateId: string, topic: string) {
  const template = TEMPLATES[templateId as keyof typeof TEMPLATES];
  
  if (!template) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  // Generate captions for each text area
  const textAreasDescription = template.textAreas
    .map(area => `"${area.label}"`)
    .join(', ');

  const captionResponse = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a meme caption generator for the "${template.name}" meme format.
        This meme has these text areas: ${textAreasDescription}
        
        Rules:
        - Each text should be short (under 50 chars)
        - Be clever and match the meme format's typical humor
        - Return JSON with keys matching the text area labels`
      },
      {
        role: 'user',
        content: `Create meme text about: ${topic}`
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
