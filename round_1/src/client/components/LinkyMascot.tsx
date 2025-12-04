import { useState } from 'react';
import { AVAILABLE_HATS } from '../types';

interface LinkyMascotProps {
  hat: string;
  onHatChange: (hat: string) => void;
}

export function LinkyMascot({ hat, onHatChange }: LinkyMascotProps) {
  const [showHatPicker, setShowHatPicker] = useState(false);

  const randomizeHat = () => {
    const otherHats = AVAILABLE_HATS.filter(h => h !== hat);
    const randomHat = otherHats[Math.floor(Math.random() * otherHats.length)];
    onHatChange(randomHat);
  };

  return (
    <div className="relative">
      {/* Linky with Hat */}
      <div className="flex flex-col items-center">
        {/* Hat - clickable to open picker */}
        <button
          onClick={() => setShowHatPicker(!showHatPicker)}
          className="text-emoji-xl -mb-4 z-10 transform hover:rotate-12 transition-transform cursor-pointer"
          title="Change my hat"
        >
          {hat}
        </button>
        
        {/* Linky */}
        <div className="text-6xl linky-animate hover:scale-110 transition-transform">
          🐙
        </div>
        
        {/* Hat controls */}
        <div className="mt-2 text-center flex items-center gap-2">
          <button
            onClick={() => setShowHatPicker(!showHatPicker)}
            className="text-2xl hover:scale-110 transition-transform cursor-pointer"
            title="Change my hat"
          >
            {hat}
          </button>
          <button
            onClick={randomizeHat}
            className="text-2xl hover:scale-110 hover:rotate-12 transition-transform cursor-pointer"
            title="Randomize my hat"
          >
            🎲
          </button>
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
