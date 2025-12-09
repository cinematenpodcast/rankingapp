import React, { useState, useEffect, useRef } from 'react';
import { RankItem } from '../types';
import { PosterImage } from './PosterImage';
import { GripVertical, Trash2, Plus } from 'lucide-react';

interface RankListProps {
  items: RankItem[];
  category: 'FILM' | 'SERIES';
  onReorder?: (items: RankItem[]) => void;
  onDelete?: (id: string) => void;
  onAdd?: (title: string) => void;
  onPosterLoaded?: (item: RankItem, url: string) => void;
}

export const RankList: React.FC<RankListProps> = ({ items, category, onReorder, onDelete, onAdd, onPosterLoaded }) => {
  const isMovie = category === 'FILM';
  const accentColor = isMovie ? 'text-movie-600' : 'text-tv-600';
  const numColor = isMovie ? 'bg-movie-100 text-movie-700' : 'bg-tv-100 text-tv-700';
  const buttonColor = isMovie ? 'bg-movie-600 hover:bg-movie-700' : 'bg-tv-600 hover:bg-tv-700';

  const [listItems, setListItems] = useState(items);
  const [newTitle, setNewTitle] = useState("");
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    setListItems(items);
  }, [items]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    // e.dataTransfer.effectAllowed = "move"; 
    // Firefox requires data to be set for drag to work
    e.dataTransfer.setData("text/plain", position.toString());
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
    e.preventDefault();

    if (dragItem.current !== null && dragItem.current !== position) {
        const newList = [...listItems];
        const draggedItemContent = newList[dragItem.current];
        
        // Remove from old position
        newList.splice(dragItem.current, 1);
        // Insert at new position
        newList.splice(position, 0, draggedItemContent);
        
        // Update ref to track the item's new position
        dragItem.current = position;
        setListItems(newList);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); // Necessary for drop to work
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
    if (onReorder) {
        onReorder(listItems);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && onAdd) {
        onAdd(newTitle.trim());
        setNewTitle("");
    }
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
        if (onDelete) onDelete(id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-3">
        <h2 className={`text-2xl font-bold mb-6 ${accentColor}`}>My Ranking</h2>
      
        {/* ADD ITEM FORM */}
        {onAdd && (
            <form onSubmit={handleAddItem} className="mb-8 flex gap-2">
                <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={`Add a new ${isMovie ? 'movie' : 'series'}...`}
                    className="flex-grow p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 shadow-sm"
                    style={{ '--tw-ring-color': isMovie ? '#E50914' : '#00A8E1' } as React.CSSProperties}
                />
                <button 
                    type="submit"
                    disabled={!newTitle.trim()}
                    className={`px-6 py-3 rounded-lg text-white font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${buttonColor}`}
                >
                    <Plus size={20} /> Add
                </button>
            </form>
        )}

      {listItems.length === 0 && (
        <div className="p-10 text-center text-gray-500">
          No items ranked yet. Go to the Rank tab to start!
        </div>
      )}

      {listItems.map((item, index) => (
        <div 
          key={item.id}
          draggable={!!onReorder}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          className={`flex items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all group ${onReorder ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          {onReorder && (
            <div className="mr-3 text-gray-300 hover:text-gray-500 flex-shrink-0">
               <GripVertical size={20} />
            </div>
          )}
          
          <div className={`flex-shrink-0 w-10 h-10 ${numColor} rounded-full flex items-center justify-center font-bold text-lg mr-4 select-none`}>
            {index + 1}
          </div>
          <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden mr-4 bg-gray-200 select-none pointer-events-none">
             <PosterImage item={item} category={category} className="w-full h-full" onPosterLoaded={onPosterLoaded} />
          </div>
          <div className="flex-grow select-none">
            <h3 className="font-semibold text-lg text-gray-800">{item.title}</h3>
          </div>

          {onDelete && (
             <button 
                onClick={() => handleDeleteItem(item.id, item.title)}
                className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Delete item"
             >
                <Trash2 size={20} />
             </button>
          )}
        </div>
      ))}
    </div>
  );
};
