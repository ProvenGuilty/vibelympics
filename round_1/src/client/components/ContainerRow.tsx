import { Container, SEVERITY_EMOJI } from '../types';

interface ContainerRowProps {
  container: Container;
  compact?: boolean;
  onTagClick?: (tag: string) => void;
  onDelete?: (id: string) => Promise<boolean>;
  onClick?: (container: Container) => void;
  onToggleLock?: (id: string) => void;
}

export function ContainerRow({ container, compact = false, onTagClick, onDelete, onClick, onToggleLock }: ContainerRowProps) {
  const isUserAdded = container.id.startsWith('user-');
  const severityBorder = {
    critical: 'border-l-red-500',
    high: 'border-l-orange-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500',
    none: 'border-l-gray-400',
  };

  if (compact) {
    // Compact single-line view
    return (
      <div 
        className={`flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 border-l-4 ${severityBorder[container.maxSeverity]} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
        onClick={() => onClick?.(container)}
        title="Click to view vulnerability details"
      >
        {/* Emoji & Name */}
        <span className="text-xl">{container.emoji}</span>
        <div className="flex-1 truncate">
          <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{container.name}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono ml-1" title={container.registry}>({container.registry})</span>
        </div>
        
        {/* Image Tag */}
        <span className="text-xs text-gray-500 font-mono">🏷️{container.tag}</span>
        
        {/* Clickable Labels */}
        <div className="flex gap-1">
          {container.isChainGuard && (
            <button
              onClick={(e) => { e.stopPropagation(); onTagClick?.('chainguard'); }}
              className="text-xs px-1.5 py-0.5 rounded-full bg-chainguard-100 dark:bg-chainguard-900 text-chainguard-700 dark:text-chainguard-300 hover:bg-chainguard-200 dark:hover:bg-chainguard-800 transition-colors cursor-pointer"
            >
              🔗chainguard
            </button>
          )}
          {container.labels?.filter(l => l !== 'chainguard').slice(0, 1).map((label, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); onTagClick?.(label); }}
              className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              🔗{label}
            </button>
          ))}
        </div>
        
        {/* Severity counts inline */}
        <div className="flex gap-2 text-xs">
          <span>{SEVERITY_EMOJI.critical}{container.vulnCount.critical}</span>
          <span>{SEVERITY_EMOJI.high}{container.vulnCount.high}</span>
          <span>{SEVERITY_EMOJI.medium}{container.vulnCount.medium}</span>
          <span>{SEVERITY_EMOJI.low}{container.vulnCount.low}</span>
        </div>
        
        {/* Signed status */}
        <span>{container.signed ? '✅' : '❌'}</span>
        
        {/* Lock button */}
        {onToggleLock && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLock(container.id); }}
            className={`text-sm transition-colors ${container.locked ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
            title={container.locked ? 'Unlock container' : 'Lock container'}
          >
            {container.locked ? '🔒' : '🔓'}
          </button>
        )}
        
        {/* Delete button for all containers - pink eraser tag style */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(container.id); }}
            className="text-xs px-1.5 py-0.5 rounded-full bg-pink-200 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 hover:bg-pink-300 dark:hover:bg-pink-800 transition-colors"
            title="Erase this container"
          >
            ✏️erase
          </button>
        )}
      </div>
    );
  }

  // Detailed list view
  return (
    <div 
      className={`bg-white dark:bg-gray-800 border-l-4 ${severityBorder[container.maxSeverity]} p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
      onClick={() => onClick?.(container)}
      title="Click to view vulnerability details"
    >
      <div className="flex items-start gap-4">
        {/* Left: Emoji & Basic Info */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{container.emoji}</span>
          <span className="text-xl">{container.hat}</span>
        </div>
        
        {/* Middle: Name, Tag, Labels */}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-lg text-gray-700 dark:text-gray-300">{container.name}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono" title={container.registry}>{container.registry}</span>
            <span className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">🏷️{container.tag}</span>
          </div>
          
          {/* Registry */}
          <div className="text-xs text-gray-500 mt-1">
            📍 {container.registry}
          </div>
          
          {/* Clickable Labels */}
          <div className="flex flex-wrap gap-1 mt-2">
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
            {container.labels?.filter(l => l !== 'chainguard').map((label, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); onTagClick?.(label); }}
                className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                🔗{label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Right: Vulnerability counts */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-3 text-sm">
            <span className="flex items-center gap-1">
              {SEVERITY_EMOJI.critical}
              <span className="font-bold">{container.vulnCount.critical}</span>
            </span>
            <span className="flex items-center gap-1">
              {SEVERITY_EMOJI.high}
              <span className="font-bold">{container.vulnCount.high}</span>
            </span>
            <span className="flex items-center gap-1">
              {SEVERITY_EMOJI.medium}
              <span className="font-bold">{container.vulnCount.medium}</span>
            </span>
            <span className="flex items-center gap-1">
              {SEVERITY_EMOJI.low}
              <span className="font-bold">{container.vulnCount.low}</span>
            </span>
          </div>
          
          {/* Signed & Rating */}
          <div className="flex items-center gap-3 text-sm">
            <span>{container.signed ? '✅' : '❌'}</span>
            <span>⭐{container.rating.toFixed(1)}</span>
            <span>🌯{container.burritoScore}</span>
            <span className="text-xs text-gray-500">📜{container.sbomPackages}</span>
            {/* Lock button */}
            {onToggleLock && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleLock(container.id); }}
                className={`text-sm transition-colors ${container.locked ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
                title={container.locked ? 'Unlock container' : 'Lock container'}
              >
                {container.locked ? '🔒' : '🔓'}
              </button>
            )}
            {/* Delete button for all containers - pink eraser tag style */}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(container.id); }}
                className="text-xs px-1.5 py-0.5 rounded-full bg-pink-200 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 hover:bg-pink-300 dark:hover:bg-pink-800 transition-colors ml-2"
                title="Erase this container"
              >
                ✏️erase
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
