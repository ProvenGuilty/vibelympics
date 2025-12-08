import { useState } from 'react';

interface ScoreCardProps {
  scan: any;
}

export default function ScoreCard({ scan }: ScoreCardProps) {
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <>
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold">Security Score</h3>
          <button
            onClick={() => setShowScoreInfo(!showScoreInfo)}
            className="text-xl hover:scale-110 transition-transform"
            title="How is the score calculated?"
          >
            ℹ️
          </button>
        </div>
        <div className={`text-5xl font-bold ${getScoreColor(scan.securityScore)}`}>
          {scan.securityScore}/100
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-3xl mb-1">🔴</div>
          <div className="text-2xl font-bold">{scan.summary.critical}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Critical</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl mb-1">🟠</div>
          <div className="text-2xl font-bold">{scan.summary.high}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">High</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl mb-1">🟡</div>
          <div className="text-2xl font-bold">{scan.summary.medium}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Medium</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl mb-1">🟢</div>
          <div className="text-2xl font-bold">{scan.summary.low}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Low</div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Package Scanned</span>
          <span className="font-bold font-mono">{scan.target}@{scan.version}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total Vulnerabilities</span>
          <span className="font-bold">{scan.summary.total}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-600 dark:text-gray-400">Packages Analyzed</span>
          <span className="font-bold">{scan.dependencies.length}</span>
        </div>
      </div>
    </div>

    {/* Score Calculation Modal */}
    {showScoreInfo && (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowScoreInfo(false)}
      >
        <div 
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Score Calculation</h3>
            <button
              onClick={() => setShowScoreInfo(false)}
              className="text-2xl hover:scale-110 transition-transform"
            >
              ❌
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <div className="font-bold mb-2">Base Score: 100 points</div>
              <div className="text-gray-600 dark:text-gray-400">
                Every package starts with a perfect score.
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <div className="font-bold mb-2">Deductions per vulnerability:</div>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div>🔴 <span className="font-bold">Critical:</span> -25 points</div>
                <div>🟠 <span className="font-bold">High:</span> -15 points</div>
                <div>🟡 <span className="font-bold">Medium:</span> -5 points</div>
                <div>🟢 <span className="font-bold">Low:</span> -1 point</div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <div className="font-bold mb-2">Dependency penalty:</div>
              <div className="text-gray-600 dark:text-gray-400">
                -0.5 points per dependency (encourages minimal dependencies)
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <div className="font-bold mb-2">Final score:</div>
              <div className="text-gray-600 dark:text-gray-400">
                Capped between 0-100. Lower scores = more security issues.
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
