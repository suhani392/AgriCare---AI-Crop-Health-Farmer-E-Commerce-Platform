'use server';

/**
 * @fileOverview An AI agent that generates a cartoon-style image based on weather conditions.
 *
 * - generateWeatherImage - A function that generates an image.
 * - GenerateWeatherImageInput - The input type for the function.
 * - GenerateWeatherImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateWeatherImageInputSchema = z.object({
    weatherDescription: z.string().describe('A simple description of the weather, e.g., "sunny and clear", "light rain".'),
    locationName: z.string().describe('The name of the location, e.g., "Nagpur, Maharashtra".'),
});
export type GenerateWeatherImageInput = z.infer<typeof GenerateWeatherImageInputSchema>;

const GenerateWeatherImageOutputSchema = z.object({
    imageUrl: z.string().describe("The data URI of the generated image. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateWeatherImageOutput = z.infer<typeof GenerateWeatherImageOutputSchema>;

export async function generateWeatherImage(input: GenerateWeatherImageInput): Promise<GenerateWeatherImageOutput> {
    return generateWeatherImageFlow(input);
}


const generateWeatherImageFlow = ai.defineFlow(
    {
        name: 'generateWeatherImageFlow',
        inputSchema: GenerateWeatherImageInputSchema,
        outputSchema: GenerateWeatherImageOutputSchema,
    },
    async ({ weatherDescription, locationName }) => {
        const { media } = await ai.generate({
            model: 'googleai/imagen-4.0-fast-generate-001',
            prompt: `Generate a vibrant, flat, 2D cartoon-style image of a farm landscape in rural India, reflecting the location '${locationName}'. The weather should be exactly: '${weatherDescription}'. The style should be simple, with bold outlines and minimal gradients, suitable for a web application icon or header. Do not include any text or words in the image.`,
        });
        
        if (!media.url) {
            throw new Error('Image generation failed to return a data URI.');
        }

        return {
            imageUrl: media.url,
        };
    }
);
