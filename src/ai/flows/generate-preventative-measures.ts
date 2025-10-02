
// src/ai/flows/generate-preventative-measures.ts
'use server';
/**
 * @fileOverview An AI agent that generates preventative measures for crops based on seasonal trends in India.
 *
 * - generatePreventativeMeasures - A function that handles the generation of preventative measures.
 * - GeneratePreventativeMeasuresInput - The input type for the generatePreventativeMeasures function.
 * - GeneratePreventativeMeasuresOutput - The return type for the generatePreventativeMeasures function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePreventativeMeasuresInputSchema = z.object({
  cropType: z.string().describe('The type of crop (e.g., Rice, Wheat, Cotton, Sugarcane).'),
  season: z.string().describe('The current season in India (e.g., Kharif, Rabi, Zaid, or Spring, Summer, Monsoon, Autumn, Winter).'),
  location: z.string().describe('The geographical location or state in India (e.g., Punjab, Maharashtra).'),
});
export type GeneratePreventativeMeasuresInput = z.infer<typeof GeneratePreventativeMeasuresInputSchema>;

const PreventativeMeasureSchema = z.object({
    title: z.string().describe("A short, catchy title for the preventative measure (e.g., 'Soil Testing & Amendment')."),
    content: z.string().describe("A detailed description of the preventative measure, formatted as a single paragraph."),
});

const GeneratePreventativeMeasuresOutputSchema = z.object({
  measures: z.array(PreventativeMeasureSchema).length(3, 5).describe('An array of 3 to 5 distinct, well-explained preventative measures.'),
});
export type GeneratePreventativeMeasuresOutput = z.infer<typeof GeneratePreventativeMeasuresOutputSchema>;


export async function generatePreventativeMeasures(input: GeneratePreventativeMeasuresInput): Promise<GeneratePreventativeMeasuresOutput> {
  return generatePreventativeMeasuresFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePreventativeMeasuresPrompt',
  input: {schema: GeneratePreventativeMeasuresInputSchema},
  output: {schema: GeneratePreventativeMeasuresOutputSchema},
  prompt: `You are an expert agricultural advisor specializing in Indian farming practices. Based on the crop type, season, and location in India provided, generate a list of 3 to 5 distinct preventative measures to protect the crops from common diseases and optimize their growth.
For each measure, provide a clear title and a detailed content description.
Consider typical Indian agricultural cycles (Kharif, Rabi, Zaid if applicable) and climatic conditions.

Crop Type: {{{cropType}}}
Season: {{{season}}}
Location: {{{location}}} (India)

Your output must be a structured JSON object containing an array of measures.
Example Format:
{
  "measures": [
    {
      "title": "Soil Testing & Amendment",
      "content": "Conduct regular soil tests to determine nutrient deficiencies and pH levels. Amend the soil accordingly with organic matter (compost, manure) or specific fertilizers based on the recommendations."
    },
    {
      "title": "Seed Selection & Treatment",
      "content": "Use certified disease-resistant seeds suitable for the local climate and soil conditions. Treat seeds with appropriate fungicides or bio-control agents before sowing to protect against seed-borne pathogens."
    }
  ]
}`,
});

const generatePreventativeMeasuresFlow = ai.defineFlow(
  {
    name: 'generatePreventativeMeasuresFlow',
    inputSchema: GeneratePreventativeMeasuresInputSchema,
    outputSchema: GeneratePreventativeMeasuresOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
