import { db } from './firebase/index';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import type { Product } from '@/types';

// Function to remove products that don't have corresponding images
export async function removeProductsWithoutImages() {
  try {
    console.log('Starting to remove products without corresponding images...');
    
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const productsToRemove: string[] = [];
    
    // List of products that should be removed because they don't have images
    const productsWithoutImages = [
      'Cotton Seeds - Bt Variety',
      'DAP Fertilizer - 50kg Bag',
      'Organic Compost - 25kg Bag',
      'Bordeaux Mixture - Fungicide',
      'Pyrethrum Spray - Natural Insecticide',
      'Drip Irrigation Kit - 1 Acre',
      'Tractor Mounted Cultivator',
      'Pruning Shears - Professional',
      'Soil Testing Kit',
      'Seed Drill - Manual'
    ];
    
    for (const docSnapshot of productsSnapshot.docs) {
      const product = { id: docSnapshot.id, ...docSnapshot.data() } as Product;
      
      if (productsWithoutImages.includes(product.name)) {
        productsToRemove.push(product.id);
        console.log(`Will remove product without image: ${product.name} (ID: ${product.id})`);
      }
    }
    
    // Remove the products
    for (const productId of productsToRemove) {
      await deleteDoc(doc(db, 'products', productId));
      console.log(`Removed product with ID: ${productId}`);
    }
    
    console.log(`Successfully removed ${productsToRemove.length} products without images!`);
    return { success: true, removedCount: productsToRemove.length };
  } catch (error) {
    console.error('Error removing products without images:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
