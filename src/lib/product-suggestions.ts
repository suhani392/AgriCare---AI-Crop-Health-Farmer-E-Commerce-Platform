import { getProducts } from './firebase/firestore';
import type { Product, DiagnosisResult } from '@/types';

// Product suggestion rules based on disease types and symptoms
interface SuggestionRule {
  keywords: RegExp[];
  productNames: string[];
  priority: number;
  description: string;
}

// Define suggestion rules for different types of diseases and issues
// Note: Only using product names that actually exist in the database
const suggestionRules: SuggestionRule[] = [
  // Fungal diseases
  {
    keywords: [/fungal/i, /fungus/i, /blight/i, /mildew/i, /rust/i, /anthracnose/i, /powdery mildew/i, /downy mildew/i, /leaf spot/i, /canker/i],
    productNames: ['Neem Oil - Organic Pesticide', 'Blasil', 'Propiconazole', 'Tebuconazole', 'Trcyycazolole'],
    priority: 1,
    description: 'Fungal disease control products'
  },
  
  // Bacterial diseases
  {
    keywords: [/bacterial/i, /bacteria/i, /bacterial blight/i, /bacterial wilt/i, /soft rot/i],
    productNames: ['Neem Oil - Organic Pesticide', 'Validimycin', 'Blasil'],
    priority: 1,
    description: 'Bacterial disease control products'
  },
  
  // Insect pests
  {
    keywords: [/insect/i, /pest/i, /aphid/i, /borer/i, /caterpillar/i, /thrip/i, /whitefly/i, /mite/i, /beetle/i, /bug/i],
    productNames: ['Neem Oil - Organic Pesticide', 'Acrisio', 'Felujit'],
    priority: 1,
    description: 'Insect pest control products'
  },
  
  // Rice-specific diseases
  {
    keywords: [/rice blast/i, /sheath blight/i, /rice/i, /paddy/i],
    productNames: ['Isoprothiolane', 'Sheathmar', 'Validimycin'],
    priority: 2,
    description: 'Rice disease control products'
  },
  
  // Nutrient deficiencies
  {
    keywords: [/nitrogen/i, /chlorosis/i, /yellowing/i, /stunted/i, /deficiency/i],
    productNames: ['Urea Fertilizer - 50kg Bag', 'NPK Fertilizer 19:19:19'],
    priority: 2,
    description: 'Nitrogen deficiency treatment'
  },
  
  {
    keywords: [/phosphorus/i, /root/i, /flowering/i, /fruiting/i],
    productNames: ['NPK Fertilizer 19:19:19'],
    priority: 2,
    description: 'Phosphorus deficiency treatment'
  },
  
  // Weed control
  {
    keywords: [/weed/i, /weeds/i, /grassy/i, /grass/i, /unwanted plants/i],
    productNames: ['Nissodium'],
    priority: 2,
    description: 'Weed control products'
  },
  
  // Application tools
  {
    keywords: [/spray/i, /foliar/i, /application/i, /sprayer/i],
    productNames: ['Sprayer - 16L Capacity'],
    priority: 3,
    description: 'Application equipment'
  },
  
  // Soil health
  {
    keywords: [/soil/i, /fertility/i, /organic/i, /compost/i],
    productNames: ['NPK Fertilizer 19:19:19'],
    priority: 3,
    description: 'Soil health improvement'
  }
];

// Function to get product suggestions based on diagnosis
export async function getProductSuggestions(diagnosis: DiagnosisResult | null, diagnosisText: string): Promise<Product[]> {
  try {
    // Get all products from database
    const allProducts = await getProducts();
    
    if (!allProducts || allProducts.length === 0) {
      console.warn('No products found in database');
      return [];
    }
    
    // Combine diagnosis disease name and treatment recommendations for analysis
    const analysisText = `${diagnosis?.disease || ''} ${diagnosis?.treatmentRecommendations || ''} ${diagnosisText}`.toLowerCase();
    
    console.log('Analyzing text for product suggestions:', analysisText);
    
    // Find matching rules
    const matchingRules: SuggestionRule[] = [];
    
    for (const rule of suggestionRules) {
      const hasMatch = rule.keywords.some(keyword => keyword.test(analysisText));
      if (hasMatch) {
        matchingRules.push(rule);
        console.log(`Matched rule: ${rule.description}`);
      }
    }
    
    // Sort by priority (lower number = higher priority)
    matchingRules.sort((a, b) => a.priority - b.priority);
    
    // Get suggested products
    const suggestedProducts: Product[] = [];
    const addedProductIds = new Set<string>();
    
    // Add products from matching rules
    for (const rule of matchingRules) {
      for (const productName of rule.productNames) {
        const product = allProducts.find(p => p.name === productName);
        if (product && !addedProductIds.has(product.id)) {
          suggestedProducts.push(product);
          addedProductIds.add(product.id);
          console.log(`Added product: ${product.name}`);
        }
      }
    }
    
     // If no specific matches, suggest general products based on common issues
     if (suggestedProducts.length === 0) {
       console.log('No specific matches found, suggesting general products');
       
       // Always suggest neem oil as a general organic solution
       const neemOil = allProducts.find(p => p.name === 'Neem Oil - Organic Pesticide');
       if (neemOil) {
         suggestedProducts.push(neemOil);
       }
       
       // Suggest NPK fertilizer for general plant health
       const npkFertilizer = allProducts.find(p => p.name === 'NPK Fertilizer 19:19:19');
       if (npkFertilizer) {
         suggestedProducts.push(npkFertilizer);
       }
       
       // Add a sprayer if spraying is mentioned
       if (/spray|application|foliar/i.test(analysisText)) {
         const sprayer = allProducts.find(p => p.name === 'Sprayer - 16L Capacity');
         if (sprayer) {
           suggestedProducts.push(sprayer);
         }
       }
       
       // Add urea fertilizer for general growth
       const urea = allProducts.find(p => p.name === 'Urea Fertilizer - 50kg Bag');
       if (urea && suggestedProducts.length < 3) {
         suggestedProducts.push(urea);
       }
     }
    
    // Limit to top 4 suggestions to keep the interface clean
    const finalSuggestions = suggestedProducts.slice(0, 4);
    
    console.log(`Final suggestions: ${finalSuggestions.map(p => p.name).join(', ')}`);
    
    return finalSuggestions;
    
  } catch (error) {
    console.error('Error getting product suggestions:', error);
    
    // Fallback: return basic products even if there's an error
    try {
      const allProducts = await getProducts();
      const fallbackProducts = [];
      
      // Always include neem oil as a general solution
      const neemOil = allProducts.find(p => p.name === 'Neem Oil - Organic Pesticide');
      if (neemOil) fallbackProducts.push(neemOil);
      
      // Include NPK fertilizer
      const npkFertilizer = allProducts.find(p => p.name === 'NPK Fertilizer 19:19:19');
      if (npkFertilizer) fallbackProducts.push(npkFertilizer);
      
      return fallbackProducts.slice(0, 3);
    } catch (fallbackError) {
      console.error('Fallback product suggestion also failed:', fallbackError);
      return [];
    }
  }
}

// Function to get consistent suggestions for the same diagnosis
export function getConsistentSuggestions(disease: string, symptoms: string[]): string[] {
  // Create a deterministic hash based on disease and symptoms
  const key = `${disease.toLowerCase()}-${symptoms.sort().join('-').toLowerCase()}`;
  
  // Simple hash function for consistency
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use hash to determine which products to suggest (consistent for same input)
  const productSets = [
    ['Neem Oil - Organic Pesticide', 'NPK Fertilizer 19:19:19'],
    ['Blasil', 'Urea Fertilizer - 50kg Bag'],
    ['Propiconazole', 'Sprayer - 16L Capacity'],
    ['Acrisio', 'Isoprothiolane'],
    ['Felujit', 'Nissodium'],
    ['Tebuconazole', 'Validimycin'],
    ['Trcyycazolole', 'Sheathmar']
  ];
  
  const setIndex = Math.abs(hash) % productSets.length;
  return productSets[setIndex];
}

// Function to validate if a product exists in the database
export async function validateProductExists(productName: string): Promise<boolean> {
  try {
    const products = await getProducts();
    return products.some(p => p.name === productName);
  } catch (error) {
    console.error('Error validating product:', error);
    return false;
  }
}
