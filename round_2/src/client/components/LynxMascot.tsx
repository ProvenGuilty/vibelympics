import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const HATS = ['🎩', '👑', '🧢', '🎓', '⛑️', '🪖', '👒', '🎀', '🌸', '⭐'];
const CYBER_HATS = ['🤖', '👾', '🎮', '💀', '⚡', '🔮', '💎', '🌐', '🛸', '🧬'];

export function LynxMascot() {
  const [hat, setHat] = useState('');
  const [showFlash, setShowFlash] = useState(false);
  const { theme, toggleCyberpunk } = useTheme();

  useEffect(() => {
    // Pick a random hat based on theme
    const hats = theme === 'cyberpunk' ? CYBER_HATS : HATS;
    const randomHat = hats[Math.floor(Math.random() * hats.length)];
    setHat(randomHat);
  }, [theme]);

  const handleDoubleClick = () => {
    setShowFlash(true);
    toggleCyberpunk();
    setTimeout(() => setShowFlash(false), 300);
  };

  return (
    <div className="flex flex-col items-center relative">
      {/* Flash effect on theme change */}
      {showFlash && (
        <div className="absolute inset-0 animate-ping">
          <div className={`w-full h-full rounded-full ${
            theme === 'default' ? 'bg-cyan-500/50' : 'bg-violet-500/50'
          }`} />
        </div>
      )}
      
      {/* Hat - double click to toggle cyberpunk */}
      <div 
        className={`text-4xl -mb-3 z-10 cursor-pointer select-none transition-all ${
          theme === 'cyberpunk' 
            ? 'animate-pulse drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]' 
            : 'animate-bounce'
        }`}
        onDoubleClick={handleDoubleClick}
        title="Double-click for a surprise..."
      >
        {hat}
      </div>
      
      {/* Lynx (octopus emoji) */}
      <div className={`text-6xl linky-animate hover:scale-110 transition-transform ${
        theme === 'cyberpunk' ? 'drop-shadow-[0_0_15px_rgba(255,0,255,0.8)]' : ''
      }`}>
        🐙
      </div>
    </div>
  );
}
