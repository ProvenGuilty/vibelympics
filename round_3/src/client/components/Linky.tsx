import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const HATS = ['🎩', '👑', '🧢', '🎓', '⛑️', '🪖', '👒', '🎀', '🌸', '⭐'];
const CYBER_HATS = ['🤖', '👾', '🎮', '💀', '⚡', '🔮', '💎', '🌐', '🛸', '🧬'];

export default function Linky() {
  const [hat, setHat] = useState('');
  const [showFlash, setShowFlash] = useState(false);
  const { isCyberpunk, toggleCyberpunk } = useTheme();

  useEffect(() => {
    const hats = isCyberpunk ? CYBER_HATS : HATS;
    const randomHat = hats[Math.floor(Math.random() * hats.length)];
    setHat(randomHat);
  }, [isCyberpunk]);

  const handleClick = () => {
    setShowFlash(true);
    toggleCyberpunk();
    setTimeout(() => setShowFlash(false), 300);
  };

  return (
    <div className="flex flex-col items-center relative">
      {showFlash && (
        <div className="absolute inset-0 animate-ping">
          <div className={`w-full h-full rounded-full ${
            !isCyberpunk ? 'bg-cyan-500/50' : 'bg-violet-500/50'
          }`} />
        </div>
      )}
      
      <div 
        className={`text-3xl -mb-2 z-10 cursor-pointer select-none transition-all ${
          isCyberpunk 
            ? 'animate-pulse drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]' 
            : 'animate-bounce'
        }`}
        onClick={handleClick}
        title="Click for a surprise..."
      >
        {hat}
      </div>
      
      <div className={`text-5xl linky-animate hover:scale-110 transition-transform ${
        isCyberpunk ? 'drop-shadow-[0_0_15px_rgba(255,0,255,0.8)]' : ''
      }`}>
        🐙
      </div>
    </div>
  );
}
