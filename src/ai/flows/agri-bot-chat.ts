'use server';

/**
 * @fileOverview A conversational AI agent for AgriCare, acting as a farming assistant for India.
 * It can handle both text-only conversations and image-based crop disease diagnosis.
 *
 * - agriBotChat - A function that handles the conversational chat with the AI.
 * - AgriBotChatInput - The input type for the agriBotChat function.
 * - AgriBotChatOutput - The return type for the agriBotChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ChatMessageHistory, Product } from '@/types';
import { getProductSuggestions } from '@/lib/product-suggestions';

const AgriBotChatInputSchema = z.object({
  message: z.string().describe('The latest message from the user.'),
  photoDataUri: z.string().optional().describe(
    "An optional photo of a crop, as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.union([
        z.object({ text: z.string() }),
        z.object({ media: z.object({ url: z.string() }) })
    ]))
  })).describe('The history of the conversation.'),
  language: z.enum(['en', 'mr', 'hi']).optional().default('en').describe('The language for the response.'),
});
type AgriBotChatInput = z.infer<typeof AgriBotChatInputSchema>;

const AgriBotChatOutputSchema = z.object({
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
type AgriBotChatOutput = z.infer<typeof AgriBotChatOutputSchema>;


export async function agriBotChat(input: AgriBotChatInput): Promise<AgriBotChatOutput> {
  return agriBotChatFlow(input);
}


const agriBotChatFlow = ai.defineFlow(
  {
    name: 'agriBotChatFlow',
    inputSchema: AgriBotChatInputSchema,
    outputSchema: AgriBotChatOutputSchema,
  },
  async ({ message, history, language, photoDataUri }) => {

    // Debug: Log the history to see what's being passed
    console.log('=== DEBUG: Chat History ===');
    console.log('History length:', history.length);
    console.log('History content:', JSON.stringify(history, null, 2));
    console.log('Current message:', message);
    console.log('Photo data URI present:', !!photoDataUri);

    let languageInstruction = "You must answer in English.";
    if (language === 'mr') {
        languageInstruction = "You must answer in Marathi.";
    } else if (language === 'hi') {
        languageInstruction = "You must answer in Hindi.";
    }

    // Check if there's any image context in the conversation history
    const hasImageInHistory = history.some(msg => 
      msg.parts.some(part => 'text' in part && part.text === '[User uploaded an image]')
    );
    
    console.log('Has image in history:', hasImageInHistory);

    let systemInstruction;
    if (photoDataUri) {
      // Logic for when an image is present in current message
      systemInstruction = `You are an expert agricultural botanist specializing in Indian crops. Analyze the user's message and the provided photo.
- ${languageInstruction}
- CRITICAL: Respond ONLY to what the user specifically asks for. Do NOT provide additional information unless requested.
- If the user asks to identify the crop (e.g., "what crop is this?", "name this plant", "which crop is this?"), respond ONLY with the common name of the crop. Do NOT provide disease diagnosis or treatment information.
- If the user asks to diagnose a disease (e.g., "detect disease", "what's wrong with this plant?", "which disease is this?"), provide a precise diagnosis, your confidence level, and detailed treatment recommendations suitable for Indian farming conditions. The entire response, including disease name and treatments, must be in the requested language.
- If the user asks both questions in one message, answer both questions clearly and separately.
- IMPORTANT: Remember your analysis for future follow-up questions. If you identify a crop, remember that crop name for when the user asks follow-up questions.
- If the image does not clearly depict a crop, or if you cannot determine the disease with reasonable confidence, state that and explain what you see in the requested language.`;
    } else if (hasImageInHistory) {
      // Logic for follow-up questions after image analysis
      systemInstruction = `You are AgriBot, a friendly and knowledgeable AI assistant for AgriCare. You have previously analyzed images in this conversation and MUST maintain that context.
- ${languageInstruction}
- CRITICAL: You have already analyzed images in this conversation. When users say "it", "this", "the image", "the crop", "the plant", etc., they are referring to the crop/image you previously analyzed.
- You MUST remember your previous analysis and continue the conversation based on that context.
- NEVER ask for information you already have from previous messages. If you previously identified a crop (like "Maize" or "Corn"), and the user asks "how can I prevent it from getting diseased?", you know "it" refers to that crop.
- Respond ONLY to what the user specifically asks for. If they ask for crop identification, provide only the crop name. If they ask for disease diagnosis, provide only the diagnosis and treatment.
- If a user asks follow-up questions like "how to prevent it?", "why is it black?", "what products to use?", they are referring to the crop/disease you previously identified.
- Provide specific advice based on your previous analysis. Do NOT ask users to re-upload images or specify which image they mean.
- You can answer questions about crop diseases, fertilizers, pesticides, seeds, farming equipment, preventative measures, localized tips, and government schemes for farmers in India.
- Keep responses relatively short and easy to understand for a general audience.
- Never provide medical or financial advice. For complex issues, always recommend consulting a local agricultural expert or authority.`;
    } else {
      // Logic for text-only chat without image history
      systemInstruction = `You are AgriBot, a friendly and knowledgeable AI assistant for AgriCare, a platform dedicated to helping farmers in India. Your expertise is in Indian agriculture.
- ${languageInstruction}
- Provide accurate, concise, and practical advice.
- If a question is outside the scope of farming, politely state that you can only answer agriculture-related queries.
- Keep responses relatively short and easy to understand for a general audience.
- You can answer questions about crop diseases, fertilizers, pesticides, seeds, farming equipment, preventative measures, localized tips, and government schemes for farmers in India.
- Never provide medical or financial advice. For complex issues, always recommend consulting a local agricultural expert or authority.`;
    }

    const promptParts = [];
    if (message) {
        promptParts.push({ text: message });
    }
    if (photoDataUri) {
        promptParts.push({ media: { url: photoDataUri } });
    }

    const { text } = await ai.generate({
        model: 'googleai/gemini-2.0-flash', // A model that can handle both text and images
        system: systemInstruction,
        history: history,
        prompt: promptParts,
    } as any);

    // Check if this is a disease diagnosis and suggest products automatically
    let suggestedProducts: Product[] = [];
    
    // Detect if this is a disease diagnosis response
    const isDiseaseDiagnosis = /diagnosis|disease|pest|fungus|insect|weed|blight|mildew|rust|aphid|borer|caterpillar|thrip|whitefly|deficiency|yellowing|stunted|treatment|cure|spray|fertilizer|pesticide/i.test(text) ||
                              /confidence level|treatment recommendations|preventive|fungicide|insecticide/i.test(text);
    
    // Check if user specifically asked for disease diagnosis (not just crop identification)
    const userAskedForDiagnosis = /disease|diagnose|what's wrong|problem|sick|infected|damaged|rot|blight|mildew|rust|pest|insect|fungus|prevent.*diseas|how.*prevent|prevent.*it|how.*keep.*healthy|how.*protect|treatment|remedy|cure/i.test(message);
    
    // Only suggest products if user asked for diagnosis AND the response contains disease information
    if (isDiseaseDiagnosis && userAskedForDiagnosis) {
      try {
        console.log('Disease diagnosis detected, getting product suggestions...');
        
        // Create a mock diagnosis result for product suggestions
        const mockDiagnosis = {
          disease: extractDiseaseFromText(text),
          confidence: 0.8,
          treatmentRecommendations: text
        };
        
        // Get the full conversation text for analysis
        const conversationText = history.map(h => h.parts.map(p => 'text' in p ? p.text : '').join(' ')).join(' ') + ' ' + message + ' ' + text;
        
        suggestedProducts = await getProductSuggestions(mockDiagnosis, conversationText);
        
        // Limit to 3 suggestions for chat interface
        suggestedProducts = suggestedProducts.slice(0, 3);
        
        console.log('Auto-suggested products:', suggestedProducts.map(p => p.name));
        
      } catch (error) {
        console.error('Error getting automatic product suggestions:', error);
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
    'whitefly', 'mite', 'beetle', 'weed', 'deficiency', 'ear rot', 'rot'
  ];
  
  for (const keyword of diseaseKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }
  
  return 'Agricultural Issue';
}
