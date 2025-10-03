// Map of product names to their corresponding image paths
export const productImageMap: Record<string, string> = {
  'DAP': '/images/products/DAP-fertilizers.jpg',
  'Paddy': '/images/products/Hybrid-paddy-rice-seeds.jpg',
  'Wheat': '/images/products/certified-Wheat-seeds.jpg',
  'Glyphosate': '/images/products/glyphosate-herbicide.png',
  'Tractor': '/images/products/high-efficiency-tractor.jpg',
  'Spray': '/images/products/manual-spray-pump.png',
  'Neem': '/images/products/organic-neem-oil-pesticide.jpg',
  'Urea': '/images/products/urea-fertilizer.jpg',
};

// Fallback image if no match is found
export const FALLBACK_IMAGE = '/images/placeholder-product.jpg';

// Helper function to get product image URL
export function getProductImage(productName: string): string {
  // Try exact match first
  if (productImageMap[productName]) {
    return productImageMap[productName];
  }

  // Try partial match
  const matchedKey = Object.keys(productImageMap).find(key => 
    productName.toLowerCase().includes(key.toLowerCase())
  );

  // Return matched image or fallback
  return matchedKey ? productImageMap[matchedKey] : FALLBACK_IMAGE;
}
