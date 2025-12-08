import { useState, useEffect } from 'react';

interface DependencyModalProps {
  dependency: any;
  onClose: () => void;
}

export default function DependencyModal({ dependency, onClose }: DependencyModalProps) {
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch additional package info from PyPI
    fetch(`https://pypi.org/pypi/${dependency.name}/json`)
      .then(res => res.json())
      .then(data => {
        setPackageInfo(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dependency.name]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      case 'low': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{dependency.name}</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                v{dependency.version}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {dependency.ecosystem.toUpperCase()}
              </span>
              {dependency.parent && (
                <span className="text-gray-600 dark:text-gray-400">
                  ← Required by <span className="font-bold">{dependency.parent}</span>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Security Status */}
          <div className={`p-4 rounded-lg border-2 ${getSeverityColor(dependency.maxSeverity)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold">Security Status</div>
              {dependency.vulnerabilityCount > 0 ? (
                <div className="text-2xl">⚠️</div>
              ) : (
                <div className="text-2xl">✅</div>
              )}
            </div>
            {dependency.vulnerabilityCount > 0 ? (
              <div>
                <div className="text-xl font-bold mb-1">
                  {dependency.vulnerabilityCount} Vulnerabilit{dependency.vulnerabilityCount !== 1 ? 'ies' : 'y'} Found
                </div>
                <div className="text-sm">
                  Highest severity: <span className="font-bold uppercase">{dependency.maxSeverity}</span>
                </div>
              </div>
            ) : (
              <div className="text-lg">No known vulnerabilities</div>
            )}
          </div>

          {/* Package Info */}
          {loading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              Loading package information...
            </div>
          ) : packageInfo ? (
            <div className="space-y-4">
              {/* Description */}
              {packageInfo.info.summary && (
                <div>
                  <div className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">DESCRIPTION</div>
                  <div className="text-base">{packageInfo.info.summary}</div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Latest Version</div>
                  <div className="font-mono font-bold">{packageInfo.info.version}</div>
                </div>
                {packageInfo.info.author && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Author</div>
                    <div className="font-bold truncate">{packageInfo.info.author}</div>
                  </div>
                )}
              </div>

              {/* License */}
              {packageInfo.info.license && (
                <div>
                  <div className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">LICENSE</div>
                  <div className="font-mono text-sm bg-slate-50 dark:bg-slate-700 p-2 rounded">
                    {packageInfo.info.license}
                  </div>
                </div>
              )}

              {/* Links */}
              <div>
                <div className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">LINKS</div>
                <div className="space-y-2">
                  <a
                    href={`https://pypi.org/project/${dependency.name}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    📦 PyPI Package Page →
                  </a>
                  {packageInfo.info.home_page && (
                    <a
                      href={packageInfo.info.home_page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      🏠 Homepage →
                    </a>
                  )}
                  {packageInfo.info.project_urls?.Repository && (
                    <a
                      href={packageInfo.info.project_urls.Repository}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      💻 Source Code →
                    </a>
                  )}
                </div>
              </div>

              {/* Dependencies */}
              {packageInfo.info.requires_dist && packageInfo.info.requires_dist.length > 0 && (
                <div>
                  <div className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                    REQUIRES ({packageInfo.info.requires_dist.length})
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {packageInfo.info.requires_dist.slice(0, 10).map((dep: string, idx: number) => (
                      <div key={idx} className="text-sm font-mono bg-slate-50 dark:bg-slate-700 p-2 rounded">
                        {dep}
                      </div>
                    ))}
                    {packageInfo.info.requires_dist.length > 10 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ... and {packageInfo.info.requires_dist.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              Could not load package information
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
