import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { GeneratedMeme } from '../App';
import ApiKeyModal from './ApiKeyModal';

const API_KEY_STORAGE_KEY = 'meme-generator-openai-key';

interface MemeGeneratorProps {
  onMemeGenerated: (meme: GeneratedMeme) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
}

type MemeMode = 'ai' | 'template';
type MemeStyle = 'general' | 'security' | 'sarcastic' | 'roast' | 'self-deprecating';
type TopicsCategory = 'security' | 'general' | 'gaming' | 'pets' | 'entertainment';

const TEMPLATES = [
  { id: 'drake', name: 'Drake Approves', emoji: '🎵' },
  { id: 'distracted', name: 'Distracted Boyfriend', emoji: '👀' },
  { id: 'thisisfine', name: 'This Is Fine', emoji: '🔥' },
  { id: 'expandingbrain', name: 'Expanding Brain', emoji: '🧠' },
  { id: 'changemymind', name: 'Change My Mind', emoji: '☕' },
  { id: 'twobuttons', name: 'Two Buttons', emoji: '😰' },
];

const SECURITY_QUICK_TOPICS = [
  { label: '🔐 CVEs in prod', topic: 'discovering CVEs in production' },
  { label: '🐳 Docker images', topic: 'Docker image sizes and layers' },
  { label: '☸️ K8s complexity', topic: 'Kubernetes YAML complexity' },
  { label: '📦 npm audit', topic: 'npm audit warnings' },
  { label: '🔥 Friday deploys', topic: 'deploying to production on Friday' },
  { label: '💀 Legacy code', topic: 'maintaining legacy code' },
  { label: '🤖 AI coding', topic: 'AI writing code for you' },
  { label: '📝 YAML indent', topic: 'YAML indentation errors' },
  { label: '🌊 DDoS attacks', topic: 'surviving DDoS attacks on your infrastructure' },
  { label: '☁️ Cloud bills', topic: 'unexpected cloud computing bills' },
  { label: '🔗 Chain of thought', topic: 'AI agents breaking their chain of thought mid-task' },
  { label: '🛡️ Guarded AI specs', topic: 'when your AI agent needs a Chainguard for its Anthropic thoughts and Tessl specs' },
];

const GENERAL_QUICK_TOPICS = [
  { label: '☕ Monday meetings', topic: 'surviving Monday morning meetings' },
  { label: '📧 Reply all', topic: 'accidental reply-all email disasters' },
  { label: '🍕 Free pizza', topic: 'free pizza in the break room' },
  { label: '📱 Phone dying', topic: 'phone dying at 1% battery' },
  { label: '🛋️ WFH life', topic: 'working from home distractions' },
  { label: '📅 Calendar Tetris', topic: 'back-to-back meetings all day' },
  { label: '🔔 Notifications', topic: 'notification overload from every app' },
  { label: '😴 Sleep schedule', topic: 'ruined sleep schedules' },
  { label: '🎧 Muted mic', topic: 'talking on mute during video calls' },
  { label: '🔋 Low battery anxiety', topic: 'laptop dying during important work' },
  { label: '📦 Online shopping', topic: 'waiting for package delivery' },
  { label: '🤳 Selfie attempts', topic: 'taking 47 selfies to get one good one' },
];

const GAMING_QUICK_TOPICS = [
  { label: '🎮 Rage quit', topic: 'rage quitting a video game' },
  { label: '🌙 One more game', topic: 'saying "one more game" at 3am' },
  { label: '💸 Pay to win', topic: 'pay-to-win mechanics in games' },
  { label: '📶 Lag spike', topic: 'lag spikes at the worst possible moment' },
  { label: '🗣️ Backseat gaming', topic: 'backseat gamers telling you what to do' },
  { label: '🎒 Inventory full', topic: 'inventory management in RPGs' },
  { label: '💀 Git gud', topic: 'dying to the same boss 50 times' },
  { label: '🔊 Hot mic', topic: 'embarrassing hot mic moments in voice chat' },
  { label: '⏸️ Cant pause online', topic: 'explaining you cant pause an online game' },
  { label: '🏆 Achievement hunting', topic: 'grinding for achievements nobody cares about' },
  { label: '🎯 Skill issue', topic: 'blaming everything except your own skill' },
  { label: '📱 Mobile gaming', topic: 'mobile game ads vs actual gameplay' },
];

const PETS_QUICK_TOPICS = [
  { label: '🐱 Expensive toy ignored', topic: 'cat ignoring expensive toy for the box' },
  { label: '🐕 Ate homework', topic: 'dog actually eating homework' },
  { label: '🌙 3am zoomies', topic: 'pet zoomies at 3am' },
  { label: '🏥 Vet visit drama', topic: 'dramatic pets at the vet' },
  { label: '👀 Judgmental pet', topic: 'pet silently judging your life choices' },
  { label: '🛋️ Spot stolen', topic: 'pet stealing your spot on the couch' },
  { label: '🍽️ Empty bowl lies', topic: 'pet acting like they havent been fed' },
  { label: '📦 Box obsession', topic: 'cat obsessed with cardboard boxes' },
  { label: '🚿 Bath time chaos', topic: 'giving a pet a bath' },
  { label: '🎾 Fetch refusal', topic: 'dog refusing to return the ball' },
  { label: '⌨️ Keyboard cat', topic: 'cat walking on keyboard during work' },
  { label: '🐾 Muddy paws', topic: 'pet with muddy paws on clean floors' },
];

const ENTERTAINMENT_QUICK_TOPICS = [
  { label: '🚨 Spoiler alert', topic: 'getting spoiled on a show you were about to watch' },
  { label: '📺 One more episode', topic: 'binge watching just one more episode' },
  { label: '😫 Streaming fatigue', topic: 'too many streaming services to subscribe to' },
  { label: '🔄 Unnecessary reboot', topic: 'reboots and remakes nobody asked for' },
  { label: '📖 Book was better', topic: 'the book was better than the movie' },
  { label: '🍿 Trailer spoilers', topic: 'trailers that spoil the entire movie' },
  { label: '⏭️ Skip intro debate', topic: 'skipping vs watching show intros' },
  { label: '😭 Character death', topic: 'favorite character getting killed off' },
  { label: '🗓️ Release delays', topic: 'movies and shows getting delayed' },
  { label: '🎬 Post credits', topic: 'waiting through credits for a 5 second scene' },
  { label: '📱 Second screen', topic: 'scrolling phone while watching a movie' },
  { label: '🤔 Plot holes', topic: 'obvious plot holes in movies' },
];

const QUICK_TOPICS_MAP: Record<TopicsCategory, typeof SECURITY_QUICK_TOPICS> = {
  security: SECURITY_QUICK_TOPICS,
  general: GENERAL_QUICK_TOPICS,
  gaming: GAMING_QUICK_TOPICS,
  pets: PETS_QUICK_TOPICS,
  entertainment: ENTERTAINMENT_QUICK_TOPICS,
};

export default function MemeGenerator({ 
  onMemeGenerated, 
  isGenerating, 
  setIsGenerating 
}: MemeGeneratorProps) {
  const { isCyberpunk } = useTheme();
  const [mode, setMode] = useState<MemeMode>('ai');
  const [style, setStyle] = useState<MemeStyle>('security');
  const [topicsCategory, setTopicsCategory] = useState<TopicsCategory>('security');
  const [topic, setTopic] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('drake');
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | undefined>(undefined);

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleApiKeySubmit = (newApiKey: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
    setApiKey(newApiKey);
    setShowApiKeyModal(false);
    setApiKeyError(undefined);
    // Auto-retry generation after setting key
    setTimeout(() => handleGenerate(newApiKey), 100);
  };

  const handleGenerate = async (overrideApiKey?: string) => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const endpoint = mode === 'ai' ? '/api/meme/generate' : '/api/meme/template';
      const body = mode === 'ai' 
        ? { topic, style }
        : { template: selectedTemplate, topic, style };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const keyToUse = overrideApiKey || apiKey;
      if (keyToUse) {
        headers['X-OpenAI-API-Key'] = keyToUse;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Check for API key errors
        if (data.code === 'API_KEY_REQUIRED' || data.code === 'API_KEY_INVALID') {
          setIsGenerating(false);
          setApiKeyError(data.code === 'API_KEY_INVALID' 
            ? 'Invalid API key. Please check your key and try again.'
            : undefined
          );
          setShowApiKeyModal(true);
          return;
        }
        
        throw new Error(data.error || 'Failed to generate meme');
      }

      const meme = await response.json();
      onMemeGenerated({
        id: meme.id,
        imageUrl: meme.imageUrl || meme.templateUrl,
        topText: meme.topText || '',
        bottomText: meme.bottomText || '',
        template: meme.templateName,
        templateId: meme.templateId,
        captions: meme.captions,
        style,
        createdAt: new Date()
      });
      
      setTopic('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const cardClass = isCyberpunk
    ? 'bg-black/60 backdrop-blur-md border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.2)]'
    : 'bg-slate-800 border border-slate-700';

  const buttonClass = isCyberpunk
    ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-black font-bold shadow-[0_0_20px_rgba(0,255,255,0.5)]'
    : 'bg-violet-600 hover:bg-violet-500 text-white';

  return (
    <div className={`rounded-xl p-6 ${cardClass} transition-all duration-500`}>
      <h2 className={`text-xl font-bold mb-6 ${isCyberpunk ? 'neon-text-cyan' : 'text-white'}`}>
        {isCyberpunk ? '🎮 CR34T3 M3M3' : '🎨 Create Meme'}
      </h2>

      {/* Mode Selection */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('ai')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            mode === 'ai'
              ? isCyberpunk
                ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-300'
                : 'bg-violet-600 text-white'
              : isCyberpunk
                ? 'bg-slate-800/50 border border-slate-600 text-slate-400 hover:border-cyan-500/50'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          🤖 AI Generated
        </button>
        <button
          onClick={() => setMode('template')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            mode === 'template'
              ? isCyberpunk
                ? 'bg-fuchsia-500/30 border-2 border-fuchsia-400 text-fuchsia-300'
                : 'bg-violet-600 text-white'
              : isCyberpunk
                ? 'bg-slate-800/50 border border-slate-600 text-slate-400 hover:border-fuchsia-500/50'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          📋 Classic Template
        </button>
      </div>

      {/* Template Selection (if template mode) */}
      {mode === 'template' && (
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${isCyberpunk ? 'text-fuchsia-300' : 'text-slate-300'}`}>
            Choose Template
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`p-3 rounded-lg text-left transition-all ${
                  selectedTemplate === t.id
                    ? isCyberpunk
                      ? 'bg-fuchsia-500/30 border-2 border-fuchsia-400'
                      : 'bg-violet-600 border-2 border-violet-400'
                    : isCyberpunk
                      ? 'bg-slate-800/50 border border-slate-600 hover:border-fuchsia-500/50'
                      : 'bg-slate-700 border border-slate-600 hover:border-violet-500'
                }`}
              >
                <span className="text-xl mr-2">{t.emoji}</span>
                <span className={`text-sm ${isCyberpunk ? 'text-slate-200' : 'text-white'}`}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Humor Style Selection */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-2 ${isCyberpunk ? 'text-cyan-300' : 'text-slate-300'}`}>
          Humor Style
        </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStyle('security')}
              className={`py-2 px-3 rounded-lg text-sm transition-all ${
                style === 'security'
                  ? isCyberpunk
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300'
                    : 'bg-violet-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              🔐 Security/DevOps
            </button>
            <button
              onClick={() => setStyle('general')}
              className={`py-2 px-3 rounded-lg text-sm transition-all ${
                style === 'general'
                  ? isCyberpunk
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300'
                    : 'bg-violet-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              😂 General
            </button>
            <button
              onClick={() => setStyle('sarcastic')}
              className={`py-2 px-3 rounded-lg text-sm transition-all ${
                style === 'sarcastic'
                  ? isCyberpunk
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300'
                    : 'bg-violet-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              🎭 Sarcastic
            </button>
            <button
              onClick={() => setStyle('roast')}
              className={`py-2 px-3 rounded-lg text-sm transition-all ${
                style === 'roast'
                  ? isCyberpunk
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300'
                    : 'bg-violet-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              🔥 Roast
            </button>
            <button
              onClick={() => setStyle('self-deprecating')}
              className={`py-2 px-3 rounded-lg text-sm transition-all ${
                style === 'self-deprecating'
                  ? isCyberpunk
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300'
                    : 'bg-violet-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              😅 Self-deprecating
            </button>
          </div>
        </div>

      {/* Quick Topics */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className={`text-sm font-medium ${isCyberpunk ? 'text-cyan-300' : 'text-slate-300'}`}>
            Quick Topics
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => setTopicsCategory('security')}
              className={`text-lg transition-all hover:scale-110 ${topicsCategory === 'security' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              title="Security/DevOps topics"
            >
              🔐
            </button>
            <button
              onClick={() => setTopicsCategory('general')}
              className={`text-lg transition-all hover:scale-110 ${topicsCategory === 'general' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              title="General topics"
            >
              😂
            </button>
            <button
              onClick={() => setTopicsCategory('gaming')}
              className={`text-lg transition-all hover:scale-110 ${topicsCategory === 'gaming' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              title="Gaming topics"
            >
              🎮
            </button>
            <button
              onClick={() => setTopicsCategory('pets')}
              className={`text-lg transition-all hover:scale-110 ${topicsCategory === 'pets' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              title="Pet topics"
            >
              🐾
            </button>
            <button
              onClick={() => setTopicsCategory('entertainment')}
              className={`text-lg transition-all hover:scale-110 ${topicsCategory === 'entertainment' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              title="Movies/TV topics"
            >
              🎬
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_TOPICS_MAP[topicsCategory].map(qt => (
            <button
              key={qt.topic}
              onClick={() => setTopic(qt.topic)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                isCyberpunk
                  ? 'bg-slate-800/50 border border-slate-600 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {qt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topic Input */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-2 ${isCyberpunk ? 'text-cyan-300' : 'text-slate-300'}`}>
          Topic / Prompt
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What should the meme be about?"
          className={`w-full px-4 py-3 rounded-lg transition-all resize-none ${
            isCyberpunk
              ? 'bg-black/50 border-2 border-cyan-500/50 text-cyan-100 placeholder-cyan-700 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.3)]'
              : 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-violet-500'
          } focus:outline-none`}
          rows={3}
          maxLength={500}
        />
        <div className={`text-xs mt-1 text-right ${isCyberpunk ? 'text-cyan-600' : 'text-slate-500'}`}>
          {topic.length}/500
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mb-4 p-3 rounded-lg ${
          isCyberpunk 
            ? 'bg-red-900/30 border border-red-500 text-red-300' 
            : 'bg-red-900/50 text-red-300'
        }`}>
          ⚠️ {error}
        </div>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => {
          setShowApiKeyModal(false);
          setApiKeyError(undefined);
        }}
        onSubmit={handleApiKeySubmit}
        errorMessage={apiKeyError}
      />

      {/* Generate Button */}
      <button
        onClick={() => handleGenerate()}
        disabled={isGenerating}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${buttonClass} ${
          isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
        }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {isCyberpunk ? 'G3N3R4T1NG...' : 'Generating...'}
          </span>
        ) : (
          <span>{isCyberpunk ? '⚡ G3N3R4T3 M3M3 ⚡' : '✨ Generate Meme'}</span>
        )}
      </button>
    </div>
  );
}
