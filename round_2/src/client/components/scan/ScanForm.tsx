import { useState, useEffect, useRef, useCallback } from 'react';

interface ScanFormProps {
  onScanStart: (scanId: string, isManifest?: boolean) => void;
}

// Popular packages for quick selection
const POPULAR_PACKAGES = {
  pypi: [
    'requests', 'urllib3', 'certifi', 'setuptools', 'pip',
    'django', 'flask', 'numpy', 'pandas', 'boto3',
    'ansible', 'pytest', 'sqlalchemy', 'pillow', 'cryptography'
  ],
  npm: [
    'express', 'react', 'lodash', 'axios', 'moment',
    'webpack', 'typescript', 'eslint', 'jest', 'next',
    'vue', 'angular', 'redux', 'socket.io', 'commander'
  ],
  maven: [
    'org.springframework:spring-core', 'org.apache.commons:commons-lang3',
    'com.google.guava:guava', 'org.slf4j:slf4j-api', 'junit:junit',
    'org.hibernate:hibernate-core', 'com.fasterxml.jackson.core:jackson-databind',
    'org.apache.logging.log4j:log4j-core', 'org.mockito:mockito-core'
  ],
  go: [
    'github.com/gin-gonic/gin', 'github.com/gorilla/mux',
    'github.com/stretchr/testify', 'github.com/spf13/cobra',
    'github.com/sirupsen/logrus', 'github.com/go-sql-driver/mysql',
    'github.com/lib/pq', 'github.com/golang/protobuf'
  ],
  rubygems: [
    'rails', 'rake', 'bundler', 'rspec', 'puma',
    'sinatra', 'devise', 'nokogiri', 'activerecord', 'sidekiq',
    'capistrano', 'rubocop', 'faker', 'httparty'
  ]
};

export default function ScanForm({ onScanStart }: ScanFormProps) {
  const [scanMode, setScanMode] = useState<'package' | 'file'>('package');
  const [ecosystem, setEcosystem] = useState('pypi');
  const [packageInput, setPackageInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse package input (supports "package@version" or just "package")
  const parsePackageInput = (input: string) => {
    const trimmed = input.trim();
    if (trimmed.includes('@')) {
      const parts = trimmed.split('@');
      return { package: parts[0], version: parts[1] || undefined };
    }
    return { package: trimmed, version: undefined };
  };

  // Handle file drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const content = await selectedFile.text();
      
      const response = await fetch('/api/scan/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          fileName: selectedFile.name,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Scan failed');
      }

      const data = await response.json();
      // File scans are manifest scans - show progress
      onScanStart(data.id, true);
    } catch (err: any) {
      setError(err.message || 'Failed to scan file');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (scanMode === 'file') {
      handleFileSubmit();
      return;
    }

    if (!packageInput.trim()) {
      setError('Please enter a package name');
      return;
    }

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const { package: pkg, version } = parsePackageInput(packageInput);
      
      const requestBody: any = {
        ecosystem,
        package: pkg,
      };
      
      if (version) {
        requestBody.version = version;
      }

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Scan failed');
      }

      const data = await response.json();
      // Show progress for all scans
      onScanStart(data.id, true);
    } catch (err: any) {
      setError(err.message || 'Failed to start scan');
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPackageInput(pkg);
    setTimeout(() => {
      setShowSuggestions(false);
      setSearchResults([]);
    }, 100);
  };

  // Search PyPI for packages
  const searchPyPI = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`https://pypi.org/search/?q=${encodeURIComponent(query)}`);
      const html = await response.text();
      
      // Parse package names from search results HTML
      const packageMatches = html.matchAll(/href="\/project\/([^/]+)\/"/g);
      const packages = Array.from(packageMatches)
        .map(match => match[1])
        .filter((pkg, idx, arr) => arr.indexOf(pkg) === idx) // unique
        .slice(0, 50); // limit to 50 results
      
      setSearchResults(packages);
    } catch (err) {
      console.error('PyPI search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const packageName = packageInput.split('@')[0].trim();
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (packageName.length >= 2 && showSuggestions) {
      searchTimeoutRef.current = setTimeout(() => {
        searchPyPI(packageName);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [packageInput, showSuggestions]);

  const filteredPopular = POPULAR_PACKAGES[ecosystem as keyof typeof POPULAR_PACKAGES]?.filter(
    pkg => pkg.toLowerCase().includes(packageInput.toLowerCase().split('@')[0])
  ) || [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking on a suggestion button
      if (target.closest('button[type="button"]')) {
        return;
      }
      if (inputRef.current && !inputRef.current.contains(target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6">What would you like to audit?</h2>
        
        {/* Mode Toggle */}
        <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setScanMode('package')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              scanMode === 'package'
                ? 'bg-violet-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📦 Package
          </button>
          <button
            type="button"
            onClick={() => setScanMode('file')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              scanMode === 'file'
                ? 'bg-violet-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📁 Upload File
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {scanMode === 'package' ? (
            <>
          <div>
            <label className="block text-sm font-medium mb-2">
              Ecosystem
            </label>
            <select
              value={ecosystem}
              onChange={(e) => {
                setEcosystem(e.target.value);
                setPackageInput('');
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
            >
              <option value="pypi">✅ PyPI (Python)</option>
              <option value="npm">✅ npm (JavaScript)</option>
              <option value="maven">✅ Maven (Java)</option>
              <option value="go">✅ Go Modules</option>
              <option value="rubygems">✅ RubyGems (Ruby)</option>
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-2">
              Package
            </label>
            <input
              ref={inputRef}
              type="text"
              value={packageInput}
              onChange={(e) => {
                setPackageInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="requests@2.31.0 or just requests"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono"
            />
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              💡 Format: <span className="font-mono font-bold">package@version</span> or just <span className="font-mono font-bold">package</span> for latest
              <br />
              🔍 Searches live from PyPI - shows top 50 matches. Type any package name to scan.
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {/* Popular packages when no input */}
                {packageInput.length === 0 && (
                  <>
                    <div className="p-2 text-xs font-bold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-600">
                      ⭐ POPULAR PACKAGES
                    </div>
                    {POPULAR_PACKAGES[ecosystem as keyof typeof POPULAR_PACKAGES]?.map((pkg) => (
                      <button
                        key={pkg}
                        type="button"
                        onMouseDown={(e) => handlePackageSelect(pkg, e)}
                        className="w-full text-left px-4 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 font-mono text-sm transition-colors"
                      >
                        {pkg}
                      </button>
                    ))}
                  </>
                )}

                {/* Search results when typing */}
                {packageInput.length > 0 && (
                  <>
                    {/* Show filtered popular first */}
                    {filteredPopular.length > 0 && (
                      <>
                        <div className="p-2 text-xs font-bold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-600">
                          ⭐ POPULAR
                        </div>
                        {filteredPopular.map((pkg) => (
                          <button
                            key={`popular-${pkg}`}
                            type="button"
                            onMouseDown={(e) => handlePackageSelect(pkg, e)}
                            className="w-full text-left px-4 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 font-mono text-sm transition-colors"
                          >
                            {pkg}
                          </button>
                        ))}
                      </>
                    )}

                    {/* PyPI search results */}
                    {searchResults.length > 0 && (
                      <>
                        <div className="p-2 text-xs font-bold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-600">
                          🔍 SEARCH RESULTS
                        </div>
                        {searchResults.map((pkg) => (
                          <button
                            key={`search-${pkg}`}
                            type="button"
                            onMouseDown={(e) => handlePackageSelect(pkg, e)}
                            className="w-full text-left px-4 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 font-mono text-sm transition-colors"
                          >
                            {pkg}
                          </button>
                        ))}
                      </>
                    )}

                    {/* Loading state */}
                    {searching && (
                      <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        Searching PyPI...
                      </div>
                    )}

                    {/* No results */}
                    {!searching && packageInput.length >= 2 && searchResults.length === 0 && filteredPopular.length === 0 && (
                      <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        No packages found. Type any package name and press Enter to scan.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

            </>
          ) : (
            /* File Upload Mode */
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-300 dark:border-slate-600 hover:border-violet-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".txt,.json,.mod,.xml,Gemfile"
                className="hidden"
              />
              
              {selectedFile ? (
                <div>
                  <div className="text-4xl mb-3">✅</div>
                  <div className="font-bold text-lg">{selectedFile.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="mt-3 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-3">📁</div>
                  <div className="font-bold">Drop your manifest file here</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-violet-600 hover:text-violet-700 font-medium"
                    >
                      browse files
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                    Supported: requirements.txt, package.json, go.mod, Gemfile, pom.xml
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (scanMode === 'file' && !selectedFile)}
            className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? '🔍 Scanning...' : '🔍 Scan'}
          </button>
        </form>
      </div>
    </div>
  );
}
