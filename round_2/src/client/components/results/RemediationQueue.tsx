interface RemediationQueueProps {
  remediations: any[];
}

export default function RemediationQueue({ remediations }: RemediationQueueProps) {
  if (remediations.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Recommended Fixes</h3>
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          No fixes needed
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Recommended Fixes ({remediations.length})</h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {remediations.map((rem, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="font-bold">
                {rem.package}
              </div>
              {rem.isBreaking && (
                <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 rounded">
                  ⚠️ Breaking
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {rem.currentVersion} → {rem.targetVersion}
            </div>
            
            <div className="text-sm mb-2">
              Fixes: {rem.vulnerabilitiesFixed.length} vulnerabilities
            </div>
            
            {rem.breakingChanges && rem.breakingChanges.length > 0 && (
              <div className="mt-2 text-xs">
                <div className="font-bold mb-1">Breaking Changes:</div>
                <ul className="list-disc list-inside space-y-1">
                  {rem.breakingChanges.map((bc: any, i: number) => (
                    <li key={i}>{bc.description}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {rem.migrationGuideUrl && (
              <a
                href={rem.migrationGuideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-600 dark:text-violet-400 hover:underline mt-2 inline-block"
              >
                📚 Migration Guide →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
