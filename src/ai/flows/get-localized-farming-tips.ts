
'use server';
/**
 * @fileOverview An AI agent that generates localized farming tips for India.
 *
 * - getLocalizedFarmingTips - A function that generates farming tips based on location and weather.
 * - GetLocalizedFarmingTipsInput - The input type for the getLocalizedFarmingTips function.
 * - GetLocalizedFarmingTipsOutput - The return type for the getLocalizedFarmingTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { LocalizedFarmingTip } from '@/types';


const GetLocalizedFarmingTipsInputSchema = z.object({
  locationName: z.string().describe('The city, district, or region in India (e.g., "Wardha District, Maharashtra", "Punjab", "Rural Bengal").'),
  weatherCondition: z.string().describe('A brief description of the current weather (e.g., "Sunny and hot with high humidity", "Cloudy with intermittent light rain", "Cool and dry morning").'),
  temperatureCelsius: z.number().optional().describe('Current temperature in Celsius, if available.'),
});
export type GetLocalizedFarmingTipsInput = z.infer<typeof GetLocalizedFarmingTipsInputSchema>;

const FarmingTipSchema = z.object({
  title: z.string().describe("A short, catchy title for the farming tip (e.g., 'Optimize Kharif Sowing')."),
  content: z.string().describe("The detailed content of the farming tip, actionable and relevant to the location and weather in India. Should be concise and easy to understand for farmers."),
  category: z.string().describe("A category for the tip, e.g., 'Soil Preparation', 'Pest Management', 'Irrigation', 'Fertilization', 'Sowing/Planting', 'Harvesting', 'Crop Specific'.")
});

const GetLocalizedFarmingTipsOutputSchema = z.object({
  tips: z.array(FarmingTipSchema).length(3,5).describe('An array of 3 to 5 distinct, localized farming tips tailored for India.'),
  generalAdvice: z.string().optional().describe("Any general agricultural advice for the season or region in India if applicable beyond specific tips. Keep it brief.")
});
export type GetLocalizedFarmingTipsOutput = z.infer<typeof GetLocalizedFarmingTipsOutputSchema>;

export async function getLocalizedFarmingTips(input: GetLocalizedFarmingTipsInput): Promise<GetLocalizedFarmingTipsOutput> {
  // Type assertion because Zod schema matches our LocalizedFarmingTip structure
  return getLocalizedFarmingTipsFlow(input) as Promise<GetLocalizedFarmingTipsOutput & { tips: LocalizedFarmingTip[] }>;
}

const prompt = ai.definePrompt({
  name: 'getLocalizedFarmingTipsPrompt',
  input: {schema: GetLocalizedFarmingTipsInputSchema},
  output: {schema: GetLocalizedFarmingTipsOutputSchema},
  prompt: `You are an expert agricultural advisor for India. Your task is to provide specific, actionable farming tips based on the provided location and current weather conditions.
Focus on crops (like rice, wheat, cotton, sugarcane, pulses, millets, vegetables, fruits commonly grown in India) and practices common to the specified Indian region.
Prioritize tips that are immediately relevant given the weather. Consider common Indian agricultural seasons (Kharif, Rabi, Zaid) where applicable.

Location: {{{locationName}}}
Current Weather: {{{weatherCondition}}}
{{#if temperatureCelsius}}Current Temperature: {{{temperatureCelsius}}}°C{{/if}}

Please provide 3 to 5 distinct farming tips. For each tip, include a title, detailed content, and a category.
If there's any overarching advice for the current season or region in India that isn't covered in the specific tips, include it in the generalAdvice field.
Ensure the tips are practical and easy to understand for Indian farmers. Phrase advice clearly and directly.
For categories, use terms like: 'Soil Preparation', 'Pest Management', 'Disease Control', 'Irrigation Strategy', 'Fertilizer Application', 'Sowing Time', 'Planting Technique', 'Harvesting Tips', 'Crop Rotation', 'Water Conservation', 'Weather Advisory'.
Example Tip:
Title: "Monitor for Monsoon Pests"
Content: "With increased humidity, Kharif crops like cotton and soybean are susceptible to pests such as aphids and jassids. Regularly inspect fields and consider using neem-based solutions or recommended bio-pesticides for early control."
Category: "Pest Management"
`,
});

const getLocalizedFarmingTipsFlow = ai.defineFlow(
  {
    name: 'getLocalizedFarmingTipsFlow',
    inputSchema: GetLocalizedFarmingTipsInputSchema,
    outputSchema: GetLocalizedFarmingTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
