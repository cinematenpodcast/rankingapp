import React, { useState, useEffect, useCallback } from 'react';
import { RankItem, Category, ComparisonState } from './types';
import { INITIAL_MOVIES, INITIAL_SERIES, hydrateInitialData } from './constants';
import { RankingInterface } from './components/RankingInterface';
import { RankList } from './components/RankList';
import { StatsView } from './components/StatsView';
import { saveRankingData, loadRankingData } from './services/firebase';
import { Film, Tv, List, Trophy, ChevronDown, Award, AlertCircle } from 'lucide-react';

type ViewMode = 'RANK' | 'LIST' | 'TOP5' | 'BOTTOM5';

function App() {
  // State for Lists
  const [movieRanked, setMovieRanked] = useState<RankItem[]>([]);
  const [movieUnranked, setMovieUnranked] = useState<RankItem[]>([]);
  
  const [seriesRanked, setSeriesRanked] = useState<RankItem[]>([]);
  const [seriesUnranked, setSeriesUnranked] = useState<RankItem[]>([]);

  // Navigation State
  const [category, setCategory] = useState<Category>('FILM');
  const [view, setView] = useState<ViewMode>('RANK');
  const [loading, setLoading] = useState(true);

  // Ranking Logic State
  const [comparison, setComparison] = useState<ComparisonState>({
    isComparing: false,
    currentItem: null,
    min: 0,
    max: 0,
    compareIndex: 0
  });

  // --- Initialization ---

  useEffect(() => {
    const initData = async () => {
      // Load Movies
      const savedMovies = await loadRankingData('FILM');
      if (savedMovies) {
        setMovieRanked(savedMovies.ranked);
        setMovieUnranked(savedMovies.unranked);
      } else {
        setMovieUnranked(hydrateInitialData(INITIAL_MOVIES, 'FILM'));
      }

      // Load Series
      const savedSeries = await loadRankingData('SERIES');
      if (savedSeries) {
        setSeriesRanked(savedSeries.ranked);
        setSeriesUnranked(savedSeries.unranked);
      } else {
        setSeriesUnranked(hydrateInitialData(INITIAL_SERIES, 'SERIES'));
      }
      
      setLoading(false);
    };

    initData();
  }, []);

  // --- Persistence Helpers ---

  const persistData = (cat: Category, ranked: RankItem[], unranked: RankItem[]) => {
    saveRankingData(cat, ranked, unranked);
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

  }, [category, movieUnranked, movieRanked, seriesUnranked, seriesRanked]);


  // Effect to automatically start ranking if we are in RANK mode and nothing is active
  useEffect(() => {
    if (view === 'RANK' && !comparison.isComparing && !loading) {
      // Only start if there are items to rank
      if (currentUnranked.length > 0) {
        startNextRanking();
      }
    }
  }, [view, comparison.isComparing, loading, currentUnranked.length, startNextRanking]);


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

  // --- UI Helpers ---

  const switchCategory = (newCat: Category) => {
    setCategory(newCat);
    // Reset comparison when switching categories to avoid state mismatch
    setComparison({
      isComparing: false,
      currentItem: null,
      min: 0,
      max: 0,
      compareIndex: 0
    });
  };

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading your rankings...</div>;
  }

  // Safe getter for comparison item
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

          {/* Category Switcher */}
          <div className="flex bg-black/20 p-1 rounded-lg backdrop-blur-sm">
            <button
              onClick={() => switchCategory('FILM')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                category === 'FILM' ? 'bg-white text-movie-700 shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              <Film size={18} /> Movies
            </button>
            <button
              onClick={() => switchCategory('SERIES')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                category === 'SERIES' ? 'bg-white text-tv-700 shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              <Tv size={18} /> Series
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
        
        {view === 'RANK' && (
          <div className="animate-fade-in h-full">
             {currentUnranked.length === 0 ? (
               <div className="text-center py-20">
                 <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Award size={40} />
                 </div>
                 <h2 className="text-3xl font-bold text-gray-800 mb-2">All Caught Up!</h2>
                 <p className="text-gray-500 max-w-md mx-auto">
                   You have ranked all {currentRanked.length} {category === 'FILM' ? 'movies' : 'series'}. 
                   Check out your list or add more titles to your config.
                 </p>
                 <button 
                   onClick={() => setView('LIST')}
                   className={`mt-8 px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-transform hover:scale-105 ${category === 'FILM' ? 'bg-movie-600 hover:bg-movie-700' : 'bg-tv-600 hover:bg-tv-700'}`}
                 >
                   View My Rankings
                 </button>
               </div>
             ) : (
               <>
                 <div className="text-center mb-2 md:mb-6">
                   <p className="text-xs md:text-sm text-gray-400 uppercase tracking-widest">
                     Ranking <span className="font-bold text-gray-700">{currentRanked.length} ranked</span> / {currentUnranked.length} remaining
                   </p>
                 </div>
                 
                 {comparisonItem && (
                   <RankingInterface 
                      category={category}
                      comparison={comparison}
                      comparisonItem={comparisonItem}
                      onDecision={handleDecision}
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
          <RankList items={currentRanked} category={category} />
        )}

        {view === 'TOP5' && (
          <StatsView rankedMovies={movieRanked} rankedSeries={seriesRanked} mode="TOP" />
        )}

        {view === 'BOTTOM5' && (
          <StatsView rankedMovies={movieRanked} rankedSeries={seriesRanked} mode="BOTTOM" />
        )}

      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-center text-gray-400 text-sm">
        Cinematen Ranker &copy; {new Date().getFullYear()}
      </footer>

    </div>
  );
}

export default App;