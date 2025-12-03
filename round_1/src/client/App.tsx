import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { ContainerGrid } from './components/ContainerGrid';
import { FilterBar } from './components/FilterBar';
import { LinkyMascot } from './components/LinkyMascot';
import { Container, Stats } from './types';

function App() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [darkMode, setDarkMode] = useState(false);
  const [linkyHat, setLinkyHat] = useState('🎩');
  const [loading, setLoading] = useState(true);

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

  const filteredContainers = containers.filter((container) => {
    if (filter === 'all') return true;
    if (filter === 'signed') return container.signed;
    if (filter === 'unsigned') return !container.signed;
    return container.maxSeverity === filter;
  });

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const [containersRes, statsRes] = await Promise.all([
        fetch('/api/containers'),
        fetch('/api/containers/stats/summary'),
      ]);
      
      if (containersRes.ok && statsRes.ok) {
        setContainers(await containersRes.json());
        setStats(await statsRes.json());
      }
    } catch (error) {
      console.error('🚨 Refresh failed:', error);
    } finally {
      setLoading(false);
    }
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
        {stats && <StatsBar stats={stats} />}

        {/* Filter Bar */}
        <FilterBar 
          currentFilter={filter} 
          onFilterChange={setFilter} 
        />

        {/* Container Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="text-emoji-2xl animate-spin">🔄</span>
          </div>
        ) : (
          <ContainerGrid containers={filteredContainers} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-2xl">
        <span className="opacity-70">🐙</span>
        <span className="mx-2">💜</span>
        <span className="opacity-70">🛡️</span>
      </footer>
    </div>
  );
}

export default App;
