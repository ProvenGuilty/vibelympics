import { useEffect, useState } from 'react';

const HATS = ['🎩', '👑', '🧢', '🎓', '⛑️', '🪖', '👒', '🎀', '🌸', '⭐'];

export function LynxMascot() {
  const [hat, setHat] = useState('');

  useEffect(() => {
    // Pick a random hat on mount
    const randomHat = HATS[Math.floor(Math.random() * HATS.length)];
    setHat(randomHat);
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Hat */}
      <div className="text-4xl -mb-3 z-10 animate-bounce">
        {hat}
      </div>
      
      {/* Lynx (octopus emoji) */}
      <div className="text-6xl linky-animate hover:scale-110 transition-transform">
        🐙
      </div>
    </div>
  );
}
