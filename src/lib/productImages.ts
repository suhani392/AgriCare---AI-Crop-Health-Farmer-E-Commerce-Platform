// Product image utility functions

export const FALLBACK_IMAGE = '/images/products/placeholder-product.svg';

// Function to generate product image path based on product name
export function getProductImage(productName: string): string {
  // Convert product name to a safe filename
  const safeName = productName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();

  // Try to determine category from product name
  let category = 'products';
  const name = productName.toLowerCase();
  
  if (name.includes('seed') || name.includes('basmati') || name.includes('wheat') || name.includes('tomato') || name.includes('cotton')) {
    category = 'seeds';
  } else if (name.includes('fertilizer') || name.includes('npk') || name.includes('urea') || name.includes('dap') || name.includes('compost')) {
    category = 'fertilizers';
  } else if (name.includes('pesticide') || name.includes('neem') || name.includes('bordeaux') || name.includes('pyrethrum')) {
    category = 'pesticides';
  } else if (name.includes('equipment') || name.includes('pump') || name.includes('sprayer') || name.includes('cultivator') || name.includes('irrigation')) {
    category = 'equipment';
  } else if (name.includes('tool') || name.includes('hoe') || name.includes('shears') || name.includes('drill') || name.includes('testing')) {
    category = 'tools';
  }

  return `/images/products/${category}/${safeName}.jpg`;
}

// Function to get category-specific placeholder
export function getCategoryPlaceholder(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'seeds': '/images/products/seeds/placeholder.svg',
    'fertilizers': '/images/products/fertilizers/placeholder.svg',
    'pesticides': '/images/products/pesticides/placeholder.svg',
    'equipment': '/images/products/equipment/placeholder.svg',
    'tools': '/images/products/tools/placeholder.svg',
    'irrigation': '/images/products/equipment/placeholder.svg',
    'organic products': '/images/products/fertilizers/placeholder.svg',
  };

  return categoryMap[category.toLowerCase()] || FALLBACK_IMAGE;
}
