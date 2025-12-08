import React from 'react';
import { RankItem } from '../types';

interface PosterImageProps {
  item: RankItem;
  className?: string;
  category: 'FILM' | 'SERIES';
}

// User defined placeholder
const PLACEHOLDER_URL = "https://www.mockofun.com/wp-content/uploads/2019/10/movie-poster-credits-178.jpg";

export const PosterImage: React.FC<PosterImageProps> = ({ item, className, category }) => {
  return (
    <img 
      src={PLACEHOLDER_URL} 
      alt={item.title} 
      className={`object-cover ${className}`} 
      loading="lazy"
    />
  );
};