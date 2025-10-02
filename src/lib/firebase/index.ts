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
    const seedCheckDocRef = doc(db, 'products', '_seed_check_');
    
    try {
        const seedCheckDocSnap = await getDoc(seedCheckDocRef);
        if (seedCheckDocSnap.exists()) {
            console.log("Sample data already exists. Skipping database seeding.");
            return;
        }

        console.log("Seeding database with sample data...");
        const batch = writeBatch(db);

        // Seed Categories
        const sampleCategories = [
            { name: 'Fertilizers' },
            { name: 'Pesticides' },
            { name: 'Seeds' },
            { name: 'Herbicides' },
            { name: 'Equipment' },
        ];
        sampleCategories.forEach(cat => {
            const catDocRef = doc(collection(db, 'product_categories'));
            batch.set(catDocRef, cat);
        });

        // Seed Products
        const sampleProducts: Product[] = [
            { id: 'TRACTOR-001', name: 'High-Efficiency Tractor', category: 'Equipment', price: 750000.00, stock: 5, imageUrl: 'https://placehold.co/600x400.png', description: 'A powerful and fuel-efficient tractor for all your farming needs. Comes with a 5-year warranty.', dataAiHint: 'tractor farming' },
            { id: 'UREA-F-01', name: 'Urea Fertilizer (46-0-0)', category: 'Fertilizers', price: 599.50, stock: 200, imageUrl: 'https://placehold.co/600x400.png', description: 'High-quality nitrogen fertilizer to boost plant growth. Ideal for a variety of crops.', dataAiHint: 'fertilizer bag' },
            { id: 'NEEM-P-01', name: 'Organic Neem Oil Pesticide', category: 'Pesticides', price: 850.00, stock: 150, imageUrl: 'https://placehold.co/600x400.png', description: 'Eco-friendly pest control solution derived from neem seeds. Effective against a wide range of insects.', dataAiHint: 'pesticide bottle' },
            { id: 'WHEAT-S-01', name: 'Certified Wheat Seeds', category: 'Seeds', price: 1200.00, stock: 500, imageUrl: 'https://placehold.co/600x400.png', description: 'High-yield, disease-resistant wheat seeds suitable for Indian climates. Pack of 10kg.', dataAiHint: 'wheat seeds' },
            { id: 'GLYPH-H-01', name: 'Glyphosate Herbicide', category: 'Herbicides', price: 750.00, stock: 100, imageUrl: 'https://placehold.co/600x400.png', description: 'A broad-spectrum systemic herbicide used to kill weeds, especially annual broadleaf weeds and grasses.', dataAiHint: 'herbicide bottle' },
            { id: 'PUMP-E-01', name: 'Manual Sprayer Pump (16L)', category: 'Equipment', price: 2500.00, stock: 50, imageUrl: 'https://placehold.co/600x400.png', description: 'Durable and easy-to-use manual sprayer for applying fertilizers, pesticides, and herbicides.', dataAiHint: 'sprayer pump' },
            { id: 'DAP-F-02', name: 'DAP Fertilizer (18-46-0)', category: 'Fertilizers', price: 1350.00, stock: 180, imageUrl: 'https://placehold.co/600x400.png', description: 'Di-ammonium Phosphate is a widely used phosphorus fertilizer, providing essential nutrients.', dataAiHint: 'fertilizer sack' },
            { id: 'RICE-S-02', name: 'Hybrid Paddy Rice Seeds', category: 'Seeds', price: 950.00, stock: 400, imageUrl: 'https://placehold.co/600x400.png', description: 'High-yielding hybrid rice seeds known for their resistance to common pests and diseases. Pack of 5kg.', dataAiHint: 'rice seeds' },
        ];
        sampleProducts.forEach(product => {
            const productDocRef = doc(db, 'products', product.id);
            const { id, ...productData } = product; // id is the document key, not part of the data
            batch.set(productDocRef, productData);
        });

        // Add the seed check document to prevent re-seeding
        batch.set(seedCheckDocRef, { seeded: true, timestamp: new Date() });

        await batch.commit();
        console.log("Database seeded successfully.");

    } catch (error) {
        console.error("Error seeding database: ", error);
    }
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
