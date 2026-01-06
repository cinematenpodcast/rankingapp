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
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

export { auth, db };

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
  if (!db) return;
  
  try {
    // Save ranked array in the main document
    const path = `users/${userId}/years/${year}/rankings`;
    await setDoc(doc(db, path, category), {
      ranked,
      lastUpdated: new Date()
    }, { merge: true });

    // Save unranked items as individual documents in subcollection
    const unrankedPath = `${path}/${category}/unranked`;
    const unrankedCollection = collection(db, unrankedPath);
    
    // Get existing unranked items
    const existingSnapshot = await getDocs(collection(db, unrankedPath));
    const existingIds = new Set(existingSnapshot.docs.map(d => d.id));
    
    // Delete items that are no longer in the unranked list
    for (const existingDoc of existingSnapshot.docs) {
      const exists = unranked.some(item => item.id === existingDoc.id);
      if (!exists) {
        await deleteDoc(doc(db, unrankedPath, existingDoc.id));
      }
    }
    
    // Add/update items in the unranked subcollection
    for (const item of unranked) {
      await setDoc(doc(db, unrankedPath, item.id), {
        id: item.id,
        title: item.title,
        category: item.category,
        posterUrl: item.posterUrl || null,
        imdbId: item.imdbId || null
      }, { merge: true });
    }
  } catch (e) {
    console.error("Error saving to Firestore", e);
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
