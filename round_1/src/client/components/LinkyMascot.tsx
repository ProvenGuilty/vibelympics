import { useState } from 'react';
import { AVAILABLE_HATS } from '../types';

interface LinkyMascotProps {
  hat: string;
  onHatChange: (hat: string) => void;
}

export function LinkyMascot({ hat, onHatChange }: LinkyMascotProps) {
  const [showHatPicker, setShowHatPicker] = useState(false);

  return (
    <div className="relative">
      {/* Linky with Hat */}
      <div 
        className="flex flex-col items-center cursor-pointer"
        onClick={() => setShowHatPicker(!showHatPicker)}
      >
        {/* Hat */}
        <div className="text-emoji-xl -mb-4 z-10 transform hover:rotate-12 transition-transform">
          {hat}
        </div>
        
        {/* Linky */}
        <div className="text-6xl linky-animate">
          🐙
        </div>
        
        {/* Speech bubble hint */}
        <div className="mt-2 text-center">
          <span className="text-2xl">👆</span>
          <span className="text-2xl">🎩</span>
          <span className="text-2xl">❓</span>
        </div>
      </div>

      {/* Hat Picker */}
      {showHatPicker && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 z-50">
          <div className="grid grid-cols-4 gap-2">
            {AVAILABLE_HATS.map((hatOption) => (
              <button
                key={hatOption}
                onClick={() => {
                  onHatChange(hatOption);
                  setShowHatPicker(false);
                }}
                className={`
                  text-3xl p-2 rounded-lg transition-all hover:scale-125
                  ${hat === hatOption ? 'bg-chainguard-200 dark:bg-chainguard-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                `}
              >
                {hatOption}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
