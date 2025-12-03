import { Container, SEVERITY_EMOJI } from '../types';

interface ContainerCardProps {
  container: Container;
}

export function ContainerCard({ container }: ContainerCardProps) {
  const severityClass = `severity-${container.maxSeverity}`;
  
  // Generate star rating display
  const fullStars = Math.floor(container.rating);
  const hasHalfStar = container.rating % 1 >= 0.5;
  
  // Burrito score color
  const getBurritoColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`card border-l-4 ${severityClass} hover:scale-105 transition-transform`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-emoji-lg">{container.emoji}</span>
          <span className="text-emoji">{container.hat}</span>
        </div>
        <div className="flex items-center gap-1">
          {container.signed ? (
            <span className="text-emoji" title="Signed">✅</span>
          ) : (
            <span className="text-emoji" title="Unsigned">❌</span>
          )}
          <span className="text-emoji">{SEVERITY_EMOJI[container.maxSeverity]}</span>
        </div>
      </div>

      {/* Name & Tag */}
      <div className="mb-3">
        <div className="text-lg font-mono text-gray-700 dark:text-gray-300">
          {container.name}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <span>🏷️</span>
          <span className="font-mono">{container.tag}</span>
        </div>
      </div>

      {/* Vulnerability Counts */}
      <div className="flex justify-between mb-3 text-sm">
        <span className="flex items-center gap-1">
          <span>{SEVERITY_EMOJI.critical}</span>
          <span className="font-bold">{container.vulnCount.critical}</span>
        </span>
        <span className="flex items-center gap-1">
          <span>{SEVERITY_EMOJI.high}</span>
          <span className="font-bold">{container.vulnCount.high}</span>
        </span>
        <span className="flex items-center gap-1">
          <span>{SEVERITY_EMOJI.medium}</span>
          <span className="font-bold">{container.vulnCount.medium}</span>
        </span>
        <span className="flex items-center gap-1">
          <span>{SEVERITY_EMOJI.low}</span>
          <span className="font-bold">{container.vulnCount.low}</span>
        </span>
      </div>

      {/* Ratings */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
        {/* Star Rating */}
        <div className="flex items-center">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={`text-lg ${
                i < fullStars
                  ? 'opacity-100'
                  : i === fullStars && hasHalfStar
                  ? 'opacity-50'
                  : 'opacity-20'
              }`}
            >
              ⭐
            </span>
          ))}
        </div>

        {/* Burrito Score */}
        <div className={`flex items-center gap-1 ${getBurritoColor(container.burritoScore)}`}>
          <span className="text-emoji burrito-bounce">🌯</span>
          <span className="font-bold">{container.burritoScore}</span>
        </div>
      </div>

      {/* SBOM Info */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <span>📜</span>
        <span>{container.sbomPackages}</span>
        <span>📦</span>
      </div>
    </div>
  );
}
