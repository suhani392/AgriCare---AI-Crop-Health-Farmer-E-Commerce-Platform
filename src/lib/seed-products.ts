import { db } from './firebase/index';
import { collection, addDoc } from 'firebase/firestore';
import type { Product, ProductCategory } from '@/types';

// Sample product categories
const sampleCategories: Omit<ProductCategory, 'id'>[] = [
  { name: 'Seeds' },
  { name: 'Fertilizers' },
  { name: 'Pesticides' },
  { name: 'Equipment' },
  { name: 'Tools' },
  { name: 'Irrigation' },
  { name: 'Organic Products' }
];

// Sample products
const sampleProducts: Omit<Product, 'id'>[] = [
  // Seeds
  {
    name: 'Basmati Rice Seeds - Premium Quality',
    category: 'Seeds',
    price: 450.00,
    stock: 50,
    imageUrl: '/images/products/seeds/basmati-rice-seeds.jpg',
    description: 'High-yielding basmati rice seeds suitable for Indian climate. Premium quality with 95% germination rate.',
    dataAiHint: 'rice seeds basmati premium quality'
  },
  {
    name: 'Wheat Seeds - Durum Variety',
    category: 'Seeds',
    price: 380.00,
    stock: 75,
    imageUrl: '/images/products/seeds/wheat-seeds-durum.jpg',
    description: 'Durum wheat seeds perfect for Indian wheat cultivation. High protein content and disease resistant.',
    dataAiHint: 'wheat seeds durum variety'
  },
  {
    name: 'Tomato Seeds - Hybrid F1',
    category: 'Seeds',
    price: 120.00,
    stock: 100,
    imageUrl: '/images/products/seeds/tomato-seeds-hybrid.jpg',
    description: 'Hybrid tomato seeds with excellent yield potential. Resistant to common diseases.',
    dataAiHint: 'tomato seeds hybrid f1'
  },
  {
    name: 'Cotton Seeds - Bt Variety',
    category: 'Seeds',
    price: 850.00,
    stock: 30,
    imageUrl: '/images/products/seeds/cotton-seeds-bt.jpg',
    description: 'Bt cotton seeds with built-in pest resistance. High fiber quality and yield.',
    dataAiHint: 'cotton seeds bt variety'
  },

  // Fertilizers
  {
    name: 'NPK Fertilizer 19:19:19',
    category: 'Fertilizers',
    price: 650.00,
    stock: 40,
    imageUrl: '/images/products/fertilizers/npk-19-19-19.jpg',
    description: 'Balanced NPK fertilizer for all crops. Promotes healthy growth and high yields.',
    dataAiHint: 'npk fertilizer balanced nutrients'
  },
  {
    name: 'Urea Fertilizer - 50kg Bag',
    category: 'Fertilizers',
    price: 280.00,
    stock: 60,
    imageUrl: '/images/products/fertilizers/urea-fertilizer.jpg',
    description: 'High nitrogen content urea fertilizer. Essential for vegetative growth.',
    dataAiHint: 'urea fertilizer nitrogen'
  },
  {
    name: 'DAP Fertilizer - 50kg Bag',
    category: 'Fertilizers',
    price: 1200.00,
    stock: 25,
    imageUrl: '/images/products/fertilizers/dap-fertilizer.jpg',
    description: 'Diammonium Phosphate fertilizer. Rich in phosphorus and nitrogen.',
    dataAiHint: 'dap fertilizer phosphorus nitrogen'
  },
  {
    name: 'Organic Compost - 25kg Bag',
    category: 'Organic Products',
    price: 180.00,
    stock: 80,
    imageUrl: '/images/products/fertilizers/organic-compost.jpg',
    description: 'Natural organic compost made from farm waste. Improves soil health and fertility.',
    dataAiHint: 'organic compost natural fertilizer'
  },

  // Pesticides
  {
    name: 'Neem Oil - Organic Pesticide',
    category: 'Pesticides',
    price: 320.00,
    stock: 45,
    imageUrl: '/images/products/pesticides/neem-oil.jpg',
    description: 'Natural neem oil pesticide. Safe for beneficial insects and environment.',
    dataAiHint: 'neem oil organic pesticide'
  },
  {
    name: 'Bordeaux Mixture - Fungicide',
    category: 'Pesticides',
    price: 150.00,
    stock: 35,
    imageUrl: '/images/products/pesticides/bordeaux-mixture.jpg',
    description: 'Copper-based fungicide for plant disease control. Effective against fungal infections.',
    dataAiHint: 'bordeaux mixture fungicide copper'
  },
  {
    name: 'Pyrethrum Spray - Natural Insecticide',
    category: 'Pesticides',
    price: 280.00,
    stock: 50,
    imageUrl: '/images/products/pesticides/pyrethrum-spray.jpg',
    description: 'Natural pyrethrum-based insecticide. Fast-acting and biodegradable.',
    dataAiHint: 'pyrethrum spray natural insecticide'
  },

  // Equipment
  {
    name: 'Drip Irrigation Kit - 1 Acre',
    category: 'Irrigation',
    price: 8500.00,
    stock: 15,
    imageUrl: '/images/products/equipment/drip-irrigation-kit.jpg',
    description: 'Complete drip irrigation system for 1 acre. Water-efficient and easy to install.',
    dataAiHint: 'drip irrigation kit water efficient'
  },
  {
    name: 'Sprayer - 16L Capacity',
    category: 'Equipment',
    price: 1200.00,
    stock: 20,
    imageUrl: '/images/products/equipment/sprayer-16l.jpg',
    description: 'High-quality sprayer for pesticides and fertilizers. Durable and efficient.',
    dataAiHint: 'sprayer pesticide fertilizer application'
  },
  {
    name: 'Water Pump - 2HP Submersible',
    category: 'Equipment',
    price: 15000.00,
    stock: 8,
    imageUrl: '/images/products/equipment/water-pump-2hp.jpg',
    description: '2HP submersible water pump for irrigation. Energy efficient and reliable.',
    dataAiHint: 'water pump submersible irrigation'
  },
  {
    name: 'Tractor Mounted Cultivator',
    category: 'Equipment',
    price: 45000.00,
    stock: 5,
    imageUrl: '/images/products/equipment/tractor-cultivator.jpg',
    description: 'Heavy-duty cultivator for tractor mounting. Perfect for soil preparation.',
    dataAiHint: 'tractor cultivator soil preparation'
  },

  // Tools
  {
    name: 'Garden Hoe - Steel Head',
    category: 'Tools',
    price: 450.00,
    stock: 30,
    imageUrl: '/images/products/tools/garden-hoe.jpg',
    description: 'Durable steel garden hoe for weeding and soil cultivation. Ergonomic handle.',
    dataAiHint: 'garden hoe steel weeding'
  },
  {
    name: 'Pruning Shears - Professional',
    category: 'Tools',
    price: 650.00,
    stock: 25,
    imageUrl: '/images/products/tools/pruning-shears.jpg',
    description: 'Professional pruning shears for tree and plant maintenance. Sharp and durable.',
    dataAiHint: 'pruning shears professional cutting'
  },
  {
    name: 'Soil Testing Kit',
    category: 'Tools',
    price: 1200.00,
    stock: 15,
    imageUrl: '/images/products/tools/soil-testing-kit.jpg',
    description: 'Complete soil testing kit to check pH, nutrients, and soil health.',
    dataAiHint: 'soil testing kit ph nutrients'
  },
  {
    name: 'Seed Drill - Manual',
    category: 'Tools',
    price: 2800.00,
    stock: 12,
    imageUrl: '/images/products/tools/seed-drill-manual.jpg',
    description: 'Manual seed drill for precise seed placement. Adjustable depth and spacing.',
    dataAiHint: 'seed drill manual planting'
  }
];

export async function seedProductsAndCategories() {
  try {
    console.log('Starting to seed products and categories...');
    
    // First, add categories
    const categoryIds: { [key: string]: string } = {};
    
    for (const category of sampleCategories) {
      const docRef = await addDoc(collection(db, 'product_categories'), category);
      categoryIds[category.name] = docRef.id;
      console.log(`Added category: ${category.name} with ID: ${docRef.id}`);
    }
    
    // Then, add products
    for (const product of sampleProducts) {
      const docRef = await addDoc(collection(db, 'products'), product);
      console.log(`Added product: ${product.name} with ID: ${docRef.id}`);
    }
    
    console.log('Successfully seeded products and categories!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding products and categories:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Function to clear existing data (use with caution)
export async function clearProductsAndCategories() {
  try {
    console.log('Clearing existing products and categories...');
    // Note: This would require additional Firestore operations to delete all documents
    // For now, we'll just log a warning
    console.warn('Clear function not implemented - manual deletion required from Firestore console');
    return { success: true };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
