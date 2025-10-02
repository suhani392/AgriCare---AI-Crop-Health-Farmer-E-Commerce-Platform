'use server';

/**
 * @fileOverview A crop disease diagnosis AI agent, tailored for Indian agriculture.
 *
 * - diagnoseCropDisease - A function that handles the crop disease diagnosis process.
 * - DiagnoseCropDiseaseInput - The input type for the diagnoseCropDisease function.
 * - DiagnoseCropDiseaseOutput - The return type for the diagnoseCropDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnoseCropDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description of the crop, including any observed symptoms and the region in India if known.'),
  model: z.string().describe('The AI model to use for diagnosis.'),
});
export type DiagnoseCropDiseaseInput = z.infer<typeof DiagnoseCropDiseaseInputSchema>;

const DiagnoseCropDiseaseOutputSchema = z.object({
  diagnosis: z.object({
    disease: z.string().describe('The identified disease of the crop, common in Indian agriculture.'),
    confidence: z.number().describe('The confidence level of the diagnosis (0-1).'),
    treatmentRecommendations: z
      .string()
      .describe('Recommendations for treating the identified disease, considering practices suitable for India.'),
  }),
});
export type DiagnoseCropDiseaseOutput = z.infer<typeof DiagnoseCropDiseaseOutputSchema>;

export async function diagnoseCropDisease(input: DiagnoseCropDiseaseInput): Promise<DiagnoseCropDiseaseOutput> {
  return diagnoseCropDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseCropDiseasePrompt',
  input: {schema: DiagnoseCropDiseaseInputSchema},
  output: {schema: DiagnoseCropDiseaseOutputSchema},
  prompt: `You are a highly accurate expert agricultural botanist specializing in diagnosing crop diseases common in India, with a target accuracy of 90% or higher. Analyze the following information and provide a precise diagnosis.
Your diagnosis should include the disease name, your confidence level (a number between 0 and 1), and detailed treatment recommendations suitable for Indian farming conditions.
Consider common Indian crops like rice, wheat, cotton, sugarcane, pulses, etc.

Crop Description: {{{description}}}
Crop Photo: {{media url=photoDataUri}}

If the image does not clearly depict a crop, or if you cannot determine the disease with reasonable confidence, set the disease to "Unknown" and confidence to a low value.`,
});

const diagnoseCropDiseaseFlow = ai.defineFlow(
  {
    name: 'diagnoseCropDiseaseFlow',
    inputSchema: DiagnoseCropDiseaseInputSchema,
    outputSchema: DiagnoseCropDiseaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: input.model });
    return output!;
  }
);
