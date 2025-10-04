#!/usr/bin/env tsx

import { removeProductsWithoutImages } from '../src/lib/remove-products-without-images';

async function main() {
  console.log('🗑️ Starting removal of products without images...');
  
  const result = await removeProductsWithoutImages();
  
  if (result.success) {
    console.log(`✅ Successfully removed ${result.removedCount} products without images!`);
    console.log('🧹 Database cleaned up - only products with actual images remain');
  } else {
    console.error('❌ Failed to remove products without images:', result.error);
    process.exit(1);
  }
}

main().catch(console.error);
