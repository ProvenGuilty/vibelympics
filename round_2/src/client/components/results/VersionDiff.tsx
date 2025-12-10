import { useState, useEffect } from 'react';

interface VersionDiffProps {
  packageName: string;
  ecosystem: string;
  currentVersion: string;
  currentScan: any;
}

interface DiffData {
  version: string;
  scan: any;
  loading: boolean;
  error: string | null;
}

export default function VersionDiff({ packageName, ecosystem, currentVersion, currentScan }: VersionDiffProps) {
  const [compareVersion, setCompareVersion] = useState<string | null>(null);
  const [versions, setVersions] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<DiffData | null>(null);
  const [loadingVersions, setLoadingVersions] = useState(true);

  // Fetch available versions
  useEffect(() => {
    const fetchVersions = async () => {
      setLoadingVersions(true);
      try {
        const response = await fetch(`/api/versions/${ecosystem}/${encodeURIComponent(packageName)}`);
        if (response.ok) {
          const data = await response.json();
          setVersions(data.versions || []);
        }
      } catch (err) {
        console.error('Failed to fetch versions:', err);
      } finally {
        setLoadingVersions(false);
      }
    };
    fetchVersions();
  }, [packageName, ecosystem]);

  // Fetch comparison scan when version selected
  useEffect(() => {
    if (!compareVersion) {
      setCompareData(null);
      return;
    }

    const fetchCompareScan = async () => {
      setCompareData({ version: compareVersion, scan: null, loading: true, error: null });
      
      try {
        // Start scan for comparison version
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ecosystem, package: packageName, version: compareVersion }),
        });
        
        if (!response.ok) throw new Error('Failed to start scan');
        
        const data = await response.json();
        
        // Poll for results
        const pollScan = async () => {
          const scanResponse = await fetch(`/api/scan/${data.id}`);
          const scanData = await scanResponse.json();
          
          if (scanData.status === 'completed') {
            setCompareData({ version: compareVersion, scan: scanData, loading: false, error: null });
          } else if (scanData.status === 'error') {
            setCompareData({ version: compareVersion, scan: null, loading: false, error: scanData.error });
          } else {
            setTimeout(pollScan, 1000);
          }
        };
        
        pollScan();
      } catch (err: any) {
        setCompareData({ version: compareVersion, scan: null, loading: false, error: err.message });
      }
    };

    fetchCompareScan();
  }, [compareVersion, packageName, ecosystem]);

  const getDiffClass = (current: number, compare: number) => {
    if (compare < current) return 'text-emerald-400'; // Improved
    if (compare > current) return 'text-red-400'; // Worse
    return 'text-slate-400'; // Same
  };

  const getDiffIcon = (current: number, compare: number) => {
    if (compare < current) return '↓';
    if (compare > current) return '↑';
    return '=';
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-4 bg-slate-700/50 border-b border-slate-600">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Compare Versions</h3>
          <select
            value={compareVersion || ''}
            onChange={(e) => setCompareVersion(e.target.value || null)}
            disabled={loadingVersions}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm"
          >
            <option value="">Select version to compare...</option>
            {versions.filter(v => v !== currentVersion).slice(0, 20).map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {compareVersion && (
        <div className="p-4">
          {compareData?.loading ? (
            <div className="text-center py-8">
              <div className="animate-spin text-2xl mb-2">⟳</div>
              <div className="text-sm text-slate-400">Scanning {compareVersion}...</div>
            </div>
          ) : compareData?.error ? (
            <div className="text-center py-8 text-red-400">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-sm">{compareData.error}</div>
            </div>
          ) : compareData?.scan ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 text-center text-sm font-medium">
                <div className="text-slate-400">Metric</div>
                <div className="text-violet-400">{currentVersion}</div>
                <div className="text-cyan-400">{compareVersion}</div>
              </div>

              {/* Score */}
              <div className="grid grid-cols-3 gap-4 text-center py-3 bg-slate-700/30 rounded-lg">
                <div className="text-slate-300">Security Score</div>
                <div className="text-2xl font-bold">{currentScan.securityScore}</div>
                <div className={`text-2xl font-bold ${getDiffClass(currentScan.securityScore, compareData.scan.securityScore)}`}>
                  {compareData.scan.securityScore}
                  <span className="text-sm ml-1">
                    {getDiffIcon(currentScan.securityScore, compareData.scan.securityScore)}
                  </span>
                </div>
              </div>

              {/* Vulnerabilities */}
              <div className="grid grid-cols-3 gap-4 text-center py-2">
                <div className="text-slate-300">Total Vulns</div>
                <div className="font-mono">{currentScan.summary?.total || 0}</div>
                <div className={`font-mono ${getDiffClass(compareData.scan.summary?.total || 0, currentScan.summary?.total || 0)}`}>
                  {compareData.scan.summary?.total || 0}
                  <span className="text-xs ml-1">
                    {getDiffIcon(compareData.scan.summary?.total || 0, currentScan.summary?.total || 0)}
                  </span>
                </div>
              </div>

              {/* By severity */}
              {['critical', 'high', 'medium', 'low'].map(sev => {
                const currentCount = currentScan.summary?.[sev] || 0;
                const compareCount = compareData.scan.summary?.[sev] || 0;
                const colors: Record<string, string> = {
                  critical: 'text-red-400',
                  high: 'text-orange-400',
                  medium: 'text-amber-400',
                  low: 'text-cyan-400',
                };
                return (
                  <div key={sev} className="grid grid-cols-3 gap-4 text-center py-1">
                    <div className={colors[sev]}>{sev.charAt(0).toUpperCase() + sev.slice(1)}</div>
                    <div className="font-mono">{currentCount}</div>
                    <div className={`font-mono ${getDiffClass(compareCount, currentCount)}`}>
                      {compareCount}
                    </div>
                  </div>
                );
              })}

              {/* Dependencies */}
              <div className="grid grid-cols-3 gap-4 text-center py-2 border-t border-slate-700">
                <div className="text-slate-300">Dependencies</div>
                <div className="font-mono">{currentScan.dependencies?.length || 0}</div>
                <div className="font-mono text-slate-400">
                  {compareData.scan.dependencies?.length || 0}
                </div>
              </div>

              {/* Recommendation */}
              <div className="mt-4 p-3 rounded-lg bg-slate-700/30 text-sm">
                {compareData.scan.securityScore > currentScan.securityScore ? (
                  <div className="text-emerald-400">
                    ✓ Upgrading to {compareVersion} improves security score by {compareData.scan.securityScore - currentScan.securityScore} points
                  </div>
                ) : compareData.scan.securityScore < currentScan.securityScore ? (
                  <div className="text-amber-400">
                    ⚠ {compareVersion} has a lower security score ({currentScan.securityScore - compareData.scan.securityScore} points worse)
                  </div>
                ) : (
                  <div className="text-slate-400">
                    = Both versions have the same security score
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {!compareVersion && (
        <div className="p-8 text-center text-slate-500">
          <div className="text-3xl mb-2">⚖️</div>
          <div>Select a version above to compare security posture</div>
        </div>
      )}
    </div>
  );
}
