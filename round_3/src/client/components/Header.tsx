import { useTheme } from '../context/ThemeContext';
import Linky from './Linky';

export default function Header() {
  const { isCyberpunk } = useTheme();

  return (
    <header className={`sticky top-0 z-50 transition-all duration-500 ${
      isCyberpunk 
        ? 'bg-black/80 backdrop-blur-md border-b-2 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.3)]' 
        : 'bg-slate-900 border-b border-slate-700'
    }`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Linky + Title */}
          <div className="flex items-center gap-4">
            <Linky />
            <div>
              <h1 className={`text-2xl font-bold transition-all duration-500 ${
                isCyberpunk 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-cyan-400 neon-text-cyan' 
                  : 'text-white'
              }`}>
                {isCyberpunk ? 'M3M3 G3N3R470R 3000' : 'Meme Generator 3000'}
              </h1>
              <p className={`text-sm ${isCyberpunk ? 'text-cyan-400' : 'text-slate-400'}`}>
                AI-Powered Meme Creation
              </p>
            </div>
            {isCyberpunk && (
              <span className="text-xs text-cyan-400 animate-pulse font-mono ml-2">
                [31337 M0D3]
              </span>
            )}
          </div>
          
          {/* Right: Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/ProvenGuilty/vibelympics/tree/main/round_3"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-lg transition-all text-xl ${
                isCyberpunk 
                  ? 'bg-fuchsia-900/50 hover:bg-fuchsia-800/50 border border-fuchsia-500 shadow-[0_0_10px_rgba(255,0,255,0.3)]' 
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              title="View on GitHub"
            >
              🐱
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
