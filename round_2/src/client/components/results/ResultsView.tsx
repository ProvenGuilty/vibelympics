import { useState, useEffect } from 'react';
import ScoreCard from './ScoreCard';
import VulnerabilityList from './VulnerabilityList';
import RemediationQueue from './RemediationQueue';
import ScanMetadataPanel from './ScanMetadataPanel';
import DependencyTree from './DependencyTree';
import DependencyGraph from './DependencyGraph';
import DependencyModal from './DependencyModal';
import VersionSelector from './VersionSelector';

interface ResultsViewProps {
  scanId: string;
  onBack: () => void;
}

export default function ResultsView({ scanId, onBack }: ResultsViewProps) {
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [selectedDep, setSelectedDep] = useState<any>(null);

  const handleVersionChange = async (newVersion: string) => {
    if (!scan) return;
    
    setRescanning(true);
    try {
      // Start a new scan with the selected version
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ecosystem: scan.ecosystem,
          package: scan.target,
          version: newVersion,
        }),
      });

      if (!response.ok) throw new Error('Failed to start scan');
      
      const data = await response.json();
      const newScanId = data.id;
      
      // Poll for the new scan results
      const pollScan = async () => {
        const scanResponse = await fetch(`/api/scan/${newScanId}`);
        const scanData = await scanResponse.json();
        
        if (scanData.status === 'completed') {
          // The scan data IS the result when completed
          setScan(scanData);
          setRescanning(false);
        } else if (scanData.status === 'error') {
          setError(scanData.error || 'Scan failed');
          setRescanning(false);
        } else {
          setTimeout(pollScan, 1000);
        }
      };
      
      pollScan();
    } catch (err: any) {
      setError(err.message);
      setRescanning(false);
    }
  };

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const response = await fetch(`/api/scan/${scanId}`);
        if (!response.ok) throw new Error('Failed to fetch scan');
        
        const data = await response.json();
        
        if (data.status === 'completed') {
          setScan(data);
          setLoading(false);
        } else if (data.status === 'error') {
          setError(data.error || 'Scan failed');
          setLoading(false);
        } else {
          // Still processing, poll again
          setTimeout(fetchScan, 1000);
        }
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchScan();
  }, [scanId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🐆</div>
        <div className="text-xl">Scanning dependencies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-6 rounded-lg">
          <h3 className="font-bold mb-2">Scan Error</h3>
          <p>{error}</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Back to Scan
          </button>
        </div>
      </div>
    );
  }

  if (!scan) return null;

  return (
    <div className="space-y-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold">
            Scan Results: <span className="font-mono text-violet-400">{scan.target}@{scan.version}</span>
          </h2>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
          >
            ← New Scan
          </button>
        </div>

        {/* Version Selector */}
        <VersionSelector 
          packageName={scan.target}
          currentVersion={scan.version}
          ecosystem={scan.ecosystem}
          onVersionChange={handleVersionChange}
        />
      </div>

      {/* Rescanning Overlay */}
      {rescanning && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border-2 border-violet-300 dark:border-violet-700 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3 animate-spin">🔄</div>
          <div className="text-lg font-bold">Scanning new version...</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Analyzing {scan.target}@{scan.version}
          </div>
        </div>
      )}

      {!rescanning && (
        <>
          <ScoreCard scan={scan} />
          
          {/* Vulnerabilities and Fixes - TOP PRIORITY */}
          <div className="grid md:grid-cols-2 gap-8">
            <VulnerabilityList vulnerabilities={scan.vulnerabilities} />
            <RemediationQueue remediations={scan.remediations} />
          </div>
        </>
      )}
      
      {!rescanning && (
        <>
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Dependencies</h3>
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'graph'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🕸️ Graph
              </button>
            </div>
          </div>

          {/* Dependency View */}
          {viewMode === 'list' ? (
            <DependencyTree 
              dependencies={scan.dependencies} 
              targetPackage={scan.target}
              targetVersion={scan.version}
            />
          ) : (
            <DependencyGraph
              dependencies={scan.dependencies}
              targetPackage={scan.target}
              targetVersion={scan.version}
              onSelectDependency={setSelectedDep}
            />
          )}

          {/* Dependency Modal */}
          {selectedDep && (
            <DependencyModal
              dependency={selectedDep}
              onClose={() => setSelectedDep(null)}
            />
          )}
          
          {/* Scan Metadata - Technical Details */}
          {scan.scanMetadata && (
            <ScanMetadataPanel metadata={scan.scanMetadata} />
          )}
        </>
      )}
    </div>
  );
}
