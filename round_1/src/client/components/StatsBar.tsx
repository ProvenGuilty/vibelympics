import { Stats, SEVERITY_EMOJI } from '../types';

interface StatsBarProps {
  stats: Stats;
}

export function StatsBar({ stats }: StatsBarProps) {
  // Convert rating to stars
  const rating = parseFloat(stats.averageRating);
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      {/* Total Containers */}
      <div className="card text-center">
        <div className="text-emoji-lg mb-2">📦</div>
        <div className="text-3xl font-bold text-gray-800 dark:text-white">
          {stats.total}
        </div>
      </div>

      {/* Signed */}
      <div className="card text-center">
        <div className="text-emoji-lg mb-2">✅</div>
        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
          {stats.signed}
        </div>
      </div>

      {/* Unsigned */}
      <div className="card text-center">
        <div className="text-emoji-lg mb-2">❌</div>
        <div className="text-3xl font-bold text-red-600 dark:text-red-400">
          {stats.unsigned}
        </div>
      </div>

      {/* Critical */}
      <div className="card text-center">
        <div className="text-emoji-lg mb-2">{SEVERITY_EMOJI.critical}</div>
        <div className="text-3xl font-bold text-red-600 dark:text-red-400">
          {stats.bySeverity.critical}
        </div>
      </div>

      {/* High */}
      <div className="card text-center">
        <div className="text-emoji-lg mb-2">{SEVERITY_EMOJI.high}</div>
        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
          {stats.bySeverity.high}
        </div>
      </div>

      {/* Average Rating */}
      <div className="card text-center">
        <div className="text-emoji-lg mb-2">
          {Array.from({ length: fullStars }, (_, i) => (
            <span key={i}>⭐</span>
          ))}
          {hasHalfStar && <span>✨</span>}
        </div>
        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
          {stats.averageRating}
        </div>
      </div>
    </div>
  );
}
