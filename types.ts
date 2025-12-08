export type Category = 'FILM' | 'SERIES';

export interface RankItem {
  id: string;
  title: string;
  posterUrl?: string; // Optional, fetched asynchronously
  imdbId?: string;
  category: Category;
}

export interface ComparisonState {
  isComparing: boolean;
  currentItem: RankItem | null;
  min: number;
  max: number;
  compareIndex: number;
}

// For stats/progress
export interface CategoryStats {
  total: number;
  ranked: number;
}
