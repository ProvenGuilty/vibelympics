import { useState } from 'react';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onBack?: () => void;
}

// Map common errors to helpful messages
function getErrorDetails(error: string): { title: string; message: string; suggestion?: string } {
  const lowerError = error.toLowerCase();
  
  if (lowerError.includes('not found') || lowerError.includes('404')) {
    return {
      title: 'Package Not Found',
      message: error,
      suggestion: 'Check the package name spelling and ecosystem. Package names are case-sensitive for some registries.',
    };
  }
  
  if (lowerError.includes('rate limit') || lowerError.includes('429')) {
    return {
      title: 'Rate Limited',
      message: 'Too many requests to the vulnerability database.',
      suggestion: 'Wait a moment and try again. The OSV API has rate limits to ensure fair usage.',
    };
  }
  
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return {
      title: 'Request Timeout',
      message: 'The scan took too long to complete.',
      suggestion: 'This can happen with packages that have many dependencies. Try again or scan a specific version.',
    };
  }
  
  if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('econnrefused')) {
    return {
      title: 'Network Error',
      message: 'Could not connect to the vulnerability database.',
      suggestion: 'Check your internet connection and try again.',
    };
  }
  
  if (lowerError.includes('invalid version') || lowerError.includes('version')) {
    return {
      title: 'Invalid Version',
      message: error,
      suggestion: 'Use a valid version format like "1.2.3" or "latest". Check the package registry for available versions.',
    };
  }
  
  if (lowerError.includes('unsupported') || lowerError.includes('ecosystem')) {
    return {
      title: 'Unsupported Ecosystem',
      message: error,
      suggestion: 'Supported ecosystems: npm, pypi, maven, go, rubygems',
    };
  }
  
  if (lowerError.includes('parse') || lowerError.includes('manifest')) {
    return {
      title: 'Parse Error',
      message: error,
      suggestion: 'Make sure the file is a valid manifest (package.json, requirements.txt, go.mod, Gemfile, or pom.xml).',
    };
  }
  
  return {
    title: 'Scan Failed',
    message: error,
    suggestion: 'If this persists, try a different package or check the server logs.',
  };
}

export default function ErrorDisplay({ error, onRetry, onBack }: ErrorDisplayProps) {
  const [retrying, setRetrying] = useState(false);
  const details = getErrorDetails(error);
  
  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 max-w-xl mx-auto">
      <div className="flex items-start gap-4">
        <div className="text-3xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-400 mb-2">{details.title}</h3>
          <p className="text-slate-300 mb-3">{details.message}</p>
          
          {details.suggestion && (
            <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-slate-400">
                <span className="text-amber-400 font-medium">💡 Tip:</span> {details.suggestion}
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            {onRetry && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 disabled:cursor-not-allowed rounded-lg font-medium flex items-center gap-2"
              >
                {retrying ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    Retrying...
                  </>
                ) : (
                  <>
                    🔄 Try Again
                  </>
                )}
              </button>
            )}
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
