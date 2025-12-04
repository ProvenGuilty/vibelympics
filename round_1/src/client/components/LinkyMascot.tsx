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
        <div className="text-6xl linky-animate hover:scale-110 transition-transform">
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
        <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 z-50 border-2 border-chainguard-300 dark:border-chainguard-600">
          <div className="flex flex-wrap justify-center gap-3 max-w-[280px]">
            {AVAILABLE_HATS.map((hatOption) => (
              <button
                key={hatOption}
                onClick={(e) => {
                  e.stopPropagation();
                  onHatChange(hatOption);
                  setShowHatPicker(false);
                }}
                className={`
                  w-12 h-12 flex items-center justify-center text-2xl rounded-lg transition-all hover:scale-110 border-2
                  ${hat === hatOption 
                    ? 'bg-chainguard-200 dark:bg-chainguard-700 border-chainguard-500' 
                    : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300'}
                `}
                title={hatOption}
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
