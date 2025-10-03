
'use server';

/**
 * @fileOverview A conversational AI agent for AgriBazaar, acting as a farming assistant for India.
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
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({text: z.string()}))
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
  async ({ message, history, language }) => {

    let languageInstruction = "You must answer in English.";
    if (language === 'mr') {
        languageInstruction = "You must answer in Marathi.";
    } else if (language === 'hi') {
        languageInstruction = "You must answer in Hindi.";
    }

    const systemInstruction = `You are AgriBot, a friendly and knowledgeable AI assistant for AgriBazaar, a platform dedicated to helping farmers in India. Your expertise is in Indian agriculture.
- ${languageInstruction}
- Provide accurate, concise, and practical advice.
- If a question is outside the scope of farming, politely state that you can only answer agriculture-related queries.
- Keep responses relatively short and easy to understand for a general audience.
- You can answer questions about crop diseases, fertilizers, pesticides, seeds, farming equipment, preventative measures, localized tips, and government schemes for farmers in India.
- Never provide medical or financial advice. For complex issues, always recommend consulting a local agricultural expert or authority.`;

    const { text } = await ai.generate({
        system: systemInstruction,
        history: history,
        prompt: message,
    });

    return { response: text };
  }
);
