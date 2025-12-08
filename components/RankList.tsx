import React from 'react';
import { RankItem } from '../types';
import { PosterImage } from './PosterImage';

interface RankListProps {
  items: RankItem[];
  category: 'FILM' | 'SERIES';
}

export const RankList: React.FC<RankListProps> = ({ items, category }) => {
  const isMovie = category === 'FILM';
  const accentColor = isMovie ? 'text-movie-600' : 'text-tv-600';
  const numColor = isMovie ? 'bg-movie-100 text-movie-700' : 'bg-tv-100 text-tv-700';

  if (items.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        No items ranked yet. Go to the Rank tab to start!
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-3">
        <h2 className={`text-2xl font-bold mb-6 ${accentColor}`}>My Ranking</h2>
      {items.map((item, index) => (
        <div 
          key={item.id} 
          className="flex items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className={`flex-shrink-0 w-10 h-10 ${numColor} rounded-full flex items-center justify-center font-bold text-lg mr-4`}>
            {index + 1}
          </div>
          <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden mr-4 bg-gray-200">
             <PosterImage item={item} category={category} className="w-full h-full" />
          </div>
          <div className="flex-grow">
            <h3 className="font-semibold text-lg text-gray-800">{item.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};
