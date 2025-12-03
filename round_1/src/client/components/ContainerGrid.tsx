import { Container } from '../types';
import { ContainerCard } from './ContainerCard';

interface ContainerGridProps {
  containers: Container[];
}

export function ContainerGrid({ containers }: ContainerGridProps) {
  if (containers.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="text-emoji-2xl">🔍</span>
        <p className="text-4xl mt-4">❓📦</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {containers.map((container) => (
        <ContainerCard key={container.id} container={container} />
      ))}
    </div>
  );
}
