import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apiKey: string) => void;
  errorMessage?: string;
}

export default function ApiKeyModal({ isOpen, onClose, onSubmit, errorMessage }: ApiKeyModalProps) {
  const { isCyberpunk } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  };

  const modalBg = isCyberpunk
    ? 'bg-black/95 border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(0,255,255,0.3)]'
    : 'bg-slate-800 border border-slate-600';

  const inputClass = isCyberpunk
    ? 'bg-black/50 border-2 border-cyan-500/50 text-cyan-100 placeholder-cyan-700 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.3)]'
    : 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-violet-500';

  const buttonClass = isCyberpunk
    ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-black font-bold shadow-[0_0_20px_rgba(0,255,255,0.5)]'
    : 'bg-violet-600 hover:bg-violet-500 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-xl p-6 ${modalBg} transition-all duration-300`}>
        <h2 className={`text-xl font-bold mb-2 ${isCyberpunk ? 'neon-text-cyan' : 'text-white'}`}>
          🔑 {isCyberpunk ? '4P1 K3Y R3QU1R3D' : 'API Key Required'}
        </h2>
        
        <p className={`text-sm mb-4 ${isCyberpunk ? 'text-cyan-300/80' : 'text-slate-300'}`}>
          This app requires an OpenAI API key to generate memes. Your key is stored locally in your browser and sent directly to OpenAI.
        </p>

        {errorMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            isCyberpunk 
              ? 'bg-red-900/30 border border-red-500 text-red-300' 
              : 'bg-red-900/50 text-red-300'
          }`}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isCyberpunk ? 'text-cyan-300' : 'text-slate-300'}`}>
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className={`w-full px-4 py-3 pr-12 rounded-lg transition-all ${inputClass} focus:outline-none`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg ${
                  isCyberpunk ? 'text-cyan-500 hover:text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                isCyberpunk
                  ? 'bg-slate-800/50 border border-slate-600 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!apiKey.trim()}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${buttonClass} ${
                !apiKey.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
              }`}
            >
              {isCyberpunk ? '⚡ S4V3 K3Y' : '💾 Save Key'}
            </button>
          </div>
        </form>

        <div className={`mt-4 text-xs ${isCyberpunk ? 'text-cyan-600' : 'text-slate-500'}`}>
          <p>🔒 Your API key is stored only in your browser's localStorage and is never sent to our servers.</p>
          <p className="mt-1">
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`underline ${isCyberpunk ? 'text-cyan-400 hover:text-cyan-300' : 'text-violet-400 hover:text-violet-300'}`}
            >
              Get an API key from OpenAI →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
