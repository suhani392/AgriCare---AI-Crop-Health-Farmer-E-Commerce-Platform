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
import { getCurrentWeather, analyzeAgriculturalWeather } from '@/lib/weather';

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
  userLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional().describe('User location for weather-based advice.'),
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
  async ({ message, history, language, photoDataUri, userLocation }) => {

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
    
    // Check if the current message has an image (most recent image)
    const hasImageInCurrentMessage = !!photoDataUri;
    
    // Find the most recent image in history (if no current image)
    const mostRecentImageIndex = hasImageInCurrentMessage ? -1 : 
      history.findLastIndex(msg => 
      msg.parts.some(part => 'text' in part && part.text === '[User uploaded an image]')
    );
    
    console.log('Has image in history:', hasImageInHistory);
    console.log('Has image in current message:', hasImageInCurrentMessage);
    console.log('Most recent image index:', mostRecentImageIndex);
    
    // Add context about which image to focus on
    let imageContextNote = '';
    if (hasImageInCurrentMessage) {
      imageContextNote = '\n\nIMPORTANT: You are analyzing a NEW image that was just uploaded. Focus on this current image, not any previous images.';
    } else if (mostRecentImageIndex >= 0) {
      // Find what crop was identified in the most recent image
      const mostRecentImageMessage = history[mostRecentImageIndex];
      const mostRecentResponse = history[mostRecentImageIndex + 1];
      let identifiedCrop = '';
      
      if (mostRecentResponse && mostRecentResponse.parts) {
        const responseText = mostRecentResponse.parts.map(p => 'text' in p ? p.text : '').join(' ');
        // Look for crop identification patterns
        const cropPatterns = [
          /identified.*?as\s+([A-Za-z\s]+)/i,
          /crop.*?is\s+([A-Za-z\s]+)/i,
          /^([A-Za-z\s]+)$/m // Simple crop name on its own line
        ];
        
        for (const pattern of cropPatterns) {
          const match = responseText.match(pattern);
          if (match && match[1]) {
            identifiedCrop = match[1].trim();
            break;
          }
        }
      }
      
      if (identifiedCrop) {
        imageContextNote = `\n\nCRITICAL: You are answering a follow-up question about the MOST RECENT image in the conversation. The most recent image was identified as "${identifiedCrop}". When the user asks about "it" or "this crop", they are referring to "${identifiedCrop}". Do NOT mention any other crops or diseases unless specifically diagnosed.`;
        console.log('Identified crop from most recent image:', identifiedCrop);
      } else {
        imageContextNote = `\n\nIMPORTANT: You are answering a follow-up question about the MOST RECENT image in the conversation (message ${mostRecentImageIndex + 1}). Do NOT refer to older images.`;
        console.log('Could not identify crop from most recent image response');
      }
    }

    // Get weather data if location is provided
    let weatherContext = '';
    if (userLocation) {
      try {
        const weatherData = await getCurrentWeather(userLocation.latitude, userLocation.longitude);
        if (weatherData) {
          const agriculturalWeather = analyzeAgriculturalWeather(weatherData);
          weatherContext = `\n\nWEATHER CONTEXT for ${agriculturalWeather.location}:
- Current Temperature: ${agriculturalWeather.temperature}°C
- Humidity: ${agriculturalWeather.humidity}%
- UV Index: ${agriculturalWeather.uvIndex}
- Wind Speed: ${agriculturalWeather.windSpeed} km/h
- Precipitation: ${agriculturalWeather.precipitation}mm
- Agricultural Risks: Disease Risk: ${agriculturalWeather.agriculturalRisk.diseaseRisk}, Pest Risk: ${agriculturalWeather.agriculturalRisk.pestRisk}, Stress Risk: ${agriculturalWeather.agriculturalRisk.stressRisk}
- Weather-based Recommendations: ${agriculturalWeather.recommendations.join(', ')}

IMPORTANT: Always start your response by mentioning the user's location and current weather conditions before providing any agricultural advice. Format it like this:
"Location: [Location Name]
Current Weather: [Temperature]°C, [Humidity]% humidity, [Condition]
Agricultural Risks: [Disease/Pest/Stress risk levels
Then provide your agricultural advice based on these conditions."`;
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    }

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
- CRITICAL: Always analyze the CURRENT image being provided, not any previous images. If this is a new image, analyze it fresh. If this is a follow-up question about a previous image, refer to the MOST RECENT image in the conversation.
- WEATHER-AWARE ADVICE: If weather context is provided, ALWAYS start your response by displaying the user's location and current weather conditions before giving any agricultural advice. This helps users understand why specific recommendations are being made.
- If the image does not clearly depict a crop, or if you cannot determine the disease with reasonable confidence, state that and explain what you see in the requested language.${weatherContext}${imageContextNote}`;
    } else if (hasImageInHistory) {
      // Logic for follow-up questions after image analysis
      systemInstruction = `You are AgriBot, a friendly and knowledgeable AI assistant for AgriCare. You have previously analyzed images in this conversation and MUST maintain that context.
- ${languageInstruction}
- CRITICAL CONTEXT RULE: You have already analyzed images in this conversation. When users say "it", "this", "the image", "the crop", "the plant", etc., they are referring to the MOST RECENT image you analyzed, NOT the first image.
- ABSOLUTE REQUIREMENT: Always refer to the LATEST/MOST RECENT image in the conversation, not the first one. If multiple images have been shared, focus on the most recent one.
- CONTEXT MEMORY: You MUST remember your previous analysis and continue the conversation based on that context.
- NEVER ask for information you already have from previous messages. If you previously identified a crop (like "Sugarcane" or "Rye"), and the user asks "how can I prevent it from getting diseased?", you know "it" refers to that specific crop.
- RESPONSE ACCURACY: Respond ONLY to what the user specifically asks for. If they ask for crop identification, provide only the crop name. If they ask for disease diagnosis, provide only the diagnosis and treatment.
- FOLLOW-UP CONTEXT: If a user asks follow-up questions like "how to prevent it?", "why is it black?", "what products to use?", they are referring to the crop/disease you previously identified in the MOST RECENT image.
- NO HALLUCINATION: Do NOT make up or assume diseases that were not diagnosed. If you identified "Sugarcane" as healthy, do NOT mention "Maize Leaf Spot" or any other disease unless specifically diagnosed.
- STRICT CONTEXT: If the most recent image was identified as a specific crop (like "Sugarcane"), and no disease was diagnosed, provide general prevention advice for that specific crop only. Do NOT invent diseases or refer to other crops.
- WEATHER-AWARE ADVICE: If weather context is provided, ALWAYS start your response by displaying the user's location and current weather conditions before giving any agricultural advice. This helps users understand why specific recommendations are being made.
- Provide specific advice based on your previous analysis. Do NOT ask users to re-upload images or specify which image they mean.
- You can answer questions about crop diseases, fertilizers, pesticides, seeds, farming equipment, preventative measures, localized tips, and government schemes for farmers in India.
- Keep responses relatively short and easy to understand for a general audience.
- Never provide medical or financial advice. For complex issues, always recommend consulting a local agricultural expert or authority.${weatherContext}${imageContextNote}`;
    } else {
      // Logic for text-only chat without image history
      systemInstruction = `You are AgriBot, a friendly and knowledgeable AI assistant for AgriCare, a platform dedicated to helping farmers in India. Your expertise is in Indian agriculture.
- ${languageInstruction}
- Provide accurate, concise, and practical advice.
- If a question is outside the scope of farming, politely state that you can only answer agriculture-related queries.
- WEATHER-AWARE ADVICE: If weather context is provided, ALWAYS start your response by displaying the user's location and current weather conditions before giving any agricultural advice. This helps users understand why specific recommendations are being made.
- Keep responses relatively short and easy to understand for a general audience.
- You can answer questions about crop diseases, fertilizers, pesticides, seeds, farming equipment, preventative measures, localized tips, and government schemes for farmers in India.
- Never provide medical or financial advice. For complex issues, always recommend consulting a local agricultural expert or authority.${weatherContext}${imageContextNote}`;
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
    
    // Detect if this is a disease diagnosis response (only in current response, not history)
    const isDiseaseDiagnosis = /diagnosis|disease|pest|fungus|insect|weed|blight|mildew|rust|aphid|borer|caterpillar|thrip|whitefly|deficiency|yellowing|stunted|treatment|cure|spray|fertilizer|pesticide/i.test(text) ||
                              /confidence level|treatment recommendations|preventive|fungicide|insecticide/i.test(text);
    
    // Check if user specifically asked for disease diagnosis (not just crop identification)
    const userAskedForDiagnosis = /disease|diagnose|what's wrong|problem|sick|infected|damaged|rot|blight|mildew|rust|pest|insect|fungus|prevent.*diseas|how.*prevent|prevent.*it|how.*keep.*healthy|how.*protect|treatment|remedy|cure/i.test(message);
    
    // Only suggest products if user asked for diagnosis AND the response contains disease information
    if (isDiseaseDiagnosis && userAskedForDiagnosis) {
      try {
        console.log('Disease diagnosis detected, getting product suggestions...');
        console.log('Current message:', message);
        console.log('Current response text:', text);
        
        // Create a mock diagnosis result for product suggestions based on current response only
        const mockDiagnosis = {
          disease: extractDiseaseFromText(text),
          confidence: 0.8,
          treatmentRecommendations: text
        };
        
        // Get only the most recent context for analysis (not entire conversation history)
        // This prevents the system from suggesting products based on old images/diseases
        const recentContext = message + ' ' + text;
        console.log('Recent context for product suggestions:', recentContext);
        
        suggestedProducts = await getProductSuggestions(mockDiagnosis, recentContext);
        
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
  // Only look for disease names that are actually diagnosed in the current response
  // Look for patterns like "affected by **Disease Name**" or "diagnosed as **Disease**"
  const diseasePatterns = [
    /affected by \*\*([^*]+)\*\*/i,
    /diagnosed as \*\*([^*]+)\*\*/i,
    /diagnosis.*?\*\*([^*]+)\*\*/i,
    /appears to be affected by \*\*([^*]+)\*\*/i,
    /identified as \*\*([^*]+)\*\*/i
  ];
  
  for (const pattern of diseasePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Fallback: look for specific disease keywords only if they appear in a diagnostic context
  const diseaseKeywords = [
    'fusarium ear rot', 'ear rot', 'blight', 'mildew', 'rust', 'anthracnose', 
    'powdery mildew', 'downy mildew', 'leaf spot', 'canker', 'bacterial blight', 
    'bacterial wilt', 'soft rot', 'rice blast', 'sheath blight'
  ];
  
  for (const keyword of diseaseKeywords) {
    if (text.toLowerCase().includes(keyword) && 
        (text.toLowerCase().includes('diagnosis') || 
         text.toLowerCase().includes('affected') || 
         text.toLowerCase().includes('disease'))) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }
  
  return 'Agricultural Issue';
}
