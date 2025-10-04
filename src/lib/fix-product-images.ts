import { db } from './firebase/index';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import type { Product } from '@/types';

// Function to update product image URLs with correct file extensions
export async function fixProductImages() {
  try {
    console.log('Starting to fix product image URLs...');
    
    // Get all products from the database
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const updates: { id: string; imageUrl: string }[] = [];
    
    // Define the correct image mappings based on actual files
    const imageMappings: { [key: string]: string } = {
      'Neem Oil - Organic Pesticide': '/images/products/pesticides/neem-oil.png', // Use PNG version
      'Basmati Rice Seeds - Premium Quality': '/images/products/seeds/basmati-rice-seeds.jpg',
      'Wheat Seeds - Durum Variety': '/images/products/seeds/wheat-seeds-durum.jpg',
      'Tomato Seeds - Hybrid F1': '/images/products/seeds/tomato-seeds-hybrid.jpg',
      'NPK Fertilizer 19:19:19': '/images/products/fertilizers/npk-19-19-19.jpg',
      'Urea Fertilizer - 50kg Bag': '/images/products/fertilizers/urea-fertilizer.jpg',
      'Sprayer - 16L Capacity': '/images/products/equipment/sprayer-16l.jpg',
      'Water Pump - 2HP Submersible': '/images/products/equipment/water-pump-2hp.jpg',
      'Garden Hoe - Steel Head': '/images/products/tools/garden-hoe.jpg',
      'Acrisio': '/images/products/pesticides/acrisio.jpg',
      'Blasil': '/images/products/pesticides/blasil.jpg',
      'Felujit': '/images/products/pesticides/felujit.jpg',
      'Isoprothiolane': '/images/products/pesticides/isoprothiolane.jpg',
      'Nissodium': '/images/products/pesticides/nissodium.jpg',
      'Propiconazole': '/images/products/pesticides/propiconazole.jpg',
      'Sheathmar': '/images/products/pesticides/sheathmar.jpg',
      'Tebuconazole': '/images/products/pesticides/tebuconazole.jpg',
      'Trcyycazolole': '/images/products/pesticides/trcyycazolole.jpg',
      'Validimycin': '/images/products/pesticides/validimycin.jpg'
    };
    
    // Check each product and update if needed
    for (const docSnapshot of productsSnapshot.docs) {
      const product = { id: docSnapshot.id, ...docSnapshot.data() } as Product;
      
      if (imageMappings[product.name] && product.imageUrl !== imageMappings[product.name]) {
        updates.push({
          id: product.id,
          imageUrl: imageMappings[product.name]
        });
        console.log(`Will update ${product.name}: ${product.imageUrl} -> ${imageMappings[product.name]}`);
      }
    }
    
    // Apply the updates
    for (const update of updates) {
      await updateDoc(doc(db, 'products', update.id), {
        imageUrl: update.imageUrl
      });
      console.log(`Updated product ${update.id} with new image URL: ${update.imageUrl}`);
    }
    
    console.log(`Successfully updated ${updates.length} product image URLs!`);
    return { success: true, updatedCount: updates.length };
  } catch (error) {
    console.error('Error fixing product images:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Function to remove products that don't have corresponding images
export async function removeProductsWithoutImages() {
  try {
    console.log('Checking for products without corresponding images...');
    
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
        console.log(`Will remove product without image: ${product.name}`);
      }
    }
    
    // Note: We're not actually deleting here, just logging what should be removed
    // You can manually remove these from Firestore console if needed
    console.log(`Found ${productsToRemove.length} products that should be removed (no corresponding images)`);
    
    return { success: true, productsToRemove };
  } catch (error) {
    console.error('Error checking products without images:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
