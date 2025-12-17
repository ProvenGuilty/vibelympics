import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { GeneratedMeme } from '../App';

interface MemeGeneratorProps {
  onMemeGenerated: (meme: GeneratedMeme) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
}

type MemeMode = 'ai' | 'template';
type MemeStyle = 'general' | 'security';

const TEMPLATES = [
  { id: 'drake', name: 'Drake Approves', emoji: '🎵' },
  { id: 'distracted', name: 'Distracted Boyfriend', emoji: '👀' },
  { id: 'thisisfine', name: 'This Is Fine', emoji: '🔥' },
  { id: 'expandingbrain', name: 'Expanding Brain', emoji: '🧠' },
  { id: 'changemymind', name: 'Change My Mind', emoji: '☕' },
  { id: 'twobuttons', name: 'Two Buttons', emoji: '😰' },
];

const QUICK_TOPICS = [
  { label: '🔐 CVEs in prod', topic: 'discovering CVEs in production' },
  { label: '🐳 Docker images', topic: 'Docker image sizes and layers' },
  { label: '☸️ K8s complexity', topic: 'Kubernetes YAML complexity' },
  { label: '📦 npm audit', topic: 'npm audit warnings' },
  { label: '🔥 Friday deploys', topic: 'deploying to production on Friday' },
  { label: '💀 Legacy code', topic: 'maintaining legacy code' },
  { label: '🤖 AI coding', topic: 'AI writing code for you' },
  { label: '📝 YAML indent', topic: 'YAML indentation errors' },
];

export default function MemeGenerator({ 
  onMemeGenerated, 
  isGenerating, 
  setIsGenerating 
}: MemeGeneratorProps) {
  const { isCyberpunk } = useTheme();
  const [mode, setMode] = useState<MemeMode>('ai');
  const [style, setStyle] = useState<MemeStyle>('security');
  const [topic, setTopic] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('drake');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
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
        : { template: selectedTemplate, topic };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const data = await response.json();
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

      {/* Style Selection (if AI mode) */}
      {mode === 'ai' && (
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${isCyberpunk ? 'text-cyan-300' : 'text-slate-300'}`}>
            Humor Style
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setStyle('security')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all ${
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
              className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all ${
                style === 'general'
                  ? isCyberpunk
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300'
                    : 'bg-violet-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              😂 General
            </button>
          </div>
        </div>
      )}

      {/* Quick Topics */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${isCyberpunk ? 'text-cyan-300' : 'text-slate-300'}`}>
          Quick Topics
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_TOPICS.map(qt => (
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

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
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
