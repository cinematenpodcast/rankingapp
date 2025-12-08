import { OMDB_API_KEY, TMDB_API_TOKEN } from '../constants';

const posterCache: Record<string, string> = {};

export const fetchPosterUrl = async (title: string, category: 'FILM' | 'SERIES'): Promise<string | null> => {
  const cacheKey = `${category}_${title}`;
  
  // Simple in-memory caching
  if (posterCache[cacheKey]) {
    return posterCache[cacheKey];
  }

  if (!OMDB_API_KEY || !TMDB_API_TOKEN) {
    if (!TMDB_API_TOKEN) console.warn("TMDB_API_TOKEN is missing in constants.ts");
    return null;
  }

  try {
    // 1. Get IMDB ID from OMDB
    // We use 't=' for exact title match and 'type=' to disambiguate (e.g. "The Bear" movie vs series)
    const omdbType = category === 'FILM' ? 'movie' : 'series';
    const omdbResponse = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}&type=${omdbType}`);
    const omdbData = await omdbResponse.json();

    let imdbId = null;

    if (omdbData.Response === "True" && omdbData.imdbID) {
      imdbId = omdbData.imdbID;
    } else {
       // Fallback: Try search 's=' if exact match fails
       const searchResponse = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(title)}&type=${omdbType}`);
       const searchData = await searchResponse.json();
       if (searchData.Search && searchData.Search.length > 0) {
         imdbId = searchData.Search[0].imdbID;
       }
    }

    if (!imdbId) {
      // console.log(`No IMDB ID found for ${title}`);
      return null;
    }

    // 2. Get Poster Path from TMDB using IMDB ID
    const tmdbUrl = `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id`;
    const tmdbResponse = await fetch(tmdbUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TMDB_API_TOKEN}`,
        'accept': 'application/json'
      }
    });

    if (!tmdbResponse.ok) {
        console.error("TMDB Error:", tmdbResponse.statusText);
        return null;
    }

    const tmdbData = await tmdbResponse.json();
    let posterPath = null;

    // Check results based on category (TMDB returns arrays)
    if (category === 'FILM' && tmdbData.movie_results?.length > 0) {
        posterPath = tmdbData.movie_results[0].poster_path;
    } else if (category === 'SERIES' && tmdbData.tv_results?.length > 0) {
        posterPath = tmdbData.tv_results[0].poster_path;
    } else {
        // Fallback: sometimes a series might be in movie_results or vice versa if metadata is messy, 
        // but strictly speaking we should trust the type. 
        // Let's try to look in the other array if the first is empty, just in case?
        // No, let's be strict to avoid wrong posters.
    }

    if (posterPath) {
      const fullUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
      posterCache[cacheKey] = fullUrl;
      return fullUrl;
    }

    return null;

  } catch (error) {
    console.error(`Error fetching poster for ${title}:`, error);
    return null;
  }
};
