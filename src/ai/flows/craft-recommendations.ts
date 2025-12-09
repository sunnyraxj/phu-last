'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing personalized craft recommendations to customers.
 *
 * The flow takes user preferences and browsing history as input and uses a generative AI model
 * to suggest relevant products or artisans.
 *
 * @module src/ai/flows/craft-recommendations
 *
 * @interface CraftRecommendationInput - The input type for the craft recommendation flow.
 * @interface CraftRecommendationOutput - The output type for the craft recommendation flow.
 * @function recommendCrafts - A function that takes CraftRecommendationInput and returns a Promise of CraftRecommendationOutput.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CraftRecommendationInputSchema = z.object({
  browsingHistory: z
    .string()
    .describe("The customer's browsing history, as a string."),
  preferences: z
    .string()
    .describe('The customer provided preferences, as a string.'),
});
export type CraftRecommendationInput = z.infer<typeof CraftRecommendationInputSchema>;

const CraftRecommendationOutputSchema = z.object({
  recommendations: z
    .string()
    .describe('A list of recommended crafts or artisans, as a string.'),
});
export type CraftRecommendationOutput = z.infer<typeof CraftRecommendationOutputSchema>;

/**
 * This function takes user preferences and browsing history as input and uses a generative AI model
 * to suggest relevant products or artisans.
 * @param input
 * @returns
 */
export async function recommendCrafts(input: CraftRecommendationInput): Promise<CraftRecommendationOutput> {
  return craftRecommendationFlow(input);
}

const craftRecommendationPrompt = ai.definePrompt({
  name: 'craftRecommendationPrompt',
  input: {schema: CraftRecommendationInputSchema},
  output: {schema: CraftRecommendationOutputSchema},
  prompt: `You are a craft recommendation expert.
Based on the provided browsing history and preferences, suggest relevant crafts or artisans.
Browsing History: {{{browsingHistory}}}
Preferences: {{{preferences}}}
`,
});

const craftRecommendationFlow = ai.defineFlow(
  {
    name: 'craftRecommendationFlow',
    inputSchema: CraftRecommendationInputSchema,
    outputSchema: CraftRecommendationOutputSchema,
  },
  async input => {
    const {output} = await craftRecommendationPrompt(input);
    return output!;
  }
);
