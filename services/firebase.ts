import * as firebaseApp from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { RankItem } from '../types';

// Configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyDzhXSivBTgCNLvhmge5LpI9q0TaDC-05s",
  authDomain: "cinematenrankingapp.firebaseapp.com",
  databaseURL: "https://cinematenrankingapp-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cinematenrankingapp",
  storageBucket: "cinematenrankingapp.firebasestorage.app",
  messagingSenderId: "186578044336",
  appId: "1:186578044336:web:960326a525f4ea75e2c275"
};

let db: any = null;
let auth: any = null;

try {
  // Use namespace import and casting to avoid TypeScript errors with some Firebase versions/configurations
  const app = (firebaseApp as any).initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.log("✓ Firebase initialized successfully");
} catch (e) {
  console.error("✗ Firebase initialization failed:", e);
}

export { auth, db };

/**
 * Helper function to clean RankItem objects for Firestore (remove undefined values)
 */
const cleanRankItem = (item: RankItem): any => {
  const cleaned: any = {
    id: item.id,
    title: item.title,
    category: item.category
  };
  
  // Only add optional fields if they have actual values (not undefined)
  if (item.posterUrl !== undefined && item.posterUrl !== null) {
    cleaned.posterUrl = item.posterUrl;
  }
  if (item.imdbId !== undefined && item.imdbId !== null) {
    cleaned.imdbId = item.imdbId;
  }
  
  return cleaned;
};

/**
 * Save ranking data (ranked stays in document, unranked is now a subcollection)
 */
export const saveRankingData = async (
  userId: string,
  year: number,
  category: 'FILM' | 'SERIES',
  ranked: RankItem[],
  unranked: RankItem[]
) => {
  if (!db) {
    console.error("Firestore database not initialized - cannot save data");
    throw new Error("Database not initialized");
  }
  
  console.log(`[saveRankingData] Starting save for ${category}, user: ${userId}, year: ${year}`);
  console.log(`[saveRankingData] Ranked: ${ranked.length} items, Unranked: ${unranked.length} items`);
  
  try {
    // Save ranked array in the main document
    // Clean all items to remove undefined values (Firestore doesn't accept undefined)
    const cleanedRanked = ranked.map(item => cleanRankItem(item));
    
    const path = `users/${userId}/years/${year}/rankings`;
    await setDoc(doc(db, path, category), {
      ranked: cleanedRanked,
      lastUpdated: new Date()
    }, { merge: true });

    // Save unranked items as individual documents in subcollection
    const unrankedPath = `${path}/${category}/unranked`;
    
    try {
      // Get existing unranked items
      const existingSnapshot = await getDocs(collection(db, unrankedPath));
      
      // Delete items that are no longer in the unranked list
      for (const existingDoc of existingSnapshot.docs) {
        const exists = unranked.some(item => item.id === existingDoc.id);
        if (!exists) {
          await deleteDoc(doc(db, unrankedPath, existingDoc.id));
        }
      }
      
      // Add/update items in the unranked subcollection
      for (const item of unranked) {
        if (!item.id || !item.title) {
          console.warn(`Skipping invalid item:`, item);
          continue;
        }
        
        // Clean the item to remove undefined values
        const docData = cleanRankItem(item);
        
        await setDoc(doc(db, unrankedPath, item.id), docData, { merge: true });
      }
      
      console.log(`✓ Saved ${unranked.length} unranked items for ${category} (year ${year}, user ${userId})`);
    } catch (unrankedError) {
      console.error(`Error saving unranked items for ${category} (path: ${unrankedPath}):`, unrankedError);
      throw unrankedError; // Re-throw to be caught by outer catch
    }
  } catch (e) {
    console.error(`Error saving ranking data for ${category} (year ${year}, user ${userId}):`, e);
    throw e; // Re-throw so calling code knows it failed
  }
};

/**
 * Load ranking data (ranked from document, unranked from subcollection)
 */
export const loadRankingData = async (
  userId: string, 
  year: number,
  category: 'FILM' | 'SERIES'
) => {
  if (!db) {
    console.error("Firestore database not initialized");
    return { ranked: [], unranked: [] };
  }

  try {
    const path = `users/${userId}/years/${year}/rankings`;
    const docRef = doc(db, path, category);
    const docSnap = await getDoc(docRef);

    let ranked: RankItem[] = [];
    if (docSnap.exists()) {
      ranked = (docSnap.data().ranked || []) as RankItem[];
    }

    // Load unranked items from subcollection
    const unrankedPath = `${path}/${category}/unranked`;
    let unranked: RankItem[] = [];
    
    try {
      const unrankedCollection = collection(db, unrankedPath);
      // Try with orderBy first, but fallback to simple query if it fails
      let unrankedSnapshot;
      try {
        unrankedSnapshot = await getDocs(query(unrankedCollection, orderBy('title')));
      } catch (orderByError) {
        // If orderBy fails (e.g., no index), just get all docs without ordering
        console.warn(`orderBy('title') failed for ${category}, using simple query:`, orderByError);
        unrankedSnapshot = await getDocs(unrankedCollection);
      }
      
      unranked = unrankedSnapshot.docs.map(doc => {
        const data = doc.data();
        if (!data.title) {
          console.warn(`Document ${doc.id} in ${unrankedPath} has no title field`);
          return null;
        }
        return {
          id: data.id || doc.id,
          title: data.title,
          category: data.category || category,
          posterUrl: data.posterUrl || undefined,
          imdbId: data.imdbId || undefined
        } as RankItem;
      }).filter(item => item !== null) as RankItem[];
      
      // Sort manually if orderBy failed
      unranked.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      
      console.log(`Loaded ${unranked.length} unranked items for ${category} (year ${year}, user ${userId})`);
    } catch (unrankedError) {
      // If subcollection doesn't exist or query fails, return empty array
      console.warn(`Failed to load unranked items for ${category} (path: ${unrankedPath}):`, unrankedError);
      unranked = [];
    }

    return { ranked, unranked };
  } catch (e) {
    console.error(`Error loading ranking data for ${category} (year ${year}, user ${userId}):`, e);
    // Always return an object, never null
    return { ranked: [], unranked: [] };
  }
};

/**
 * Add a single unranked item (for API/automation use)
 */
export const addUnrankedItem = async (
  userId: string,
  year: number,
  category: 'FILM' | 'SERIES',
  itemId: string,
  title: string
) => {
  if (!db) return false;

  try {
    const unrankedPath = `users/${userId}/years/${year}/rankings/${category}/unranked`;
    await setDoc(doc(db, unrankedPath, itemId), {
      id: itemId,
      title: title,
      category: category
    }, { merge: true });
    return true;
  } catch (e) {
    console.error("Error adding unranked item", e);
    return false;
  }
};

/**
 * MIGRATION HELPER
 * Moves the old root-level rankings to the user's 2025 list.
 */
export const migrateGlobalDataToUser = async (userId: string) => {
  if (!db) return false;

  try {
    // 1. Read global FILM
    const filmSnap = await getDoc(doc(db, "rankings", "FILM"));
    if (filmSnap.exists()) {
      const data = filmSnap.data();
      await saveRankingData(userId, 2025, 'FILM', data.ranked || [], data.unranked || []);
    }

    // 2. Read global SERIES
    const seriesSnap = await getDoc(doc(db, "rankings", "SERIES"));
    if (seriesSnap.exists()) {
      const data = seriesSnap.data();
      await saveRankingData(userId, 2025, 'SERIES', data.ranked || [], data.unranked || []);
    }
    
    return true;
  } catch (e) {
    console.error("Migration failed:", e);
    return false;
  }
};
