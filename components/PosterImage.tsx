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
    
    // If we already have a URL (from props or previous fetch), don't fetch again unless title changes
    // But since we are not persisting to item in parent yet, we rely on cache in service or local state.
    // If item.posterUrl is present, use it.
    if (item.posterUrl) {
        setImageUrl(item.posterUrl);
        return;
    }

    const loadPoster = async () => {
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
  }, [item.title, category, item.posterUrl, onPosterLoaded, item]);

  return (
    <img 
      src={imageUrl || PLACEHOLDER_URL} 
      alt={item.title} 
      className={`object-cover ${className}`} 
      loading="lazy"
    />
  );
};
