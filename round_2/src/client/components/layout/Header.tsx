interface HeaderProps {
  onThemeToggle: () => void;
  darkMode: boolean;
}

export default function Header({ onThemeToggle, darkMode }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐆</span>
          <h1 className="text-2xl font-bold">The Weakest Lynx</h1>
        </div>
        
        <button
          onClick={onThemeToggle}
          className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
    </header>
  );
}
