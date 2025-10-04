#!/usr/bin/env tsx

import { fixProductImages, removeProductsWithoutImages } from '../src/lib/fix-product-images';

async function main() {
  console.log('🔧 Starting product image fixes...');
  
  // Fix image URLs
  const fixResult = await fixProductImages();
  
  if (fixResult.success) {
    console.log(`✅ Successfully fixed ${fixResult.updatedCount} product image URLs!`);
  } else {
    console.error('❌ Failed to fix product images:', fixResult.error);
  }
  
  // Check for products without images
  const checkResult = await removeProductsWithoutImages();
  
  if (checkResult.success) {
    console.log(`📋 Found ${checkResult.productsToRemove?.length || 0} products without corresponding images`);
    if (checkResult.productsToRemove && checkResult.productsToRemove.length > 0) {
      console.log('💡 Consider removing these products from Firestore console:');
      checkResult.productsToRemove.forEach(id => console.log(`   - ${id}`));
    }
  } else {
    console.error('❌ Failed to check products without images:', checkResult.error);
  }
  
  console.log('🎉 Product image fix process completed!');
}

main().catch(console.error);
