import { ViewMode } from '../types';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const views: { mode: ViewMode; emoji: string; title: string }[] = [
    { mode: 'grid', emoji: '🔲', title: 'Grid View' },
    { mode: 'compact', emoji: '📋', title: 'Compact List' },
    { mode: 'list', emoji: '📝', title: 'Detailed List' },
  ];

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow">
      {views.map(({ mode, emoji, title }) => (
        <button
          key={mode}
          onClick={() => onViewChange(mode)}
          className={`px-3 py-1.5 rounded-md transition-all ${
            currentView === mode
              ? 'bg-chainguard-500 text-white shadow-md'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={title}
        >
          <span className="text-lg">{emoji}</span>
        </button>
      ))}
    </div>
  );
}
