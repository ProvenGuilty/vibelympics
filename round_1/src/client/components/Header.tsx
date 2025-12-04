interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onRefresh: () => void;
}

export function Header({ darkMode, onToggleDarkMode, onRefresh }: HeaderProps) {
  return (
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
            {/* Refresh */}
            <button
              onClick={onRefresh}
              className="btn text-2xl hover:animate-spin"
              aria-label="Refresh"
              title="Refresh container data"
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

            {/* Info - links to README */}
            <a
              href="https://github.com/ProvenGuilty/vibelympics/blob/main/round_1/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn text-2xl"
              aria-label="View README"
              title="View project documentation"
            >
              ℹ️
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
