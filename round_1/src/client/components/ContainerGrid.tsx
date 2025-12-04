import { Container, ViewMode } from '../types';
import { ContainerCard } from './ContainerCard';
import { ContainerRow } from './ContainerRow';
import { AddContainerCard } from './AddContainerCard';

interface ContainerGridProps {
  containers: Container[];
  onScanContainer: (imageUrl: string) => Promise<{ error?: string; duplicate?: boolean }>;
  isScanning: boolean;
  viewMode: ViewMode;
  scanError: string | null;
  onTagClick?: (tag: string) => void;
  onDeleteContainer?: (id: string) => Promise<boolean>;
  onContainerClick?: (container: Container) => void;
}

export function ContainerGrid({ containers, onScanContainer, isScanning, viewMode, scanError, onTagClick, onDeleteContainer, onContainerClick }: ContainerGridProps) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {containers.map((container) => (
          <ContainerCard key={container.id} container={container} onTagClick={onTagClick} onDelete={onDeleteContainer} onClick={onContainerClick} />
        ))}
        {/* Add Container Card - always at the end */}
        <AddContainerCard onScan={onScanContainer} isScanning={isScanning} scanError={scanError} />
      </div>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div className="space-y-1">
        {containers.map((container) => (
          <ContainerRow key={container.id} container={container} compact onTagClick={onTagClick} onDelete={onDeleteContainer} onClick={onContainerClick} />
        ))}
        {/* Add Container - compact inline version */}
        <AddContainerCard onScan={onScanContainer} isScanning={isScanning} scanError={scanError} compact />
      </div>
    );
  }

  // List view (detailed)
  return (
    <div className="space-y-2">
      {containers.map((container) => (
        <ContainerRow key={container.id} container={container} onTagClick={onTagClick} onDelete={onDeleteContainer} onClick={onContainerClick} />
      ))}
      {/* Add Container - list inline version */}
      <AddContainerCard onScan={onScanContainer} isScanning={isScanning} scanError={scanError} compact />
    </div>
  );
}
