import { db } from './firebase/index';
import { collection, addDoc } from 'firebase/firestore';
import type { Product } from '@/types';

// Additional pesticide products based on the images you added
const additionalPesticides: Omit<Product, 'id'>[] = [
  {
    name: 'Acrisio',
    category: 'Pesticides',
    price: 450.00,
    stock: 25,
    imageUrl: '/images/products/pesticides/acrisio.jpg',
    description: 'Acrisio pesticide for effective pest control in agricultural crops. Safe and reliable formula.',
    dataAiHint: 'acrisio pesticide pest control'
  },
  {
    name: 'Blasil',
    category: 'Pesticides',
    price: 380.00,
    stock: 30,
    imageUrl: '/images/products/pesticides/blasil.jpg',
    description: 'Blasil fungicide for plant disease management. Protects crops from fungal infections.',
    dataAiHint: 'blasil fungicide plant disease'
  },
  {
    name: 'Felujit',
    category: 'Pesticides',
    price: 520.00,
    stock: 20,
    imageUrl: '/images/products/pesticides/felujit.jpg',
    description: 'Felujit insecticide for comprehensive pest management. Long-lasting protection.',
    dataAiHint: 'felujit insecticide pest management'
  },
  {
    name: 'Isoprothiolane',
    category: 'Pesticides',
    price: 650.00,
    stock: 15,
    imageUrl: '/images/products/pesticides/isoprothiolane.jpg',
    description: 'Isoprothiolane fungicide specifically designed for rice blast control. Highly effective.',
    dataAiHint: 'isoprothiolane fungicide rice blast'
  },
  {
    name: 'Nissodium',
    category: 'Pesticides',
    price: 420.00,
    stock: 35,
    imageUrl: '/images/products/pesticides/nissodium.jpg',
    description: 'Nissodium herbicide for weed control in agricultural fields. Selective action.',
    dataAiHint: 'nissodium herbicide weed control'
  },
  {
    name: 'Propiconazole',
    category: 'Pesticides',
    price: 580.00,
    stock: 18,
    imageUrl: '/images/products/pesticides/propiconazole.jpg',
    description: 'Propiconazole systemic fungicide for broad-spectrum disease control in crops.',
    dataAiHint: 'propiconazole systemic fungicide'
  },
  {
    name: 'Sheathmar',
    category: 'Pesticides',
    price: 480.00,
    stock: 22,
    imageUrl: '/images/products/pesticides/sheathmar.jpg',
    description: 'Sheathmar fungicide for sheath blight control in rice cultivation. Proven efficacy.',
    dataAiHint: 'sheathmar fungicide sheath blight rice'
  },
  {
    name: 'Tebuconazole',
    category: 'Pesticides',
    price: 620.00,
    stock: 16,
    imageUrl: '/images/products/pesticides/tebuconazole.jpg',
    description: 'Tebuconazole triazole fungicide for effective disease management in various crops.',
    dataAiHint: 'tebuconazole triazole fungicide'
  },
  {
    name: 'Trcyycazolole',
    category: 'Pesticides',
    price: 550.00,
    stock: 20,
    imageUrl: '/images/products/pesticides/trcyycazolole.jpg',
    description: 'Trcyycazolole fungicide for comprehensive plant protection against fungal diseases.',
    dataAiHint: 'trcyycazolole fungicide plant protection'
  },
  {
    name: 'Validimycin',
    category: 'Pesticides',
    price: 720.00,
    stock: 12,
    imageUrl: '/images/products/pesticides/validimycin.jpg',
    description: 'Validimycin antibiotic fungicide for rice blast and sheath blight control.',
    dataAiHint: 'validimycin antibiotic fungicide rice'
  }
];

export async function seedAdditionalPesticides() {
  try {
    console.log('Starting to seed additional pesticide products...');
    
    // Add the new pesticide products
    for (const product of additionalPesticides) {
      const docRef = await addDoc(collection(db, 'products'), product);
      console.log(`Added pesticide: ${product.name} with ID: ${docRef.id}`);
    }
    
    console.log('Successfully seeded additional pesticide products!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding additional pesticides:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
