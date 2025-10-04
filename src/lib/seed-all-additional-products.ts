import { db } from './firebase/index';
import { collection, addDoc } from 'firebase/firestore';
import type { Product } from '@/types';

// Additional products based on all the images you've added
const additionalProducts: Omit<Product, 'id'>[] = [
  // Additional Seeds (if any new ones)
  // Note: basmati-rice-seeds.jpg, tomato-seeds-hybrid.jpg, wheat-seeds-durum.jpg already exist
  
  // Additional Fertilizers (if any new ones)
  // Note: npk-19-19-19.jpg, urea-fertilizer.jpg already exist
  
  // Additional Pesticides (already added in previous script)
  // Note: All pesticide images have been added
  
  // Additional Equipment
  // Note: sprayer-16l.jpg, water-pump-2hp.jpg already exist
  
  // Additional Tools
  // Note: garden-hoe.jpg already exists
  
  // If you have any other images that need products, add them here
];

export async function seedAllAdditionalProducts() {
  try {
    console.log('Starting to seed all additional products...');
    
    if (additionalProducts.length === 0) {
      console.log('No additional products to add. All images already have corresponding products.');
      return { success: true };
    }
    
    // Add the new products
    for (const product of additionalProducts) {
      const docRef = await addDoc(collection(db, 'products'), product);
      console.log(`Added product: ${product.name} with ID: ${docRef.id}`);
    }
    
    console.log(`Successfully seeded ${additionalProducts.length} additional products!`);
    return { success: true };
  } catch (error) {
    console.error('Error seeding additional products:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Function to check what products are missing based on images
export function getMissingProducts(): string[] {
  const allImages = [
    // Seeds
    'basmati-rice-seeds.jpg',
    'tomato-seeds-hybrid.jpg', 
    'wheat-seeds-durum.jpg',
    
    // Fertilizers
    'npk-19-19-19.jpg',
    'urea-fertilizer.jpg',
    
    // Pesticides
    'acrisio.jpg',
    'blasil.jpg',
    'felujit.jpg',
    'isoprothiolane.jpg',
    'neem-oil.jpg',
    'neem-oil.png',
    'nissodium.jpg',
    'propiconazole.jpg',
    'sheathmar.jpg',
    'tebuconazole.jpg',
    'trcyycazolole.jpg',
    'validimycin.jpg',
    
    // Equipment
    'sprayer-16l.jpg',
    'water-pump-2hp.jpg',
    
    // Tools
    'garden-hoe.jpg'
  ];
  
  // These are the products that should exist in the database
  const expectedProducts = [
    'Basmati Rice Seeds - Premium Quality',
    'Tomato Seeds - Hybrid F1',
    'Wheat Seeds - Durum Variety',
    'NPK Fertilizer 19:19:19',
    'Urea Fertilizer - 50kg Bag',
    'Acrisio',
    'Blasil',
    'Felujit',
    'Isoprothiolane',
    'Neem Oil - Organic Pesticide',
    'Nissodium',
    'Propiconazole',
    'Sheathmar',
    'Tebuconazole',
    'Trcyycazolole',
    'Validimycin',
    'Sprayer - 16L Capacity',
    'Water Pump - 2HP Submersible',
    'Garden Hoe - Steel Head'
  ];
  
  console.log('Expected products in database:', expectedProducts.length);
  console.log('Images available:', allImages.length);
  
  return allImages;
}
