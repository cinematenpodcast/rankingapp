import React from 'react';
import { RankItem } from '../types';
import { PosterImage } from './PosterImage';

interface StatsViewProps {
  rankedMovies: RankItem[];
  rankedSeries: RankItem[];
  mode: 'TOP' | 'BOTTOM';
  onPosterLoaded?: (item: RankItem, url: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ rankedMovies, rankedSeries, mode, onPosterLoaded }) => {
  
  const getItems = (list: RankItem[]) => {
    if (list.length === 0) return [];
    
    // Create a copy to avoid mutating original state during sort/reverse if needed
    // logic: slice returns a shallow copy
    if (mode === 'TOP') {
      // First 5 items
      return list.slice(0, 5);
    } else {
      // Last 5 items, we want to show them effectively as the "bottom"
      // If we have 10 items, we want 6, 7, 8, 9, 10.
      // But user wants them REVERSED (last one on top)
      return list.slice(-5).reverse();
    }
  };

  const movies = getItems(rankedMovies);
  const series = getItems(rankedSeries);

  const renderList = (items: RankItem[], category: 'FILM' | 'SERIES', fullListLength: number) => {
    const isMovie = category === 'FILM';
    const colorClass = isMovie ? 'text-movie-700 bg-movie-50' : 'text-tv-700 bg-tv-50';
    const borderClass = isMovie ? 'border-movie-200' : 'border-tv-200';

    if (items.length === 0) return <p className="text-gray-400 italic text-sm">No items ranked yet.</p>;

    return (
      <div className="space-y-3">
        {items.map((item, idx) => {
          // Calculate actual rank. 
          // If TOP: rank is idx + 1.
          // If BOTTOM: we reversed the list, so the first item shown is actually the very last rank.
          const realRank = mode === 'TOP' 
            ? idx + 1 
            : fullListLength - idx;

          return (
            <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded shadow-sm border border-gray-100">
               <div className={`font-bold w-8 text-center shrink-0 ${isMovie ? 'text-movie-600' : 'text-tv-600'}`}>
                 #{realRank}
               </div>
               <div className="w-10 h-14 shrink-0 bg-gray-200 rounded overflow-hidden">
                 <PosterImage item={item} category={category} className="w-full h-full" onPosterLoaded={onPosterLoaded} />
               </div>
               <div className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                 {item.title}
               </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-8 uppercase tracking-wide text-gray-700">
        {mode === 'TOP' ? '🏆 The Gold Standard' : '📉 The Bottom Line'}
      </h2>

      <div className="flex flex-col md:flex-row gap-8">
        {/* MOVIES COLUMN */}
        <div className={`flex-1 rounded-xl p-5 border-t-4 border-movie-500 bg-movie-50/50`}>
          <h3 className="text-xl font-bold mb-4 text-movie-800 flex items-center gap-2">
            🎬 Movies <span className="text-xs font-normal opacity-60">({mode === 'TOP' ? 'Top 5' : 'Bottom 5'})</span>
          </h3>
          {renderList(movies, 'FILM', rankedMovies.length)}
        </div>

        {/* DIVIDER (Visible on Desktop) */}
        <div className="hidden md:block w-px bg-gray-300 self-stretch"></div>

        {/* SERIES COLUMN */}
        <div className={`flex-1 rounded-xl p-5 border-t-4 border-tv-500 bg-tv-50/50`}>
          <h3 className="text-xl font-bold mb-4 text-tv-800 flex items-center gap-2">
            📺 TV Series <span className="text-xs font-normal opacity-60">({mode === 'TOP' ? 'Top 5' : 'Bottom 5'})</span>
          </h3>
          {renderList(series, 'SERIES', rankedSeries.length)}
        </div>
      </div>
    </div>
  );
};
