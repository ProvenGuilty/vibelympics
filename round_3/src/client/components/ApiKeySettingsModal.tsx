import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';

export const API_KEY_TEXT_STORAGE_KEY = 'meme-generator-openai-key-text';
export const API_KEY_IMAGE_STORAGE_KEY = 'meme-generator-openai-key-image';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  requiredKeyType?: 'text' | 'image' | 'both' | null;
  errorMessage?: string;
}

type KeyType = 'text' | 'image' | 'both';

export default function ApiKeySettingsModal({ isOpen, onClose, onSave, requiredKeyType, errorMessage }: ApiKeySettingsModalProps) {
  const { isCyberpunk } = useTheme();
  const [selectedKeyType, setSelectedKeyType] = useState<KeyType>(requiredKeyType || 'both');
  const [textKey, setTextKey] = useState('');
  const [imageKey, setImageKey] = useState('');
  const [bothKey, setBothKey] = useState('');
  const [showTextKey, setShowTextKey] = useState(false);
  const [showImageKey, setShowImageKey] = useState(false);
  const [showBothKey, setShowBothKey] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Load keys from localStorage on mount and set initial tab based on required type
  useEffect(() => {
    if (isOpen) {
      const storedTextKey = localStorage.getItem(API_KEY_TEXT_STORAGE_KEY) || '';
      const storedImageKey = localStorage.getItem(API_KEY_IMAGE_STORAGE_KEY) || '';
      setTextKey(storedTextKey);
      setImageKey(storedImageKey);
      setBothKey('');
      setSavedMessage(null);
      
      // If opened with a required key type, select that tab
      if (requiredKeyType) {
        setSelectedKeyType(requiredKeyType);
      }
    }
  }, [isOpen, requiredKeyType]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (selectedKeyType === 'both' && bothKey.trim()) {
      localStorage.setItem(API_KEY_TEXT_STORAGE_KEY, bothKey.trim());
      localStorage.setItem(API_KEY_IMAGE_STORAGE_KEY, bothKey.trim());
      setTextKey(bothKey.trim());
      setImageKey(bothKey.trim());
      setSavedMessage('Both keys saved!');
    } else if (selectedKeyType === 'text' && textKey.trim()) {
      localStorage.setItem(API_KEY_TEXT_STORAGE_KEY, textKey.trim());
      setSavedMessage('Text generation key saved!');
    } else if (selectedKeyType === 'image' && imageKey.trim()) {
      localStorage.setItem(API_KEY_IMAGE_STORAGE_KEY, imageKey.trim());
      setSavedMessage('Image generation key saved!');
    }
    onSave();
    setTimeout(() => setSavedMessage(null), 2000);
  };

  const handleClear = (type: KeyType) => {
    if (type === 'both') {
      localStorage.removeItem(API_KEY_TEXT_STORAGE_KEY);
      localStorage.removeItem(API_KEY_IMAGE_STORAGE_KEY);
      setTextKey('');
      setImageKey('');
      setBothKey('');
      setSavedMessage('All keys cleared!');
    } else if (type === 'text') {
      localStorage.removeItem(API_KEY_TEXT_STORAGE_KEY);
      setTextKey('');
      setSavedMessage('Text key cleared!');
    } else {
      localStorage.removeItem(API_KEY_IMAGE_STORAGE_KEY);
      setImageKey('');
      setSavedMessage('Image key cleared!');
    }
    onSave();
    setTimeout(() => setSavedMessage(null), 2000);
  };

  const getCurrentKeyValue = () => {
    if (selectedKeyType === 'both') return bothKey;
    if (selectedKeyType === 'text') return textKey;
    return imageKey;
  };

  const hasCurrentKey = () => {
    if (selectedKeyType === 'both') return hasTextKey || hasImageKey;
    if (selectedKeyType === 'text') return hasTextKey;
    return hasImageKey;
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

  const tabClass = (active: boolean) => active
    ? isCyberpunk
      ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-300'
      : 'bg-violet-600 text-white'
    : isCyberpunk
      ? 'bg-slate-800/50 border border-slate-600 text-slate-400 hover:border-cyan-500/50'
      : 'bg-slate-700 text-slate-300 hover:bg-slate-600';

  const hasTextKey = !!localStorage.getItem(API_KEY_TEXT_STORAGE_KEY);
  const hasImageKey = !!localStorage.getItem(API_KEY_IMAGE_STORAGE_KEY);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-xl p-6 ${modalBg} transition-all duration-300`}>
        <h2 className={`text-xl font-bold mb-2 ${isCyberpunk ? 'neon-text-cyan' : 'text-white'}`}>
          🔑 {isCyberpunk ? '4P1 K3Y S3TT1NGS' : 'API Key Settings'}
        </h2>
        
        <p className={`text-sm mb-4 ${isCyberpunk ? 'text-cyan-300/80' : 'text-slate-300'}`}>
          Set separate OpenAI API keys for text (GPT) and image (DALL-E) generation.
        </p>

        {/* Key Type Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedKeyType('both')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1 text-sm ${tabClass(selectedKeyType === 'both')}`}
          >
            <span>🔑</span>
            <span>Both</span>
            {hasTextKey && hasImageKey && <span className="text-green-400">✓</span>}
          </button>
          <button
            onClick={() => setSelectedKeyType('text')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1 text-sm ${tabClass(selectedKeyType === 'text')}`}
          >
            <span>💬</span>
            <span>Text</span>
            {hasTextKey && <span className="text-green-400">✓</span>}
          </button>
          <button
            onClick={() => setSelectedKeyType('image')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1 text-sm ${tabClass(selectedKeyType === 'image')}`}
          >
            <span>🎨</span>
            <span>Image</span>
            {hasImageKey && <span className="text-green-400">✓</span>}
          </button>
        </div>

        {/* Error Message (when opened due to missing key) */}
        {errorMessage && !savedMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            isCyberpunk 
              ? 'bg-red-900/30 border border-red-500 text-red-300' 
              : 'bg-red-900/50 text-red-300'
          }`}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Success Message */}
        {savedMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            isCyberpunk 
              ? 'bg-green-900/30 border border-green-500 text-green-300' 
              : 'bg-green-900/50 text-green-300'
          }`}>
            ✅ {savedMessage}
          </div>
        )}

        {/* Both Keys Input */}
        {selectedKeyType === 'both' && (
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isCyberpunk ? 'text-cyan-300' : 'text-slate-300'}`}>
              OpenAI API Key for Both Text & Image
            </label>
            <div className="relative">
              <input
                type={showBothKey ? 'text' : 'password'}
                value={bothKey}
                onChange={(e) => setBothKey(e.target.value)}
                placeholder="sk-..."
                className={`w-full px-4 py-3 pr-12 rounded-lg transition-all ${inputClass} focus:outline-none`}
              />
              <button
                type="button"
                onClick={() => setShowBothKey(!showBothKey)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg ${
                  isCyberpunk ? 'text-cyan-500 hover:text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                {showBothKey ? '🙈' : '👁️'}
              </button>
            </div>
            <p className={`text-xs mt-1 ${isCyberpunk ? 'text-cyan-600' : 'text-slate-500'}`}>
              Sets the same key for GPT-4o-mini and DALL-E 3
            </p>
          </div>
        )}

        {/* Text Key Input */}
        {selectedKeyType === 'text' && (
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isCyberpunk ? 'text-cyan-300' : 'text-slate-300'}`}>
              OpenAI API Key for Text Generation
            </label>
            <div className="relative">
              <input
                type={showTextKey ? 'text' : 'password'}
                value={textKey}
                onChange={(e) => setTextKey(e.target.value)}
                placeholder="sk-..."
                className={`w-full px-4 py-3 pr-12 rounded-lg transition-all ${inputClass} focus:outline-none`}
              />
              <button
                type="button"
                onClick={() => setShowTextKey(!showTextKey)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg ${
                  isCyberpunk ? 'text-cyan-500 hover:text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                {showTextKey ? '🙈' : '👁️'}
              </button>
            </div>
            <p className={`text-xs mt-1 ${isCyberpunk ? 'text-cyan-600' : 'text-slate-500'}`}>
              Used for GPT-4o-mini caption generation
            </p>
          </div>
        )}

        {/* Image Key Input */}
        {selectedKeyType === 'image' && (
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isCyberpunk ? 'text-cyan-300' : 'text-slate-300'}`}>
              OpenAI API Key for Image Generation
            </label>
            <div className="relative">
              <input
                type={showImageKey ? 'text' : 'password'}
                value={imageKey}
                onChange={(e) => setImageKey(e.target.value)}
                placeholder="sk-..."
                className={`w-full px-4 py-3 pr-12 rounded-lg transition-all ${inputClass} focus:outline-none`}
              />
              <button
                type="button"
                onClick={() => setShowImageKey(!showImageKey)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg ${
                  isCyberpunk ? 'text-cyan-500 hover:text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                {showImageKey ? '🙈' : '👁️'}
              </button>
            </div>
            <p className={`text-xs mt-1 ${isCyberpunk ? 'text-cyan-600' : 'text-slate-500'}`}>
              Used for DALL-E 3 image generation
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => handleClear(selectedKeyType)}
            disabled={!hasCurrentKey()}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              isCyberpunk
                ? 'bg-red-900/30 border border-red-500 text-red-300 hover:bg-red-900/50 disabled:opacity-30'
                : 'bg-red-900/50 text-red-300 hover:bg-red-800/50 disabled:opacity-30'
            } disabled:cursor-not-allowed`}
          >
            🗑️ Clear
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!getCurrentKeyValue().trim()}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${buttonClass} ${
              !getCurrentKeyValue().trim()
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:scale-[1.02]'
            }`}
          >
            {isCyberpunk ? '💾 S4V3' : '💾 Save'}
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`w-full py-3 rounded-lg font-medium transition-all ${
            isCyberpunk
              ? 'bg-slate-800/50 border border-slate-600 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Close
        </button>

        <div className={`mt-4 text-xs ${isCyberpunk ? 'text-cyan-600' : 'text-slate-500'}`}>
          <p>🔒 Keys are stored only in your browser's localStorage.</p>
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
    </div>,
    document.body
  );
}
