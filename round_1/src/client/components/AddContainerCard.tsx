import { useState, useRef, useEffect } from 'react';

interface AddContainerCardProps {
  onScan: (imageUrl: string) => Promise<{ error?: string; duplicate?: boolean }>;
  isScanning: boolean;
  scanError: string | null;
  compact?: boolean;
}

export function AddContainerCard({ onScan, isScanning, scanError, compact = false }: AddContainerCardProps) {
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState(false);
  const [errorType, setErrorType] = useState<'format' | 'duplicate' | 'scan' | 'registry' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show error when scanError prop changes
  useEffect(() => {
    if (scanError) {
      setError(true);
      setErrorType(scanError.includes('duplicate') ? 'duplicate' : 'scan');
      setTimeout(() => {
        setError(false);
        setErrorType(null);
      }, 2000);
    }
  }, [scanError]);

  // Validate container image URL format (single image or registry URL)
  const isValidInput = (url: string): { valid: boolean; isRegistry: boolean } => {
    const trimmed = url.trim();
    
    // Registry URL: https://hub.docker.com/u/linuxserver
    const registryUrlPattern = /^https?:\/\/(hub\.docker\.com|ghcr\.io|quay\.io|gcr\.io|gallery\.ecr\.aws)/i;
    if (registryUrlPattern.test(trimmed)) {
      return { valid: true, isRegistry: true };
    }
    
    // FQDN: registry.io/org/image:tag
    const fqdnPattern = /^[a-z0-9.-]+\.[a-z]{2,}(:[0-9]+)?\/[a-z0-9._\/-]+(:[a-z0-9._-]+)?$/i;
    // Docker Hub shorthand: org/image:tag
    const dockerHubPattern = /^[a-z0-9_-]+\/[a-z0-9._-]+(:[a-z0-9._-]+)?$/i;
    // Official images: nginx:latest or just nginx
    const officialPattern = /^[a-z0-9._-]+(:[a-z0-9._-]+)?$/i;
    
    const isImage = fqdnPattern.test(trimmed) || dockerHubPattern.test(trimmed) || officialPattern.test(trimmed);
    return { valid: isImage, isRegistry: false };
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').trim();
    
    const { valid, isRegistry } = isValidInput(pastedText);
    
    if (valid) {
      setError(false);
      setErrorType(null);
      
      if (isRegistry) {
        // Registry URL detected - show specific error (not yet implemented)
        setError(true);
        setErrorType('registry');
        setTimeout(() => {
          setError(false);
          setErrorType(null);
        }, 3000);
        return;
      }
      
      setShowInput(false);
      const result = await onScan(pastedText);
      if (result?.duplicate) {
        setError(true);
        setErrorType('duplicate');
        setTimeout(() => {
          setError(false);
          setErrorType(null);
        }, 2000);
      }
    } else {
      setError(true);
      setErrorType('format');
      setTimeout(() => {
        setError(false);
        setErrorType(null);
      }, 1000);
    }
  };

  const handleClick = () => {
    setShowInput(true);
    setError(false);
    // Focus input after state update
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleBlur = () => {
    // Hide input if empty after a short delay
    setTimeout(() => {
      if (inputRef.current && !inputRef.current.value) {
        setShowInput(false);
      }
    }, 200);
  };

  // Error emoji based on type
  const getErrorEmoji = () => {
    switch (errorType) {
      case 'duplicate': return '🔁❌'; // Already exists
      case 'format': return '❌📋'; // Bad format
      case 'scan': return '💥❌'; // Scan failed
      case 'registry': return '🏗️🚧'; // Registry browsing not yet implemented
      default: return '❌';
    }
  };

  // Error message for display
  const getErrorMessage = () => {
    switch (errorType) {
      case 'duplicate': return 'Already scanned';
      case 'format': return 'Invalid format';
      case 'scan': return 'Scan failed';
      case 'registry': return 'Registry browsing coming soon!';
      default: return 'Error';
    }
  };

  // Compact mode (for list/compact views)
  if (compact) {
    return (
      <div
        onClick={!showInput ? handleClick : undefined}
        className={`flex items-center gap-3 px-3 py-2 bg-gray-100 dark:bg-gray-800 border-l-4 
          ${error ? 'border-red-500 animate-shake' : 'border-gray-300 dark:border-gray-600'}
          hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors`}
      >
        {isScanning ? (
          <>
            <span className="animate-spin">🔄</span>
            <span className="text-gray-400">🔍📦</span>
          </>
        ) : error ? (
          <span className="text-2xl">{getErrorEmoji()}</span>
        ) : !showInput ? (
          <>
            <span className="text-xl">➕</span>
            <span className="text-gray-400">📋📦</span>
          </>
        ) : (
          <input
            ref={inputRef}
            type="text"
            className={`flex-1 px-2 py-1 bg-white dark:bg-gray-900 border rounded text-sm font-mono
              focus:outline-none focus:ring-1 focus:ring-chainguard-500
              ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            placeholder="📋 org/image:tag"
            onPaste={handlePaste}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key !== 'v' || !(e.ctrlKey || e.metaKey)) {
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  setError(true);
                  setErrorType('format');
                  setTimeout(() => { setError(false); setErrorType(null); }, 500);
                }
              }
            }}
            readOnly
          />
        )}
      </div>
    );
  }

  // Full card mode (for grid view)
  if (isScanning) {
    return (
      <div className="card border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center min-h-[200px]">
        <span className="text-emoji-2xl animate-spin">🔄</span>
        <div className="mt-3 text-2xl">🔍📦</div>
      </div>
    );
  }

  // Show big error feedback
  if (error && !showInput) {
    return (
      <div className={`card border-2 border-dashed border-red-500 bg-red-50 dark:bg-red-900/20 
        flex flex-col items-center justify-center min-h-[200px] animate-shake`}>
        <div className="text-5xl mb-2">{getErrorEmoji()}</div>
        <div className="text-2xl">
          {errorType === 'duplicate' ? '📦🔁' : errorType === 'scan' ? '💥📦' : '❌📋'}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={!showInput ? handleClick : undefined}
      className={`card border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 
        flex flex-col items-center justify-center min-h-[200px] cursor-pointer
        hover:border-chainguard-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all
        ${error ? 'animate-shake border-red-500' : ''}`}
    >
      {!showInput ? (
        <>
          {/* Plus sign */}
          <div className="text-5xl text-gray-400 dark:text-gray-500 mb-2">➕</div>
          {/* Instruction emojis: paste + container */}
          <div className="text-2xl text-gray-400 dark:text-gray-500">📋📦</div>
        </>
      ) : (
        <div className="w-full px-4">
          {/* Instruction: paste your image URL */}
          <div className="text-center mb-3 text-xl">📋➡️🔗</div>
          
          <input
            ref={inputRef}
            type="text"
            className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border-2 rounded-lg text-sm font-mono
              focus:outline-none focus:ring-2 focus:ring-chainguard-500
              ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            placeholder="📦 lscr.io/linuxserver/bazarr:latest"
            onPaste={handlePaste}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              // Only allow paste, no typing
              if (e.key !== 'v' || !(e.ctrlKey || e.metaKey)) {
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  setError(true);
                  setErrorType('format');
                  setTimeout(() => { setError(false); setErrorType(null); }, 500);
                }
              }
            }}
            readOnly
          />
          
          {/* Error hint */}
          {error && (
            <div className="text-center mt-2 text-xl">{getErrorEmoji()}</div>
          )}
          
          {/* Format hint */}
          <div className="text-center mt-2 text-xs text-gray-400">
            🏷️ registry.io/image:tag
          </div>
        </div>
      )}
    </div>
  );
}
