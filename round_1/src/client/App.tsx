import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { ContainerGrid } from './components/ContainerGrid';
import { FilterBar } from './components/FilterBar';
import { LinkyMascot } from './components/LinkyMascot';
import { ViewToggle } from './components/ViewToggle';
import { VulnerabilityModal } from './components/VulnerabilityModal';
import { Container, Stats, ViewMode } from './types';

function App() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [darkMode, setDarkMode] = useState(true);
  const [linkyHat, setLinkyHat] = useState(() => {
    // Random hat on initial load
    const hats = ['🎩', '🧢', '👒', '🎓', '🤠', '⛑️', '👑', '🎭', '🪖', '🎪', '🃏'];
    return hats[Math.floor(Math.random() * hats.length)];
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [scanError, setScanError] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  useEffect(() => {
    // Apply dark mode class
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Fetch containers and stats
    const fetchData = async () => {
      try {
        const [containersRes, statsRes] = await Promise.all([
          fetch('/api/containers'),
          fetch('/api/containers/stats/summary'),
        ]);
        
        if (containersRes.ok && statsRes.ok) {
          const containersData = await containersRes.json();
          const statsData = await statsRes.json();
          setContainers(containersData);
          setStats(statsData);
        }
      } catch (error) {
        console.error('🚨 Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredContainers = containers.filter((container: Container) => {
    // Severity/signed filter
    let passesFilter = true;
    if (filter === 'all') passesFilter = true;
    else if (filter === 'signed') passesFilter = container.signed;
    else if (filter === 'unsigned') passesFilter = !container.signed;
    else passesFilter = container.maxSeverity === filter;
    
    // Tag filter
    let passesTagFilter = true;
    if (tagFilter) {
      if (tagFilter === 'chainguard') {
        passesTagFilter = container.isChainGuard;
      } else {
        passesTagFilter = container.labels?.includes(tagFilter) || false;
      }
    }
    
    return passesFilter && passesTagFilter;
  });

  // Compute stats from filtered containers so summary reflects current view
  const filteredStats = useMemo((): Stats | null => {
    const signed = filteredContainers.filter(c => c.signed).length;
    const bySeverity = {
      critical: filteredContainers.filter(c => c.maxSeverity === 'critical').length,
      high: filteredContainers.filter(c => c.maxSeverity === 'high').length,
      medium: filteredContainers.filter(c => c.maxSeverity === 'medium').length,
      low: filteredContainers.filter(c => c.maxSeverity === 'low').length,
      none: filteredContainers.filter(c => c.maxSeverity === 'none').length,
    };
    const avgRating = filteredContainers.length > 0
      ? filteredContainers.reduce((sum, c) => sum + c.rating, 0) / filteredContainers.length
      : 0;
    
    return {
      total: filteredContainers.length,
      signed,
      unsigned: filteredContainers.length - signed,
      bySeverity,
      averageRating: avgRating.toFixed(1),
    };
  }, [filteredContainers]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Reset to defaults first, then fetch
      await fetch('/api/containers/reset', { method: 'POST' });
      
      const [containersRes, statsRes] = await Promise.all([
        fetch('/api/containers'),
        fetch('/api/containers/stats/summary'),
      ]);
      
      if (containersRes.ok && statsRes.ok) {
        setContainers(await containersRes.json());
        setStats(await statsRes.json());
      }
      
      // Clear any active filters
      setFilter('all');
      setTagFilter(null);
    } catch (error) {
      console.error('🚨 Refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanContainer = async (imageUrl: string): Promise<{ error?: string; duplicate?: boolean }> => {
    setScanning(true);
    setScanError(null);
    try {
      const response = await fetch('/api/containers/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Check if it was a duplicate (returned existing container)
        const isDuplicate = containers.some(c => c.id === data.id);
        if (isDuplicate) {
          setScanError('duplicate');
          return { duplicate: true };
        }
        // Add the new container to the list (don't reset to defaults!)
        setContainers(prev => [...prev, data]);
        return {};
      } else {
        const errorText = await response.text();
        console.error('🚨 Scan failed:', errorText);
        setScanError('scan');
        return { error: errorText };
      }
    } catch (error) {
      console.error('🚨 Scan error:', error);
      setScanError('scan');
      return { error: 'Network error' };
    } finally {
      setScanning(false);
    }
  };

  const handleTagClick = (tag: string) => {
    // Toggle tag filter
    if (tagFilter === tag) {
      setTagFilter(null);
    } else {
      setTagFilter(tag);
    }
  };

  const handleDeleteContainer = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/containers/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok || response.status === 404) {
        // Remove the container from local state
        // Also remove if 404 - container may have been cleared by "Erase All" but kept in UI due to lock
        setContainers(prev => prev.filter(c => c.id !== id));
        return true;
      } else {
        const data = await response.json();
        console.error('🚨 Delete failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('🚨 Delete error:', error);
      return false;
    }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await fetch('/api/containers', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Keep only locked containers
        setContainers(prev => prev.filter(c => c.locked));
      }
    } catch (error) {
      console.error('🚨 Delete all error:', error);
    }
  };

  const handleToggleLock = (id: string) => {
    setContainers(prev => prev.map(c => 
      c.id === id ? { ...c, locked: !c.locked } : c
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-chainguard-50 to-purple-100 dark:from-gray-900 dark:to-chainguard-900 transition-colors duration-300">
      <Header 
        darkMode={darkMode} 
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onRefresh={handleRefresh}
      />
      
      <main className="container mx-auto px-4 py-6">
        {/* Linky Mascot */}
        <div className="flex justify-center mb-6">
          <LinkyMascot hat={linkyHat} onHatChange={setLinkyHat} />
        </div>

        {/* Stats Bar */}
        {filteredStats && <StatsBar stats={filteredStats} />}

        {/* Filter Bar + View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <FilterBar 
              currentFilter={filter} 
              onFilterChange={setFilter} 
            />
            {/* Tag filter indicator */}
            {tagFilter && (
              <button
                onClick={() => setTagFilter(null)}
                className="flex items-center gap-1 px-2 py-1 bg-chainguard-100 dark:bg-chainguard-900 text-chainguard-700 dark:text-chainguard-300 rounded-full text-sm hover:bg-chainguard-200 dark:hover:bg-chainguard-800 transition-colors"
              >
                🔗{tagFilter} ❌
              </button>
            )}
            {/* Delete All button - Pink eraser style matching tags */}
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1 px-2 py-1 bg-pink-200 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 rounded-full text-sm hover:bg-pink-300 dark:hover:bg-pink-800 transition-colors"
              title="Erase ALL containers and start fresh"
            >
              ✏️erase all
            </button>
          </div>
          <ViewToggle 
            currentView={viewMode} 
            onViewChange={setViewMode} 
          />
        </div>

        {/* Container Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="text-emoji-2xl animate-spin">🔄</span>
          </div>
        ) : (
          <ContainerGrid 
            containers={filteredContainers} 
            onScanContainer={handleScanContainer}
            isScanning={scanning}
            viewMode={viewMode}
            scanError={scanError}
            onTagClick={handleTagClick}
            onDeleteContainer={handleDeleteContainer}
            onContainerClick={setSelectedContainer}
            onToggleLock={handleToggleLock}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-2xl">
        <span className="opacity-70">🐙</span>
        <span className="mx-2">💜</span>
        <span className="opacity-70">🛡️</span>
      </footer>

      {/* Vulnerability Modal */}
      {selectedContainer && (
        <VulnerabilityModal 
          container={selectedContainer} 
          onClose={() => setSelectedContainer(null)} 
        />
      )}
    </div>
  );
}

export default App;
