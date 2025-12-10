import { useState, useEffect } from 'react';
import ScoreCard from './ScoreCard';
import VulnerabilityList from './VulnerabilityList';
import RemediationQueue from './RemediationQueue';
import DependencyTree from './DependencyTree';
import DependencyGraph from './DependencyGraph';
import DependencyModal from './DependencyModal';
import VersionSelector from './VersionSelector';

interface PackageScan {
  id: string;
  name: string;
  version: string;
  securityScore: number;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  dependencyCount: number;
  error?: string;
}

interface ManifestResultsViewProps {
  scan: any;
  onBack: () => void;
}

export default function ManifestResultsView({ scan, onBack }: ManifestResultsViewProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [packageScan, setPackageScan] = useState<any>(null);
  const [loadingPackage, setLoadingPackage] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [selectedDep, setSelectedDep] = useState<any>(null);
  const [rescanning, setRescanning] = useState(false);

  const packageScans: PackageScan[] = scan.packageScans || [];

  // Load individual package scan when selected
  useEffect(() => {
    if (!selectedPackage) {
      setPackageScan(null);
      return;
    }

    const fetchPackageScan = async () => {
      setLoadingPackage(true);
      try {
        const response = await fetch(`/api/scan/${selectedPackage}`);
        if (response.ok) {
          const data = await response.json();
          setPackageScan(data);
        }
      } catch (err) {
        console.error('Failed to fetch package scan:', err);
      } finally {
        setLoadingPackage(false);
      }
    };

    fetchPackageScan();
  }, [selectedPackage]);

  const handleVersionChange = async (newVersion: string) => {
    if (!packageScan) return;
    
    setRescanning(true);
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ecosystem: packageScan.ecosystem,
          package: packageScan.target,
          version: newVersion,
        }),
      });

      if (!response.ok) throw new Error('Failed to start scan');
      
      const data = await response.json();
      
      // Poll for results
      const pollScan = async () => {
        const scanResponse = await fetch(`/api/scan/${data.id}`);
        const scanData = await scanResponse.json();
        
        if (scanData.status === 'completed') {
          setPackageScan(scanData);
          setRescanning(false);
        } else if (scanData.status === 'error') {
          setRescanning(false);
        } else {
          setTimeout(pollScan, 1000);
        }
      };
      
      pollScan();
    } catch (err) {
      setRescanning(false);
    }
  };

  // Get severity color for package card
  const getSeverityColor = (pkg: PackageScan) => {
    if (pkg.error) return 'border-red-500 bg-red-900/20';
    if (pkg.summary.critical > 0) return 'border-red-500 bg-red-900/10';
    if (pkg.summary.high > 0) return 'border-orange-500 bg-orange-900/10';
    if (pkg.summary.medium > 0) return 'border-amber-500 bg-amber-900/10';
    if (pkg.summary.low > 0) return 'border-cyan-500 bg-cyan-900/10';
    return 'border-emerald-500 bg-emerald-900/10';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">
              Manifest Scan: <span className="font-mono text-violet-400">{scan.target}</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {packageScans.length} packages · {scan.summary.total} vulnerabilities · Score: {scan.securityScore}/100
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium flex items-center gap-2">
                📥 Export
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <a href={`/api/scan/${scan.id}/export?format=json`} download className="block px-4 py-2 hover:bg-slate-700 rounded-t-lg">📄 JSON</a>
                <a href={`/api/scan/${scan.id}/export?format=markdown`} download className="block px-4 py-2 hover:bg-slate-700">📝 Markdown</a>
                <a href={`/api/scan/${scan.id}/export?format=sarif`} download className="block px-4 py-2 hover:bg-slate-700 rounded-b-lg">🔒 SARIF</a>
              </div>
            </div>
            <button onClick={onBack} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium">
              ← New Scan
            </button>
          </div>
        </div>

        {/* Package Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedPackage(null)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              !selectedPackage
                ? 'bg-violet-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            📊 Overview
          </button>
          {packageScans.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors border-l-4 ${
                selectedPackage === pkg.id
                  ? 'bg-violet-600 text-white border-violet-400'
                  : `bg-slate-800 text-slate-300 hover:bg-slate-700 ${getSeverityColor(pkg)}`
              }`}
            >
              <span className="font-mono">{pkg.name}</span>
              {pkg.summary.total > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-red-500/20 text-red-300">
                  {pkg.summary.total}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {!selectedPackage ? (
        /* Overview - show aggregate results */
        <>
          <ScoreCard scan={scan} />
          
          <div className="grid md:grid-cols-2 gap-8">
            <VulnerabilityList vulnerabilities={scan.vulnerabilities} />
            <RemediationQueue remediations={scan.remediations} />
          </div>

          {/* Package Summary Cards */}
          <div>
            <h3 className="text-xl font-bold mb-4">Packages ({packageScans.length})</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packageScans.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`p-4 rounded-lg border-l-4 text-left transition-all hover:scale-[1.02] ${getSeverityColor(pkg)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold font-mono">{pkg.name}</div>
                      <div className="text-sm text-slate-400">{pkg.version}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{pkg.securityScore}</div>
                      <div className="text-xs text-slate-400">score</div>
                    </div>
                  </div>
                  {pkg.error ? (
                    <div className="mt-2 text-sm text-red-400">⚠ {pkg.error}</div>
                  ) : (
                    <div className="mt-2 flex gap-2 text-xs">
                      {pkg.summary.critical > 0 && <span className="px-2 py-1 rounded bg-red-500/20 text-red-300">{pkg.summary.critical}C</span>}
                      {pkg.summary.high > 0 && <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">{pkg.summary.high}H</span>}
                      {pkg.summary.medium > 0 && <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300">{pkg.summary.medium}M</span>}
                      {pkg.summary.low > 0 && <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300">{pkg.summary.low}L</span>}
                      {pkg.summary.total === 0 && <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">Clean</span>}
                      <span className="px-2 py-1 rounded bg-slate-600 text-slate-300">{pkg.dependencyCount} deps</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : loadingPackage ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 animate-pulse">📦</div>
          <div className="text-xl">Loading package details...</div>
        </div>
      ) : packageScan ? (
        /* Individual Package View - full scan results with version selector */
        <>
          {/* Version Selector */}
          <VersionSelector
            packageName={packageScan.target}
            currentVersion={packageScan.version}
            ecosystem={packageScan.ecosystem}
            onVersionChange={handleVersionChange}
          />

          {rescanning ? (
            <div className="bg-violet-900/20 border-2 border-violet-700 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3 animate-spin">🔄</div>
              <div className="text-lg font-bold">Scanning new version...</div>
            </div>
          ) : (
            <>
              <ScoreCard scan={packageScan} />
              
              <div className="grid md:grid-cols-2 gap-8">
                <VulnerabilityList vulnerabilities={packageScan.vulnerabilities} />
                <RemediationQueue remediations={packageScan.remediations} />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Dependencies</h3>
                <div className="flex bg-slate-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📋 List
                  </button>
                  <button
                    onClick={() => setViewMode('graph')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'graph' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🕸️ Graph
                  </button>
                </div>
              </div>

              {viewMode === 'list' ? (
                <DependencyTree
                  dependencies={packageScan.dependencies}
                  targetPackage={packageScan.target}
                  targetVersion={packageScan.version}
                />
              ) : (
                <DependencyGraph
                  dependencies={packageScan.dependencies}
                  targetPackage={packageScan.target}
                  targetVersion={packageScan.version}
                  onSelectDependency={setSelectedDep}
                />
              )}
            </>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-slate-400">
          Failed to load package details
        </div>
      )}

      {/* Dependency Modal */}
      {selectedDep && (
        <DependencyModal dependency={selectedDep} onClose={() => setSelectedDep(null)} />
      )}
    </div>
  );
}
