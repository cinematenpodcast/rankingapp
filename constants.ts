import { RankItem } from './types';

// Replace these with your actual keys to fetch posters
// NOTE: For a real production app, these should be in environment variables or a backend proxy.
export const OMDB_API_KEY = '4d18987b'; 
export const TMDB_API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjYTRjYWE3ZDQ2NjFlMTFkMzQ1NjFmZjUwZjkxZDBlZSIsIm5iZiI6MTczMTU3MDc2OS41NCwic3ViIjoiNjczNWFjNTFlMDU4MjNiZDljN2M0MDU2Iiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.TuUIOb_OqUxDNbbwmmH74eu5ZIzLPWSuzSC4Ujy9YFI'; // User needs to add their Bearer Token here in code or Env

export const INITIAL_MOVIES: string[] = [
  "Nosferatu", "Emilia Pérez", "Se7en", "Wolf Man", "Better Man",
  "Paddington in Peru", "Captain America: Brave New World", "Carry-On",
  "Self Reliance", "Patsers", "The Monkey", "The Gorge", "Juror #2",
  "Conclave", "Mickey 17", "Black Bag", "The Substance", "A Minecraft Movie",
  "Sinners", "Adolescence", "Thunderbolts*", "Death of a Unicorn",
  "Final Destination: Bloodlines", "Snow White", "Mission: Impossible - The Final Reckoning",
  "Ballerina", "How To Train Your Dragon", "Until Dawn", "28 Years Later",
  "F1", "Jurassic World Rebirth", "Materialists", "Superman",
  "Heads of State", "Fantastic Four: First Steps", "Weapons",
  "K-Pop: Demon Hunters", "Caught Stealing", "The Babysitter",
  "The Babysitter: Killer Queen", "Downton Abbey: The Grand Finale",
  "The Naked Gun", "One Battle After Another", "Tron: Ares",
  "Bodies Bodies Bodies", "Companion", "The Long Walk", "Predator: Badlands",
  "The Life of Chuck", "Frankenstein", "The Running Man", "The Black Phone 2"
];

export const INITIAL_SERIES: string[] = [
  "Creature Commandos", "Silo", "Shrinking", "Solo Leveling", "Skeleton Crew",
  "Severance", "Dune: Prophecy", "Doctor Who", "Ludwig", "Mythic Quest",
  "Beyond SNL", "Daredevil: Born Again", "A Thousand Blows", "De Mol",
  "The Studio", "The Real Housewives of Antwerp Reunie", "The Last of Us",
  "Pokerface", "Andor", "Ironheart", "Ginny & Georgia", "Hacks",
  "The Bear", "Alien: Earth", "Common Side Effects", "Star Trek: Strange New Worlds",
  "Peacemaker", "The Paper", "Dandadan", "Gen V", "De Verraders",
  "House of Guinness", "Welcome To Derry", "The Haunting of Hill House",
  "Pluribus", "Death by Lightning", "Stranger Things", "Chad Powers"
];

// Helper to hydrate initial lists
export const hydrateInitialData = (titles: string[], category: 'FILM' | 'SERIES'): RankItem[] => {
  return titles.map((title, index) => ({
    id: `${category}-${index}-${Date.now()}`,
    title: title.trim(),
    category,
  }));
};
