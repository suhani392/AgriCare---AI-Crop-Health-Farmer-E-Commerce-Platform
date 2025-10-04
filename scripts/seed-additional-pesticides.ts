#!/usr/bin/env tsx

import { seedAdditionalPesticides } from '../src/lib/seed-additional-pesticides';

async function main() {
  console.log('🌱 Starting additional pesticide seeding...');
  
  const result = await seedAdditionalPesticides();
  
  if (result.success) {
    console.log('✅ Additional pesticide seeding completed successfully!');
    console.log('🧪 Added 10 new pesticide products to Firestore');
    console.log('🖼️  Using the pesticide images you provided');
  } else {
    console.error('❌ Additional pesticide seeding failed:', result.error);
    process.exit(1);
  }
}

main().catch(console.error);
