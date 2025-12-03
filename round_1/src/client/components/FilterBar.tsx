import { SEVERITY_EMOJI } from '../types';

interface FilterBarProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
}

const filters = [
  { id: 'all', emoji: '🌐', label: 'All' },
  { id: 'signed', emoji: '✅', label: 'Signed' },
  { id: 'unsigned', emoji: '❌', label: 'Unsigned' },
  { id: 'critical', emoji: SEVERITY_EMOJI.critical, label: 'Critical' },
  { id: 'high', emoji: SEVERITY_EMOJI.high, label: 'High' },
  { id: 'medium', emoji: SEVERITY_EMOJI.medium, label: 'Medium' },
  { id: 'low', emoji: SEVERITY_EMOJI.low, label: 'Low' },
  { id: 'none', emoji: SEVERITY_EMOJI.none, label: 'None' },
];

export function FilterBar({ currentFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`
            btn text-2xl px-4 py-2 rounded-full transition-all
            ${
              currentFilter === filter.id
                ? 'bg-chainguard-600 text-white shadow-lg scale-110'
                : 'bg-white dark:bg-gray-700 hover:bg-chainguard-100 dark:hover:bg-gray-600'
            }
          `}
          aria-label={filter.label}
          aria-pressed={currentFilter === filter.id}
        >
          {filter.emoji}
        </button>
      ))}
    </div>
  );
}
