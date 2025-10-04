#!/usr/bin/env tsx

import { seedProductsAndCategories } from '../src/lib/seed-products';

async function main() {
  console.log('🌱 Starting database seeding...');
  
  const result = await seedProductsAndCategories();
  
  if (result.success) {
    console.log('✅ Database seeding completed successfully!');
    console.log('📦 Added sample products and categories to Firestore');
    console.log('🖼️  Product images should be placed in public/images/products/ subdirectories');
  } else {
    console.error('❌ Database seeding failed:', result.error);
    process.exit(1);
  }
}

main().catch(console.error);
