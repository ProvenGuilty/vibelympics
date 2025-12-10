import { useState, useEffect, useRef } from 'react';

interface ScanProgressProps {
  scanId: string;
  onComplete: () => void;
}

interface ProgressData {
  status: string;
  current?: number;
  total?: number;
  currentPackage?: string;
  percent?: number;
  log?: string[];
  complete?: boolean;
  error?: string;
}

export default function ScanProgress({ scanId, onComplete }: ScanProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Poll for progress updates
    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/scan/${scanId}/status`);
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
          
          if (data.status === 'completed' || data.status === 'error') {
            onComplete();
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      }
    };

    pollProgress();
    const interval = setInterval(pollProgress, 500);
    
    return () => clearInterval(interval);
  }, [scanId, onComplete]);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [progress?.log]);

  if (!progress) {
    return (
      <div className="bg-slate-800 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4 animate-pulse">🔍</div>
        <div className="text-xl font-bold">Initializing scan...</div>
      </div>
    );
  }

  const percent = progress.percent || 0;

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900/50 to-slate-800 px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Scanning Manifest</h3>
            <p className="text-sm text-slate-400">
              Deep scanning each package for vulnerabilities...
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold font-mono">{percent}%</div>
            <div className="text-sm text-slate-400">
              {progress.current || 0} / {progress.total || 0} packages
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4">
        <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-400/50 to-transparent animate-pulse"
            style={{ width: `${percent}%` }}
          />
        </div>
        
        {progress.currentPackage && (
          <div className="mt-3 flex items-center gap-2">
            <span className="animate-spin">⚙️</span>
            <span className="font-mono text-violet-400">{progress.currentPackage}</span>
          </div>
        )}
      </div>

      {/* Log Output */}
      <div className="border-t border-slate-700">
        <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-700 flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">STDOUT</span>
          <span className="flex-1 h-px bg-slate-700"></span>
        </div>
        <div 
          ref={logRef}
          className="h-64 overflow-y-auto p-4 font-mono text-xs bg-slate-900/30"
        >
          {progress.log?.map((line, i) => (
            <div 
              key={i} 
              className={`py-0.5 ${
                line.includes('✓') ? 'text-emerald-400' :
                line.includes('✗') ? 'text-red-400' :
                line.includes('Scanning') ? 'text-violet-400' :
                'text-slate-400'
              }`}
            >
              {line}
            </div>
          ))}
          {progress.status === 'scanning' && (
            <div className="py-0.5 text-slate-500 animate-pulse">
              █
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-slate-900/50 border-t border-slate-700 text-xs text-slate-500">
        💡 Each package is scanned with its full dependency tree for comprehensive vulnerability detection
      </div>
    </div>
  );
}
