import { useState } from 'react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onRefresh: () => void;
}

export function Header({ darkMode, onToggleDarkMode, onRefresh }: HeaderProps) {
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <span className="text-emoji-xl linky-animate">🐙</span>
              <span className="text-emoji-lg">🛡️</span>
              <span className="text-emoji-lg">📦</span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-4">
              {/* Scoring Info */}
              <button
                onClick={() => setShowScoringInfo(true)}
                className="btn text-2xl"
                aria-label="Scoring info"
                title="How scoring works"
              >
                ℹ️
              </button>

              {/* Refresh */}
              <button
                onClick={onRefresh}
                className="btn text-2xl hover:animate-spin"
                aria-label="Refresh"
                title="Restore default containers"
              >
                🔄
              </button>

              {/* Theme Toggle */}
              <button
                onClick={onToggleDarkMode}
                className="btn text-2xl"
                aria-label="Toggle theme"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* GitHub - links to README */}
              <a
                href="https://github.com/ProvenGuilty/vibelympics/blob/main/round_1/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="btn text-2xl"
                aria-label="View on GitHub"
                title="View on GitHub"
              >
                🐱
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Scoring Info Modal */}
      {showScoringInfo && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowScoringInfo(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">📊</span>
                <span className="text-3xl">⭐</span>
                <span className="text-3xl">🌯</span>
              </div>
              <button
                onClick={() => setShowScoringInfo(false)}
                className="text-2xl hover:scale-110 transition-transform"
                title="Close"
              >
                ❌
              </button>
            </div>

            {/* Scoring Explanation */}
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              {/* Star Rating */}
              <div className="flex items-start gap-3" title="Security rating based on vulnerability severity">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="font-bold text-lg">1-5</div>
                  <div className="text-sm opacity-80">
                    <span title="Critical = 1 star">🔴 = 1⭐</span> | <span title="High = 2 stars">🟠 = 2⭐</span> | <span title="Medium = 3 stars">🟡 = 3⭐</span> | <span title="Low = 4 stars">🟢 = 4⭐</span> | <span title="None = 5 stars">⚪ = 5⭐</span>
                  </div>
                </div>
              </div>

              {/* Burrito Score */}
              <div className="flex items-start gap-3" title="Health score from 0-100 based on vulns and signing">
                <span className="text-2xl">🌯</span>
                <div>
                  <div className="font-bold text-lg">0-100</div>
                  <div className="text-sm opacity-80">
                    <span title="Signed bonus">✅ +20</span> | <span title="Critical penalty">🔴 -25</span> | <span title="High penalty">🟠 -15</span> | <span title="Medium penalty">🟡 -5</span> | <span title="Low penalty">🟢 -1</span>
                  </div>
                </div>
              </div>

              {/* Severity */}
              <div className="flex items-start gap-3" title="Maximum vulnerability severity in container">
                <span className="text-2xl">🛡️</span>
                <div>
                  <div className="font-bold text-lg flex gap-2">
                    <span title="Critical">🔴</span><span title="High">🟠</span><span title="Medium">🟡</span><span title="Low">🟢</span><span title="None">⚪</span>
                  </div>
                  <div className="text-sm opacity-80">
                    <span title="Critical = Danger">🔴 = ☠️</span> | <span title="High = Warning">🟠 = ⚠️</span> | <span title="Medium = Watch">🟡 = 👀</span> | <span title="Low = OK">🟢 = 👍</span> | <span title="None = Perfect">⚪ = ✨</span>
                  </div>
                </div>
              </div>

              {/* Signed */}
              <div className="flex items-start gap-3" title="Container image signature status">
                <span className="text-2xl">✍️</span>
                <div>
                  <div className="font-bold text-lg">✅ ❌</div>
                  <div className="text-sm opacity-80">
                    <span title="Signed = Verified & Secure">✅ = 🔒</span> | <span title="Unsigned = Unverified">❌ = 🔓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <span className="text-2xl">🐙</span>
              <span className="text-2xl">💜</span>
              <span className="text-2xl">🔗</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
