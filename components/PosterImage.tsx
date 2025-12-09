import React, { useEffect, useState, useRef } from 'react';
import { RankItem } from '../types';
import { fetchPosterUrl } from '../services/posterService';

interface PosterImageProps {
  item: RankItem;
  className?: string;
  category: 'FILM' | 'SERIES';
  onPosterLoaded?: (item: RankItem, url: string) => void;
}

const PLACEHOLDER_URL = "/images/placeholder.jpeg";

export const PosterImage: React.FC<PosterImageProps> = ({ item, className, category, onPosterLoaded }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(item.posterUrl || null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // If we already have a URL (from props), use it and do NOT fetch.
    if (item.posterUrl) {
        setImageUrl(item.posterUrl);
        return;
    }

    const loadPoster = async () => {
        // Double check inside the async function in case it changed rapidly
        if (item.posterUrl) return;

        const url = await fetchPosterUrl(item.title, category);
        if (mountedRef.current && url) {
            setImageUrl(url);
            if (onPosterLoaded) {
                onPosterLoaded(item, url);
            }
        }
    };

    loadPoster();

    return () => {
        mountedRef.current = false;
    };
    // Removed 'item' from dependency array to prevent loop if reference changes but content is same.
    // We rely on item.title, item.posterUrl, category.
  }, [item.title, category, item.posterUrl, onPosterLoaded]);

  return (
    <img 
      src={imageUrl || PLACEHOLDER_URL} 
      alt={item.title} 
      className={`object-cover ${className}`} 
      loading="lazy"
    />
  );
};
