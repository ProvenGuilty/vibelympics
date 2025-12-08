import { useState, useEffect } from 'react';

interface VersionSelectorProps {
  packageName: string;
  currentVersion: string;
  ecosystem: string;
  onVersionChange: (version: string) => void;
}

export default function VersionSelector({ packageName, currentVersion, ecosystem, onVersionChange }: VersionSelectorProps) {
  const [versions, setVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true);
      try {
        // Use backend proxy to avoid CORS issues
        const response = await fetch(`/api/versions/${ecosystem}/${encodeURIComponent(packageName)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch versions');
        }
        
        const data = await response.json();
        setVersions(data.versions || [currentVersion]);
      } catch (err) {
        console.error('Failed to fetch versions:', err);
        setVersions([currentVersion]);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [packageName, currentVersion, ecosystem]);

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 shadow-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Loading versions...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">Compare Versions:</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            ({versions.length} available)
          </span>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-mono text-sm flex items-center gap-2"
          >
            {currentVersion}
            <span className="text-lg">{showDropdown ? '▲' : '▼'}</span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
              <div className="p-2 border-b border-gray-200 dark:border-slate-600">
                <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  SELECT VERSION TO SCAN
                </div>
              </div>
              
              {versions.map((version) => (
                <button
                  key={version}
                  onClick={() => {
                    onVersionChange(version);
                    setShowDropdown(false);
                  }}
                  className={`
                    w-full text-left px-4 py-2 font-mono text-sm transition-colors
                    ${version === currentVersion 
                      ? 'bg-violet-100 dark:bg-violet-900/30 font-bold' 
                      : 'hover:bg-violet-50 dark:hover:bg-violet-900/20'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span>{version}</span>
                    {version === currentVersion && (
                      <span className="text-violet-600 dark:text-violet-400">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        💡 Switch versions to compare vulnerability counts and see how upgrading affects your security posture
      </div>
    </div>
  );
}
