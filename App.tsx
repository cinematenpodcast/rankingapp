import React, { useState, useEffect, useCallback } from 'react';
import { RankItem, Category, ComparisonState } from './types';
import { INITIAL_MOVIES, INITIAL_SERIES, hydrateInitialData } from './constants';
import { RankingInterface } from './components/RankingInterface';
import { RankList } from './components/RankList';
import { StatsView } from './components/StatsView';
import { saveRankingData, loadRankingData } from './services/firebase';
import { Film, Tv, List, Trophy, ChevronDown, Award, AlertCircle, Plus, Settings, Calendar } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { UserSettings } from './components/UserSettings';

type ViewMode = 'RANK' | 'LIST' | 'TOP5' | 'BOTTOM5';

function AppContent() {
  const { user, loading: authLoading } = useAuth();

  // State for Lists
  const [movieRanked, setMovieRanked] = useState<RankItem[]>([]);
  const [movieUnranked, setMovieUnranked] = useState<RankItem[]>([]);
  
  const [seriesRanked, setSeriesRanked] = useState<RankItem[]>([]);
  const [seriesUnranked, setSeriesUnranked] = useState<RankItem[]>([]);

  // Navigation State
  const [category, setCategory] = useState<Category>('FILM');
  const [view, setView] = useState<ViewMode>('RANK');
  const [dataLoading, setDataLoading] = useState(true);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Ranking Logic State
  const [comparison, setComparison] = useState<ComparisonState>({
    isComparing: false,
    currentItem: null,
    min: 0,
    max: 0,
    compareIndex: 0
  });

  // --- Initialization ---

  const loadData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);

    // Load Movies
    const savedMovies = await loadRankingData(user.uid, selectedYear, 'FILM');
    if (savedMovies) {
      setMovieRanked(savedMovies.ranked);
      setMovieUnranked(savedMovies.unranked);
    } else {
      // For 2026, we start with an EMPTY list, as titles will be added manually or via automation.
      // We only hydrate default data for other years (like 2025 during migration) if needed,
      // but here we just clear the state for a fresh start if no data exists.
      setMovieRanked([]);
      setMovieUnranked([]);
    }

    // Load Series
    const savedSeries = await loadRankingData(user.uid, selectedYear, 'SERIES');
    if (savedSeries) {
      setSeriesRanked(savedSeries.ranked);
      setSeriesUnranked(savedSeries.unranked);
    } else {
      // Same for Series: start empty if no data found
      setSeriesRanked([]);
      setSeriesUnranked([]);
    }
    
    setDataLoading(false);
  }, [user, selectedYear]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [loadData, user]); // Run when user changes or loadData changes (which includes selectedYear)

  // --- Persistence Helpers ---

  const persistData = async (cat: Category, ranked: RankItem[], unranked: RankItem[]) => {
    if (!user) {
      console.warn("Cannot persist data: no user logged in");
      return;
    }
    
    try {
      console.log(`Persisting ${cat} data: ${ranked.length} ranked, ${unranked.length} unranked`);
      await saveRankingData(user.uid, selectedYear, cat, ranked, unranked);
      console.log(`✓ Successfully persisted ${cat} data`);
    } catch (error) {
      console.error(`✗ Failed to persist ${cat} data:`, error);
      // Optionally show user notification here
    }
  };

  const handleResetData = (cat: Category) => {
    if (!user) return;
    
    // Clear state
    if (cat === 'FILM') {
        setMovieRanked([]);
        setMovieUnranked([]);
    } else {
        setSeriesRanked([]);
        setSeriesUnranked([]);
    }
    
    // Clear comparison
    if (category === cat) {
        setComparison({
            isComparing: false,
            currentItem: null,
            min: 0,
            max: 0,
            compareIndex: 0
        });
    }

    // Persist empty lists
    saveRankingData(user.uid, selectedYear, cat, [], []);
  };

  // --- Getters based on current category ---
  
  const currentRanked = category === 'FILM' ? movieRanked : seriesRanked;
  const currentUnranked = category === 'FILM' ? movieUnranked : seriesUnranked;

  // --- Ranking Algorithm Logic ---

  const startNextRanking = useCallback(() => {
    const unrankedList = category === 'FILM' ? movieUnranked : seriesUnranked;
    const rankedList = category === 'FILM' ? movieRanked : seriesRanked;

    if (unrankedList.length === 0) {
      setComparison({
        isComparing: false,
        currentItem: null,
        min: 0,
        max: 0,
        compareIndex: 0
      });
      return;
    }

    const itemToRank = unrankedList[0];

    // Initialize Binary Search
    
    // EDGE CASE: If ranked list is empty, we cannot compare. 
    // Simply move the first item to the ranked list.
    if (rankedList.length === 0) {
      const newRanked = [itemToRank];
      const newUnranked = unrankedList.slice(1);
      
      if (category === 'FILM') {
        setMovieRanked(newRanked);
        setMovieUnranked(newUnranked);
        persistData('FILM', newRanked, newUnranked);
      } else {
        setSeriesRanked(newRanked);
        setSeriesUnranked(newUnranked);
        persistData('SERIES', newRanked, newUnranked);
      }
      return; // Done for this cycle, effect will trigger again for next item
    }

    // Normal Start: Compare against the middle
    const min = 0;
    const max = rankedList.length;
    const compareIndex = Math.floor((min + max) / 2);

    setComparison({
      isComparing: true,
      currentItem: itemToRank,
      min,
      max,
      compareIndex
    });

  }, [category, movieUnranked, movieRanked, seriesUnranked, seriesRanked, persistData]);


  // Effect to automatically start ranking if we are in RANK mode and nothing is active
  useEffect(() => {
    if (view === 'RANK' && !comparison.isComparing && !dataLoading && user) {
      // Only start if there are items to rank
      if (currentUnranked.length > 0) {
        startNextRanking();
      }
    }
  }, [view, comparison.isComparing, dataLoading, currentUnranked.length, startNextRanking, user]);


  const handleDecision = (isBetter: boolean) => {
    if (!comparison.currentItem) return;

    let { min, max } = comparison;
    const { compareIndex } = comparison;

    // Binary Search Logic
    if (isBetter) {
      max = compareIndex;
    } else {
      min = compareIndex + 1;
    }

    // Check for termination
    if (min === max) {
      // We found the spot! Insert at 'min'.
      const itemToInsert = comparison.currentItem;
      
      // Update Lists
      let newRanked: RankItem[];
      let newUnranked: RankItem[];

      if (category === 'FILM') {
        newRanked = [...movieRanked];
        newRanked.splice(min, 0, itemToInsert);
        newUnranked = movieUnranked.slice(1); // Remove head
        
        setMovieRanked(newRanked);
        setMovieUnranked(newUnranked);
        persistData('FILM', newRanked, newUnranked);
      } else {
        newRanked = [...seriesRanked];
        newRanked.splice(min, 0, itemToInsert);
        newUnranked = seriesUnranked.slice(1); // Remove head
        
        setSeriesRanked(newRanked);
        setSeriesUnranked(newUnranked);
        persistData('SERIES', newRanked, newUnranked);
      }

      // Reset Comparison to trigger next item
      setComparison({
        isComparing: false,
        currentItem: null,
        min: 0,
        max: 0,
        compareIndex: 0
      });

    } else {
      // Continue searching
      const newCompareIndex = Math.floor((min + max) / 2);
      setComparison(prev => ({
        ...prev,
        min,
        max,
        compareIndex: newCompareIndex
      }));
    }
  };

  const handleRemoveFromRanking = (itemToRemove: RankItem) => {
    // Case 1: Removing the NEW item being ranked
    if (comparison.currentItem && comparison.currentItem.id === itemToRemove.id) {
        if (category === 'FILM') {
            const newUnranked = movieUnranked.filter(i => i.id !== itemToRemove.id);
            setMovieUnranked(newUnranked);
            persistData('FILM', movieRanked, newUnranked);
        } else {
            const newUnranked = seriesUnranked.filter(i => i.id !== itemToRemove.id);
            setSeriesUnranked(newUnranked);
            persistData('SERIES', seriesRanked, newUnranked);
        }
        
        // Reset comparison to trigger next
        setComparison({
            isComparing: false,
            currentItem: null,
            min: 0,
            max: 0,
            compareIndex: 0
        });
        return;
    }

    // Case 2: Removing an existing ranked item (the comparison item)
    if (category === 'FILM') {
        const newRanked = movieRanked.filter(item => item.id !== itemToRemove.id);
        setMovieRanked(newRanked);
        persistData('FILM', newRanked, movieUnranked);
    } else {
        const newRanked = seriesRanked.filter(item => item.id !== itemToRemove.id);
        setSeriesRanked(newRanked);
        persistData('SERIES', newRanked, seriesUnranked);
    }

    // Reset comparison because indices are invalid now
    setComparison({
        isComparing: false,
        currentItem: null,
        min: 0,
        max: 0,
        compareIndex: 0
    });
  };

  // --- UI Helpers ---

  const handleReorder = (newItems: RankItem[]) => {
    if (category === 'FILM') {
      setMovieRanked(newItems);
      persistData('FILM', newItems, movieUnranked);
    } else {
      setSeriesRanked(newItems);
      persistData('SERIES', newItems, seriesUnranked);
    }
  };

  const handleDelete = (id: string) => {
    if (category === 'FILM') {
      const newRanked = movieRanked.filter(item => item.id !== id);
      setMovieRanked(newRanked);
      persistData('FILM', newRanked, movieUnranked);
    } else {
      const newRanked = seriesRanked.filter(item => item.id !== id);
      setSeriesRanked(newRanked);
      persistData('SERIES', newRanked, seriesUnranked);
    }
  };

  const handleAdd = (title: string) => {
    console.log(`[handleAdd] Adding ${category}: "${title}"`);
    
    const newItem: RankItem = {
      id: `${category}-${Date.now()}`,
      title: title,
      category: category
    };

    if (category === 'FILM') {
      const newUnranked = [...movieUnranked, newItem];
      console.log(`[handleAdd] New FILM unranked list length: ${newUnranked.length}`);
      setMovieUnranked(newUnranked);
      persistData('FILM', movieRanked, newUnranked);
    } else {
      const newUnranked = [...seriesUnranked, newItem];
      console.log(`[handleAdd] New SERIES unranked list length: ${newUnranked.length}`);
      setSeriesUnranked(newUnranked);
      persistData('SERIES', seriesRanked, newUnranked);
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickAddTitle.trim()) {
      handleAdd(quickAddTitle.trim());
      setQuickAddTitle("");
    }
  };

  const handlePosterLoaded = useCallback((item: RankItem, url: string) => {
      const updateList = (list: RankItem[]) => {
          const idx = list.findIndex(i => i.id === item.id);
          if (idx === -1) return null;
          if (list[idx].posterUrl === url) return null;
          
          const newList = [...list];
          newList[idx] = { ...newList[idx], posterUrl: url };
          return newList;
      };

      if (item.category === 'FILM') {
          let newRanked = updateList(movieRanked);
          if (newRanked) {
             setMovieRanked(newRanked);
             persistData('FILM', newRanked, movieUnranked);
             return;
          }
          let newUnranked = updateList(movieUnranked);
          if (newUnranked) {
              setMovieUnranked(newUnranked);
              persistData('FILM', movieRanked, newUnranked);
              return;
          }
      } else {
          let newRanked = updateList(seriesRanked);
          if (newRanked) {
             setSeriesRanked(newRanked);
             persistData('SERIES', newRanked, seriesUnranked);
             return;
          }
          let newUnranked = updateList(seriesUnranked);
          if (newUnranked) {
              setSeriesUnranked(newUnranked);
              persistData('SERIES', seriesRanked, newUnranked);
              return;
          }
      }
  }, [movieRanked, movieUnranked, seriesRanked, seriesUnranked, persistData]);

  const switchCategory = (newCat: Category) => {
    setCategory(newCat);
    setComparison({
      isComparing: false,
      currentItem: null,
      min: 0,
      max: 0,
      compareIndex: 0
    });
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Auth...</div>;
  if (!user) return <Login />;

  const themeClass = category === 'FILM' ? 'from-movie-600 to-movie-800' : 'from-tv-600 to-tv-800';
  const buttonActiveMovie = 'bg-movie-100 text-movie-700 border-movie-300';
  const buttonActiveTv = 'bg-tv-100 text-tv-700 border-tv-300';
  const buttonInactive = 'text-gray-500 hover:bg-gray-100 border-transparent';

  const getNavClass = (targetView: ViewMode) => {
    const isActive = view === targetView;
    if (!isActive) return buttonInactive;
    return category === 'FILM' ? buttonActiveMovie : buttonActiveTv;
  };

  const progress = currentRanked.length + currentUnranked.length > 0 
    ? Math.round((currentRanked.length / (currentRanked.length + currentUnranked.length)) * 100)
    : 100;

  if (dataLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading your rankings...</div>;
  }

  const comparisonItem = currentRanked.length > 0 && comparison.compareIndex < currentRanked.length 
    ? currentRanked[comparison.compareIndex] 
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className={`bg-gradient-to-r ${themeClass} text-white shadow-lg transition-colors duration-500`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <img 
              src="https://www.cinematen.be/images/LogoCleanSmaller.png" 
              alt="Cinematen Logo" 
              className="h-10 w-auto object-contain"
            />
            <h1 className="text-2xl font-bold tracking-tight">Cinematen Ranker</h1>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Year Selector */}
            <div className="flex bg-black/20 p-1 rounded-lg backdrop-blur-sm">
                <button
                    onClick={() => setSelectedYear(2025)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${selectedYear === 2025 ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                >
                    2025
                </button>
                <button
                    onClick={() => setSelectedYear(2026)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${selectedYear === 2026 ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                >
                    2026
                </button>
            </div>

            {/* Category Switcher */}
            <div className="flex bg-black/20 p-1 rounded-lg backdrop-blur-sm">
                <button
                onClick={() => switchCategory('FILM')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    category === 'FILM' ? 'bg-white text-movie-700 shadow-sm' : 'text-white/70 hover:text-white'
                }`}
                >
                <Film size={16} /> <span className="hidden sm:inline">Movies</span>
                </button>
                <button
                onClick={() => switchCategory('SERIES')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    category === 'SERIES' ? 'bg-white text-tv-700 shadow-sm' : 'text-white/70 hover:text-white'
                }`}
                >
                <Tv size={16} /> <span className="hidden sm:inline">Series</span>
                </button>
            </div>

            <button 
              onClick={() => setShowSettings(true)}
              className="bg-black/20 p-2 rounded-lg hover:bg-black/30 text-white/80 hover:text-white transition-all"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-black/10 h-1.5">
          <div 
            className="h-full bg-white/90 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex overflow-x-auto no-scrollbar">
          <button onClick={() => setView('RANK')} className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium whitespace-nowrap transition-colors ${getNavClass('RANK')}`}>
            <AlertCircle size={18} /> Rank
            <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{currentUnranked.length}</span>
          </button>
          <button onClick={() => setView('LIST')} className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium whitespace-nowrap transition-colors ${getNavClass('LIST')}`}>
            <List size={18} /> Full List
             <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{currentRanked.length}</span>
          </button>
          <button onClick={() => setView('TOP5')} className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium whitespace-nowrap transition-colors ${getNavClass('TOP5')}`}>
            <Trophy size={18} /> Top 5
          </button>
          <button onClick={() => setView('BOTTOM5')} className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium whitespace-nowrap transition-colors ${getNavClass('BOTTOM5')}`}>
            <ChevronDown size={18} /> Bottom 5
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow p-4 md:p-6 container mx-auto max-w-5xl">
        
        {/* Year Indicator */}
        <div className="mb-4 text-center">
             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                 selectedYear === 2026 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
             }`}>
                <Calendar size={12} /> {selectedYear} List
             </span>
        </div>

        {view === 'RANK' && (
          <div className="animate-fade-in h-full">
             {currentUnranked.length === 0 ? (
               <div className="text-center py-20">
                 <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Award size={40} />
                 </div>
                 <h2 className="text-3xl font-bold text-gray-800 mb-2">All Caught Up for {selectedYear}!</h2>
                 <p className="text-gray-500 max-w-md mx-auto mb-8">
                   You have ranked all {currentRanked.length} {category === 'FILM' ? 'movies' : 'series'}. 
                   Check out your list or add more titles.
                 </p>

                 <div className="max-w-md mx-auto mb-10">
                    <form onSubmit={handleQuickAdd} className="flex gap-2 relative z-10">
                        <input 
                            type="text" 
                            value={quickAddTitle}
                            onChange={(e) => setQuickAddTitle(e.target.value)}
                            placeholder={`Add another ${category === 'FILM' ? 'movie' : 'series'}...`}
                            className="flex-grow p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 shadow-sm"
                            style={{ '--tw-ring-color': category === 'FILM' ? '#E50914' : '#00A8E1' } as React.CSSProperties}
                        />
                        <button 
                            type="submit"
                            disabled={!quickAddTitle.trim()}
                            className={`px-4 py-3 rounded-lg text-white font-bold shadow-md transition-colors disabled:opacity-50 flex items-center gap-2 ${category === 'FILM' ? 'bg-movie-600 hover:bg-movie-700' : 'bg-tv-600 hover:bg-tv-700'}`}
                        >
                            <Plus size={20} /> Rank It
                        </button>
                    </form>
                 </div>

                 <button 
                   onClick={() => setView('LIST')}
                   className={`mt-8 px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-transform hover:scale-105 ${category === 'FILM' ? 'bg-movie-600 hover:bg-movie-700' : 'bg-tv-600 hover:bg-tv-700'}`}
                 >
                   View My Rankings
                 </button>
               </div>
             ) : (
               <>
                 {comparisonItem && (
                   <RankingInterface 
                      category={category}
                      comparison={comparison}
                      comparisonItem={comparisonItem}
                      onDecision={handleDecision}
                      onPosterLoaded={handlePosterLoaded}
                      onRemove={handleRemoveFromRanking}
                   />
                 )}
                 {!comparisonItem && currentRanked.length > 0 && (
                    <div className="text-center p-10">Preparing next comparison...</div>
                 )}
               </>
             )}
          </div>
        )}

        {view === 'LIST' && (
          <RankList 
            items={currentRanked} 
            category={category} 
            onReorder={handleReorder} 
            onDelete={handleDelete}
            onAdd={handleAdd}
            onPosterLoaded={handlePosterLoaded}
          />
        )}

        {view === 'TOP5' && (
          <StatsView rankedMovies={movieRanked} rankedSeries={seriesRanked} mode="TOP" onPosterLoaded={handlePosterLoaded} />
        )}

        {view === 'BOTTOM5' && (
          <StatsView rankedMovies={movieRanked} rankedSeries={seriesRanked} mode="BOTTOM" onPosterLoaded={handlePosterLoaded} />
        )}

      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-center text-gray-400 text-sm">
        Cinematen Ranker &copy; {new Date().getFullYear()}
      </footer>

      {showSettings && (
        <UserSettings 
            onClose={() => setShowSettings(false)} 
            selectedYear={selectedYear}
            onReset={handleResetData}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
