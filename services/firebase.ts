import * as firebaseApp from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';
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

try {
  // Use namespace import and casting to avoid TypeScript errors with some Firebase versions/configurations
  // where initializeApp is present at runtime but not correctly exposed in types.
  const app = (firebaseApp as any).initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

export const saveRankingData = async (
  category: 'FILM' | 'SERIES',
  ranked: RankItem[],
  unranked: RankItem[]
) => {
  if (!db) return;
  
  try {
    await setDoc(doc(db, "rankings", category), {
      ranked,
      unranked,
      lastUpdated: new Date()
    });
  } catch (e) {
    console.error("Error saving to Firestore", e);
  }
};

export const loadRankingData = async (category: 'FILM' | 'SERIES') => {
  if (!db) return null;

  try {
    const docRef = doc(db, "rankings", category);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as { ranked: RankItem[], unranked: RankItem[] };
    } else {
      return null;
    }
  } catch (e) {
    console.error("Error loading from Firestore", e);
    return null;
  }
};