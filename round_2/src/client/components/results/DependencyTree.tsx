import { useState } from 'react';
import DependencyModal from './DependencyModal';

interface DependencyTreeProps {
  dependencies: any[];
  targetPackage: string;
  targetVersion: string;
}

export default function DependencyTree({ dependencies, targetPackage, targetVersion }: DependencyTreeProps) {
  const [selectedDep, setSelectedDep] = useState<any>(null);
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      case 'low': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    }
  };

  // Separate root package from dependencies
  const rootPackage = dependencies.find(d => d.name === targetPackage);
  const childDependencies = dependencies.filter(d => d.name !== targetPackage);

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>📦</span> Dependency Tree
      </h3>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Scanned {dependencies.length} package{dependencies.length !== 1 ? 's' : ''} total
      </div>

      {/* Root Package */}
      {rootPackage && (
        <div className="mb-6">
          <div className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
            🎯 TARGET PACKAGE
          </div>
          <div 
            className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border-2 border-violet-300 dark:border-violet-700 cursor-pointer hover:border-violet-500 dark:hover:border-violet-500 transition-colors"
            onClick={() => setSelectedDep(rootPackage)}
            title="Click for detailed information"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-bold text-lg">{rootPackage.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Version: <span className="font-mono font-bold">{rootPackage.version}</span>
                </div>
              </div>
              {rootPackage.vulnerabilityCount > 0 && (
                <div className={`px-3 py-1 rounded text-sm font-bold ${getSeverityBadge(rootPackage.maxSeverity)}`}>
                  {rootPackage.vulnerabilityCount} vuln{rootPackage.vulnerabilityCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            {rootPackage.vulnerabilityCount === 0 && (
              <div className="text-sm text-green-600 dark:text-green-400 font-bold">
                ✅ No vulnerabilities found
              </div>
            )}
            <div className="text-xs text-violet-600 dark:text-violet-400 mt-2">
              Click for details →
            </div>
          </div>
        </div>
      )}

      {/* Dependencies */}
      {childDependencies.length > 0 && (
        <div>
          <div className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
            📚 DEPENDENCIES ({childDependencies.length})
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {childDependencies.map((dep, idx) => (
              <div
                key={idx}
                className="p-3 bg-white dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600 hover:border-violet-400 dark:hover:border-violet-600 transition-colors cursor-pointer"
                onClick={() => setSelectedDep(dep)}
                title="Click for detailed information"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">└─</span>
                      <div className="font-bold">{dep.name}</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                      <span className="font-mono">{dep.version}</span>
                      {dep.parent && (
                        <span className="ml-2">← required by {dep.parent}</span>
                      )}
                    </div>
                  </div>
                  {dep.vulnerabilityCount > 0 ? (
                    <div className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadge(dep.maxSeverity)}`}>
                      {dep.vulnerabilityCount} vuln{dep.vulnerabilityCount !== 1 ? 's' : ''}
                    </div>
                  ) : (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      ✓ Clean
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {childDependencies.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          No dependencies found
        </div>
      )}

      {/* Modal */}
      {selectedDep && (
        <DependencyModal 
          dependency={selectedDep} 
          onClose={() => setSelectedDep(null)} 
        />
      )}
    </div>
  );
}
