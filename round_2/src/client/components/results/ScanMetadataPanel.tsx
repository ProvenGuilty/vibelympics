interface ScanMetadataPanelProps {
  metadata: any;
}

export default function ScanMetadataPanel({ metadata }: ScanMetadataPanelProps) {
  if (!metadata) return null;

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>🔬</span> Scan Details
      </h3>

      {/* Scan Duration */}
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Total Scan Time
        </div>
        <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
          {metadata.scanDurationMs}ms
        </div>
      </div>

      {/* Tools Used */}
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          🛠️ Tools & Scanners
        </div>
        <div className="space-y-2">
          {metadata.toolsUsed.map((tool: any, idx: number) => (
            <div
              key={idx}
              className="p-3 bg-white dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold">{tool.name}</div>
                  {tool.version && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Version: {tool.version}
                    </div>
                  )}
                  <div className="text-sm mt-1">{tool.purpose}</div>
                </div>
                {tool.url && (
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Docs →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          📡 Data Sources Queried
        </div>
        <div className="space-y-2">
          {metadata.dataSourcesQueried.map((source: any, idx: number) => (
            <div
              key={idx}
              className="p-3 bg-white dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="font-bold">{source.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {source.queriesCount} queries
                </div>
              </div>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-600 dark:text-violet-400 hover:underline break-all"
              >
                {source.url}
              </a>
              {source.responseTimeMs && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Response time: {source.responseTimeMs}ms
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ecosystem Details */}
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          📦 Ecosystem Details
        </div>
        <div className="p-3 bg-white dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600 space-y-2 text-sm">
          <div>
            <span className="font-bold">Registry:</span> {metadata.ecosystemDetails.packageRegistry}
          </div>
          <div>
            <span className="font-bold">Resolver:</span> {metadata.ecosystemDetails.dependencyResolver}
          </div>
          {metadata.ecosystemDetails.manifestParsed && (
            <div>
              <span className="font-bold">Manifest:</span> {metadata.ecosystemDetails.manifestParsed}
            </div>
          )}
        </div>
      </div>

      {/* Scan Steps */}
      <div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          ⚡ Scan Pipeline
        </div>
        <div className="space-y-2">
          {metadata.scanSteps.map((step: any, idx: number) => (
            <div
              key={idx}
              className="p-3 bg-white dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {step.status === 'complete' ? '✅' : step.status === 'failed' ? '❌' : '⏭️'}
                  </span>
                  <span className="font-bold">{step.step}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {step.durationMs}ms
                </div>
              </div>
              {step.details && (
                <div className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                  {step.details}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Open Source Notice */}
      <div className="mt-6 p-4 bg-violet-50 dark:bg-violet-900/20 rounded border border-violet-200 dark:border-violet-800">
        <div className="text-sm">
          <div className="font-bold mb-2">🔓 100% Open Source</div>
          <div className="text-gray-700 dark:text-gray-300">
            All vulnerability data comes from public, open-source databases. No proprietary
            scanners. No hidden algorithms. Everything is transparent and verifiable.
          </div>
        </div>
      </div>
    </div>
  );
}
