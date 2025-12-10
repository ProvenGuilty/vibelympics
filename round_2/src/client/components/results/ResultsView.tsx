import { useState, useEffect, useCallback } from 'react';
import ScoreCard from './ScoreCard';
import VulnerabilityList from './VulnerabilityList';
import RemediationQueue from './RemediationQueue';
import ScanMetadataPanel from './ScanMetadataPanel';
import DependencyTree from './DependencyTree';
import VersionSelector from './VersionSelector';
import ManifestResultsView from './ManifestResultsView';
import { ResultsPageSkeleton } from '../ui/Skeleton';
import ErrorDisplay from '../ui/ErrorDisplay';

interface ResultsViewProps {
  scanId: string;
  onBack: () => void;
}

export default function ResultsView({ scanId, onBack }: ResultsViewProps) {
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);
  const [scanningVersion, setScanningVersion] = useState<string | null>(null);

  const handleVersionChange = async (newVersion: string) => {
    if (!scan) return;
    
    setRescanning(true);
    setScanningVersion(newVersion);
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
          setScanningVersion(null);
        } else if (scanData.status === 'error') {
          setError(scanData.error || 'Scan failed');
          setRescanning(false);
          setScanningVersion(null);
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

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    // Re-trigger the useEffect by forcing a re-render
    window.location.reload();
  }, []);

  if (loading) {
    return <ResultsPageSkeleton />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={handleRetry}
        onBack={onBack}
      />
    );
  }

  if (!scan) return null;

  // Use ManifestResultsView for manifest/file scans
  if (scan.isManifestScan) {
    return <ManifestResultsView scan={scan} onBack={onBack} />;
  }

  return (
    <div className="space-y-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold">
            Scan Results: <span className="font-mono text-violet-400">{scan.target}@{scan.version}</span>
          </h2>
          <div className="flex items-center gap-2">
            {/* Export Dropdown */}
            <div className="relative group">
              <button
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium flex items-center gap-2"
              >
                📥 Export
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <a
                  href={`/api/scan/${scan.id}/export?format=json`}
                  download={`scan-${scan.id}.json`}
                  className="block px-4 py-2 hover:bg-slate-700 rounded-t-lg"
                >
                  📄 JSON
                </a>
                <a
                  href={`/api/scan/${scan.id}/export?format=markdown`}
                  download={`scan-${scan.id}.md`}
                  className="block px-4 py-2 hover:bg-slate-700"
                >
                  📝 Markdown
                </a>
                <a
                  href={`/api/scan/${scan.id}/export?format=sarif`}
                  download={`scan-${scan.id}.sarif.json`}
                  className="block px-4 py-2 hover:bg-slate-700 rounded-b-lg"
                >
                  🔒 SARIF (GitHub)
                </a>
              </div>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
            >
              ← New Scan
            </button>
          </div>
        </div>

        {/* Version Selector - only show for package scans, not file scans */}
        {scan.version !== 'file' && scan.version !== 'manifest' && (
          <VersionSelector 
            packageName={scan.target}
            currentVersion={scanningVersion || scan.version}
            ecosystem={scan.ecosystem}
            onVersionChange={handleVersionChange}
          />
        )}
      </div>

      {/* Rescanning Overlay */}
      {rescanning && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border-2 border-violet-300 dark:border-violet-700 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3 animate-spin">🔄</div>
          <div className="text-lg font-bold">Scanning {scan.target}@{scanningVersion}...</div>
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
          {/* Dependencies */}
          <DependencyTree 
            dependencies={scan.dependencies} 
            targetPackage={scan.target}
            targetVersion={scan.version}
          />
          
          {/* Scan Metadata - Technical Details */}
          {scan.scanMetadata && (
            <ScanMetadataPanel metadata={scan.scanMetadata} />
          )}
        </>
      )}
    </div>
  );
}
