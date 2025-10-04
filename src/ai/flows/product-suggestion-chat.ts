'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getProductSuggestions } from '@/lib/product-suggestions';
import type { ChatMessageHistory, Product } from '@/types';

const ProductSuggestionChatInputSchema = z.object({
  message: z.string().describe('The latest message from the user.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.union([
        z.object({ text: z.string() }),
        z.object({ media: z.object({ url: z.string() }) })
    ]))
  })).describe('The history of the conversation.'),
  language: z.enum(['en', 'mr', 'hi']).optional().default('en').describe('The language for the response.'),
});

type ProductSuggestionChatInput = z.infer<typeof ProductSuggestionChatInputSchema>;

const ProductSuggestionChatOutputSchema = z.object({
  response: z.string().describe('The AI bot\'s response to the user.'),
  suggestedProducts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    price: z.number(),
    stock: z.number(),
    imageUrl: z.string(),
    description: z.string().optional(),
  })).optional().describe('Optional product suggestions based on the conversation.'),
});

type ProductSuggestionChatOutput = z.infer<typeof ProductSuggestionChatOutputSchema>;

export async function productSuggestionChat(input: ProductSuggestionChatInput): Promise<ProductSuggestionChatOutput> {
  return productSuggestionChatFlow(input);
}

const productSuggestionChatFlow = ai.defineFlow(
  {
    name: 'productSuggestionChatFlow',
    inputSchema: ProductSuggestionChatInputSchema,
    outputSchema: ProductSuggestionChatOutputSchema,
  },
  async ({ message, history, language }) => {
    
    let languageInstruction = "You must answer in English.";
    if (language === 'mr') {
        languageInstruction = "You must answer in Marathi.";
    } else if (language === 'hi') {
        languageInstruction = "You must answer in Hindi.";
    }

    // Check if the user is asking about products, diseases, or treatments
    const isProductRelated = /product|buy|purchase|fertilizer|pesticide|seed|equipment|tool|spray|treat|disease|pest|fungus|insect|weed|diagnose|crop|plant|leaf|root|stem|fruit|flower/i.test(message);
    
    // Check if there's any disease or problem mentioned in the conversation
    const conversationText = history.map(h => h.parts.map(p => 'text' in p ? p.text : '').join(' ')).join(' ') + ' ' + message;
    const hasDiseaseMention = /disease|pest|fungus|insect|weed|blight|mildew|rust|aphid|borer|caterpillar|thrip|whitefly|deficiency|yellowing|stunted|diagnose|crop|plant|leaf|root|stem|fruit|flower|treatment|cure|spray|fertilizer|pesticide/i.test(conversationText);

    let systemInstruction = `You are AgriBot, a friendly and knowledgeable AI assistant for AgriCare, a platform dedicated to helping farmers in India. Your expertise is in Indian agriculture.
- ${languageInstruction}
- Provide accurate, concise, and practical advice.
- If a question is outside the scope of farming, politely state that you can only answer agriculture-related queries.
- Keep responses relatively short and easy to understand for a general audience.
- You can answer questions about crop diseases, fertilizers, pesticides, seeds, farming equipment, preventative measures, localized tips, and government schemes for farmers in India.
- Never provide medical or financial advice. For complex issues, always recommend consulting a local agricultural expert or authority.`;

    if (isProductRelated || hasDiseaseMention) {
      systemInstruction += `\n\nIMPORTANT: If the user is asking about products, treatments, or has mentioned any agricultural problems, you should be helpful and informative about available solutions. You can mention that AgriCare has a marketplace with relevant products.`;
    }

    const promptParts = [];
    if (message) {
        promptParts.push({ text: message });
    }

    const { text } = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        system: systemInstruction,
        history: history,
        prompt: promptParts,
    } as any);

    // Determine if we should suggest products
    let suggestedProducts: Product[] = [];
    
    // Always try to suggest products for any agricultural query
    if (isProductRelated || hasDiseaseMention || /agriculture|farming|crop|plant|grow|cultivate|harvest/i.test(conversationText)) {
      try {
        console.log('Attempting to get product suggestions for:', conversationText);
        
        // Create a mock diagnosis result if we detect disease-related keywords
        const mockDiagnosis = hasDiseaseMention ? {
          disease: extractDiseaseFromText(conversationText),
          confidence: 0.7,
          treatmentRecommendations: message
        } : null;
        
        suggestedProducts = await getProductSuggestions(mockDiagnosis, conversationText);
        
        // If no specific suggestions, provide general agricultural products
        if (suggestedProducts.length === 0) {
          console.log('No specific suggestions found, providing general products');
          // This will be handled by the getProductSuggestions function's fallback logic
          suggestedProducts = await getProductSuggestions(null, conversationText);
        }
        
        // Limit to 3 suggestions for chat interface
        suggestedProducts = suggestedProducts.slice(0, 3);
        
        console.log('Final product suggestions:', suggestedProducts.map(p => p.name));
        
      } catch (error) {
        console.error('Error getting product suggestions:', error);
      }
    }

    return { 
      response: text,
      suggestedProducts: suggestedProducts.length > 0 ? suggestedProducts : undefined
    };
  }
);

// Helper function to extract disease name from text
function extractDiseaseFromText(text: string): string {
  const diseaseKeywords = [
    'blight', 'mildew', 'rust', 'anthracnose', 'powdery mildew', 'downy mildew',
    'leaf spot', 'canker', 'bacterial blight', 'bacterial wilt', 'soft rot',
    'rice blast', 'sheath blight', 'aphid', 'borer', 'caterpillar', 'thrip',
    'whitefly', 'mite', 'beetle', 'weed', 'deficiency'
  ];
  
  for (const keyword of diseaseKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }
  
  return 'Agricultural Issue';
}
