'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating product details (name and description)
 * based on an image and user-provided information.
 *
 * @module src/ai/flows/generate-product-details
 *
 * @interface GenerateProductDetailsInput - The input type for the flow.
 * @interface GenerateProductDetailsOutput - The output type for the flow.
 * @function generateProductDetails - A function that takes GenerateProductDetailsInput and returns a Promise of GenerateProductDetailsOutput.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDetailsInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  productInfo: z.string().describe('Additional information about the product provided by the user.'),
});
export type GenerateProductDetailsInput = z.infer<typeof GenerateProductDetailsInputSchema>;

const GenerateProductDetailsOutputSchema = z.object({
  name: z.string().describe('A creative and marketable name for the product.'),
  description: z.string().describe('A compelling and descriptive product description.'),
});
export type GenerateProductDetailsOutput = z.infer<typeof GenerateProductDetailsOutputSchema>;

/**
 * This function takes a product image and information and uses a generative AI model
 * to create a product name and description.
 * @param input The product image and information.
 * @returns The generated product name and description.
 */
export async function generateProductDetails(input: GenerateProductDetailsInput): Promise<GenerateProductDetailsOutput> {
  return generateProductDetailsFlow(input);
}

const generateDetailsPrompt = ai.definePrompt({
  name: 'generateProductDetailsPrompt',
  input: {schema: GenerateProductDetailsInputSchema},
  output: {schema: GenerateProductDetailsOutputSchema},
  prompt: `You are an expert e-commerce copywriter specializing in handcrafted goods.
Based on the provided product image and information, generate a creative and marketable product name and a compelling, descriptive product description.

The tone should be warm, authentic, and highlight the artisanal quality of the product.

Additional Information: {{{productInfo}}}
Product Image: {{media url=imageDataUri}}
`,
});

const generateProductDetailsFlow = ai.defineFlow(
  {
    name: 'generateProductDetailsFlow',
    inputSchema: GenerateProductDetailsInputSchema,
    outputSchema: GenerateProductDetailsOutputSchema,
  },
  async input => {
    const {output} = await generateDetailsPrompt(input);
    return output!;
  }
);
