import { Container, SEVERITY_EMOJI } from '../types';

interface ContainerCardProps {
  container: Container;
  onTagClick?: (tag: string) => void;
  onDelete?: (id: string) => Promise<boolean>;
  onClick?: (container: Container) => void;
  onToggleLock?: (id: string) => void;
}

export function ContainerCard({ container, onTagClick, onDelete, onClick, onToggleLock }: ContainerCardProps) {
  // Check if this is a user-added container (can be deleted)
  const isUserAdded = container.id.startsWith('user-');
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
    <div 
      className={`card border-l-4 ${severityClass} hover:scale-105 transition-transform relative cursor-pointer`}
      onClick={() => onClick?.(container)}
    >
            
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-emoji-lg">{container.emoji}</span>
          <span className="text-emoji">{container.hat}</span>
        </div>
        <div className="flex items-center gap-1">
          {container.signed ? (
            <span className="text-emoji">✅</span>
          ) : (
            <span className="text-emoji">❌</span>
          )}
          <span className="text-emoji">{SEVERITY_EMOJI[container.maxSeverity]}</span>
        </div>
      </div>

      {/* Name & Tag */}
      <div className="mb-3">
        <div className="text-lg font-mono text-gray-700 dark:text-gray-300">
          {container.name}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate" title={container.registry}>
          {container.registry}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
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

      {/* Labels - clickable for filtering */}
      <div className="mt-2 flex flex-wrap gap-1">
        {/* Chainguard tag first if applicable */}
        {container.isChainGuard && (
          <button
            onClick={(e) => { e.stopPropagation(); onTagClick?.('chainguard'); }}
            className="text-xs px-1.5 py-0.5 rounded-full bg-chainguard-100 dark:bg-chainguard-900 text-chainguard-700 dark:text-chainguard-300 hover:bg-chainguard-200 dark:hover:bg-chainguard-800 transition-colors cursor-pointer"
          >
            🔗chainguard
          </button>
        )}
        {/* Other labels */}
        {container.labels && container.labels.filter(l => l !== 'chainguard').slice(0, 2).map((label, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); onTagClick?.(label); }}
            className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            🔗{label}
          </button>
        ))}
        {/* Lock button - prevents container from being cleared */}
        {onToggleLock && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLock(container.id); }}
            className={`text-xs px-1.5 py-0.5 rounded-full transition-colors cursor-pointer ${
              container.locked 
                ? 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-300 dark:hover:bg-yellow-800' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title={container.locked ? 'Unlock container (will be cleared with Erase All)' : 'Lock container (protected from Erase All)'}
          >
            {container.locked ? '🔒' : '🔓'}
          </button>
        )}
        {/* Delete button for all containers - styled like a pink eraser tag */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(container.id); }}
            className="text-xs px-1.5 py-0.5 rounded-full bg-pink-200 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 hover:bg-pink-300 dark:hover:bg-pink-800 transition-colors cursor-pointer"
            title="Erase this container"
          >
            ✏️erase
          </button>
        )}
      </div>
    </div>
  );
}
