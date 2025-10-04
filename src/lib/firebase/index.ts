
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED, doc, getDoc, writeBatch, collection } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";
import type { Product } from '@/types';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

// Function to create placeholder documents to ensure collections are visible in Firestore console
const ensureCollectionsExist = async () => {
  const collectionsToEnsure = ['orders', 'diagnosis_history', 'chat_messages', 'users', 'products', 'product_categories'];
  const batch = writeBatch(db);
  let writesMade = false;

  for (const collectionName of collectionsToEnsure) {
    const placeholderRef = doc(db, collectionName, '_placeholder_');
    try {
      const docSnap = await getDoc(placeholderRef);
      if (!docSnap.exists()) {
        batch.set(placeholderRef, {
          info: `This is a placeholder for the '${collectionName}' collection.`,
          createdAt: new Date(),
        });
        writesMade = true;
      }
    } catch (e) {
      console.error(`Error checking/creating placeholder for ${collectionName}:`, e);
    }
  }

  if (writesMade) {
    try {
      await batch.commit();
      console.log("Firestore placeholder documents created.");
    } catch (e) {
      console.error("Error committing placeholder batch:", e);
    }
  }
};

// One-time data seeding function
const seedDatabase = async () => {
    // This function is now intentionally left empty to prevent any sample data seeding.
    // The database will start clean, and only admin-added products will be present.
    // To re-enable seeding in the future, you would add logic here and likely remove
    // a one-time-run check document from Firestore.
    
    // For now, we do nothing.
    return;
};

// Client-side initialization logic
if (typeof window !== 'undefined') {
  const initializeClient = async () => {
    try {
      await enableIndexedDbPersistence(db, {cacheSizeBytes: CACHE_SIZE_UNLIMITED});
      console.log('Firestore offline persistence enabled.');
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one.
        // This is a normal scenario.
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Firestore offline persistence not supported in this browser.');
      } else {
        console.error('Error enabling Firestore offline persistence:', err);
      }
    }
    
    // These functions create placeholder documents and seed sample data
    // to ensure the app works correctly on first run.
    // They have built-in checks to prevent running more than once.
    await ensureCollectionsExist();
    await seedDatabase();
  };

  initializeClient();
}

export { app, auth, db, storage };
