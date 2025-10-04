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
import type { ChatMessageHistory } from '@/types';

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

    let languageInstruction = "You must answer in English.";
    if (language === 'mr') {
        languageInstruction = "You must answer in Marathi.";
    } else if (language === 'hi') {
        languageInstruction = "You must answer in Hindi.";
    }

    let systemInstruction;
    if (photoDataUri) {
      // Logic for when an image is present
      systemInstruction = `You are an expert agricultural botanist specializing in Indian crops. Analyze the user's message and the provided photo.
- ${languageInstruction}
- If the user asks to identify the crop (e.g., "what crop is this?", "name this plant"), respond ONLY with the common name of the crop.
- If the user asks to diagnose a disease (e.g., "detect disease", "what's wrong with this plant?"), provide a precise diagnosis, your confidence level, and detailed treatment recommendations suitable for Indian farming conditions. The entire response, including disease name and treatments, must be in the requested language.
- If the image does not clearly depict a crop, or if you cannot determine the disease with reasonable confidence, state that and explain what you see in the requested language.`;
    } else {
      // Logic for text-only chat
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
    });

    return { response: text };
  }
);
