import { OMDB_API_KEY, TMDB_API_TOKEN } from '../constants';

const posterCache: Record<string, string> = {};

export const fetchPosterUrl = async (title: string, category: 'FILM' | 'SERIES'): Promise<string | null> => {
  // Simple in-memory caching to save API calls during session
  if (posterCache[title]) {
    return posterCache[title];
  }

  if (!OMDB_API_KEY || !TMDB_API_TOKEN) {
    console.warn("API Keys missing in constants.ts");
    return null;
  }

  try {
    // 1. Get IMDB ID from OMDB
    const omdbResponse = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(title)}`);
    const omdbData = await omdbResponse.json();

    if (!omdbData.Search || omdbData.Search.length === 0) {
      return null;
    }

    // Try to find exact match or take first
    const imdbId = omdbData.Search[0].imdbID;

    // 2. Get Poster Path from TMDB using IMDB ID
    const tmdbUrl = `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id`;
    const tmdbResponse = await fetch(tmdbUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TMDB_API_TOKEN}`,
        'accept': 'application/json'
      }
    });

    const tmdbData = await tmdbResponse.json();

    let posterPath = null;

    if (category === 'FILM' && tmdbData.movie_results?.length > 0) {
        posterPath = tmdbData.movie_results[0].poster_path;
    } else if (category === 'SERIES' && tmdbData.tv_results?.length > 0) {
        posterPath = tmdbData.tv_results[0].poster_path;
    }

    if (posterPath) {
      const fullUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
      posterCache[title] = fullUrl;
      return fullUrl;
    }

    return null;

  } catch (error) {
    console.error(`Error fetching poster for ${title}:`, error);
    return null;
  }
};
