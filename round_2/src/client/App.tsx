import { useState, useCallback } from 'react';
import ScanForm from './components/scan/ScanForm';
import ResultsView from './components/results/ResultsView';
import ScanProgress from './components/scan/ScanProgress';
import { LynxMascot } from './components/LynxMascot';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const [view, setView] = useState<'scan' | 'scanning' | 'results'>('scan');
  const [scanId, setScanId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isManifestScan, setIsManifestScan] = useState(false);
  const { theme } = useTheme();

  const isCyberpunk = theme === 'cyberpunk';

  const handleScanStart = (id: string, manifest: boolean = false) => {
    setScanId(id);
    setIsManifestScan(manifest);
    if (manifest) {
      setView('scanning');
    } else {
      setView('results');
    }
  };

  const handleScanComplete = useCallback(() => {
    setView('results');
  }, []);

  const handleBackToScan = () => {
    setView('scan');
    setScanId(null);
    setIsManifestScan(false);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className={`min-h-screen transition-all duration-500 ${
        isCyberpunk 
          ? 'bg-gradient-to-br from-black via-purple-950 to-black' 
          : 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'
      }`}>
        {/* Cyberpunk grid overlay */}
        {isCyberpunk && (
          <div className="fixed inset-0 pointer-events-none z-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        )}
        
        {/* Header */}
        <header className={`shadow-lg sticky top-0 z-50 transition-all duration-500 ${
          isCyberpunk 
            ? 'bg-black/80 backdrop-blur-md border-b-2 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.3)]' 
            : 'bg-white dark:bg-slate-800'
        }`}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Lynx Mascot + Title */}
              <div className="flex items-center gap-4">
                <LynxMascot />
                <h1 className={`text-2xl font-bold transition-all duration-500 ${
                  isCyberpunk 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]' 
                    : 'text-slate-900 dark:text-white'
                }`}>
                  The Weakest Lynx
                </h1>
                {isCyberpunk && (
                  <span className="text-xs text-cyan-400 animate-pulse font-mono">
                    [CYBER MODE]
                  </span>
                )}
              </div>
              
              {/* Right: Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`px-4 py-2 rounded-lg transition-all text-xl ${
                    isCyberpunk 
                      ? 'bg-cyan-900/50 hover:bg-cyan-800/50 border border-cyan-500 shadow-[0_0_10px_rgba(0,255,255,0.3)]' 
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                  title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                
                <a
                  href="https://github.com/chainguard-demo/vibelympics/tree/main/round_2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2 rounded-lg transition-all text-xl ${
                    isCyberpunk 
                      ? 'bg-fuchsia-900/50 hover:bg-fuchsia-800/50 border border-fuchsia-500 shadow-[0_0_10px_rgba(255,0,255,0.3)]' 
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                  title="View on GitHub"
                >
                  🐱
                </a>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 relative z-10">
          {view === 'scan' && (
            <ScanForm onScanStart={handleScanStart} />
          )}
          
          {view === 'scanning' && scanId && (
            <ScanProgress scanId={scanId} onComplete={handleScanComplete} />
          )}
          
          {view === 'results' && scanId && (
            <ResultsView scanId={scanId} onBack={handleBackToScan} />
          )}
        </main>
        
        {/* Cyberpunk scanline effect */}
        {isCyberpunk && (
          <div className="fixed inset-0 pointer-events-none z-50 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500 to-transparent h-[2px] animate-scanline" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
