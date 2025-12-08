import React from 'react';
import { RankItem, ComparisonState } from '../types';
import { PosterImage } from './PosterImage';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface RankingInterfaceProps {
  category: 'FILM' | 'SERIES';
  comparison: ComparisonState;
  comparisonItem: RankItem | null;
  onDecision: (better: boolean) => void;
}

export const RankingInterface: React.FC<RankingInterfaceProps> = ({ 
  category, 
  comparison, 
  comparisonItem, 
  onDecision 
}) => {
  // Defensive check
  if (!comparison.currentItem || !comparisonItem) return null;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto h-full justify-center py-2 md:py-8">
      
      {/* CARDS CONTAINER: Fixed Aspect Ratio for Posters */}
      <div className="flex flex-row items-center justify-center gap-3 md:gap-12 w-full mb-4">
        
        {/* NEW ITEM CARD */}
        <div className="flex-1 max-w-[45%] md:max-w-[280px] bg-white rounded-lg md:rounded-xl shadow-md md:shadow-lg border-2 border-yellow-400 overflow-hidden relative flex flex-col">
          <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-sm rounded-bl-lg z-10">
            NEW
          </div>
          {/* Image Container - Enforce Aspect Ratio 2/3 */}
          <div className="w-full aspect-[2/3] bg-gray-100 relative">
             <PosterImage item={comparison.currentItem} category={category} className="absolute inset-0 w-full h-full" />
          </div>
          {/* Title Container - Increased height and font size */}
          <div className="h-16 md:h-24 p-2 text-center bg-gray-50 flex items-center justify-center border-t border-gray-100 shrink-0">
            <h3 className="font-bold text-sm md:text-xl leading-tight line-clamp-2 w-full">{comparison.currentItem.title}</h3>
          </div>
        </div>

        {/* VS Badge (Desktop Only) */}
        <div className="hidden md:flex flex-col justify-center items-center shrink-0">
          <div className="bg-gray-800 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl shadow-lg z-20">
            VS
          </div>
        </div>

        {/* COMPARISON ITEM CARD */}
        <div className="flex-1 max-w-[45%] md:max-w-[280px] bg-white rounded-lg md:rounded-xl shadow-md md:shadow-lg border border-gray-200 overflow-hidden relative flex flex-col">
           <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 font-bold px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-sm rounded-bl-lg z-10 md:hidden">
            #{comparison.compareIndex + 1}
          </div>
          {/* Image Container - Enforce Aspect Ratio 2/3 */}
          <div className="w-full aspect-[2/3] bg-gray-100 relative">
             <PosterImage item={comparisonItem} category={category} className="absolute inset-0 w-full h-full opacity-90" />
          </div>
          {/* Title Container - Increased height and font size */}
          <div className="h-16 md:h-24 p-2 text-center bg-gray-50 flex items-center justify-center border-t border-gray-100 shrink-0">
             <div className="w-full">
                <span className="hidden md:block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rank #{comparison.compareIndex + 1}</span>
                <h3 className="font-bold text-sm md:text-xl text-gray-700 leading-tight line-clamp-2">{comparisonItem.title}</h3>
             </div>
          </div>
        </div>
      </div>

      {/* ACTION AREA */}
      <div className="w-full shrink-0 px-1 mt-auto">
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center">
            
            {/* Question Text - Always Visible */}
            <h3 className="text-sm md:text-xl font-medium mb-3 md:mb-6 text-gray-800 text-center leading-snug">
                Is <span className="font-bold text-black">{comparison.currentItem.title}</span> better than <span className="font-bold text-black">{comparisonItem.title}</span>?
            </h3>
            
            <div className="flex w-full gap-3 md:gap-6 max-w-lg">
                 <button
                    onClick={() => onDecision(false)}
                    className="flex-1 flex flex-row items-center justify-center p-3 md:p-5 rounded-lg md:rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-all duration-200 group gap-2"
                 >
                    <ThumbsDown className="w-5 h-5 md:w-6 md:h-6 text-red-600 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-red-800 text-sm md:text-lg">NO</span>
                    </div>
                 </button>

                 <button
                    onClick={() => onDecision(true)}
                    className="flex-1 flex flex-row items-center justify-center p-3 md:p-5 rounded-lg md:rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 active:bg-green-200 transition-all duration-200 group gap-2"
                 >
                    <ThumbsUp className="w-5 h-5 md:w-6 md:h-6 text-green-600 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start">
                         <span className="font-bold text-green-800 text-sm md:text-lg">YES</span>
                    </div>
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};