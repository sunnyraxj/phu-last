
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating product details
 * (name, description, and SEO keywords) based on an image and user-provided notes.
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
  userNotes: z.string().describe('Additional notes or keywords provided by the user to guide content generation.'),
});
export type GenerateProductDetailsInput = z.infer<typeof GenerateProductDetailsInputSchema>;

const GenerateProductDetailsOutputSchema = z.object({
  name: z.string().describe('A creative, SEO-friendly name for the product.'),
  description: z.string().describe('A detailed, engaging, and SEO-optimized product description highlighting its features and story.'),
  seoKeywords: z.array(z.string()).describe("An array of 5-7 relevant SEO keywords or tags for the product."),
});
export type GenerateProductDetailsOutput = z.infer<typeof GenerateProductDetailsOutputSchema>;

/**
 * This function takes an image and user notes and uses a generative AI model
 * to create product details.
 * @param input The image and user notes.
 * @returns The generated product name, description, and SEO keywords.
 */
export async function generateProductDetails(input: GenerateProductDetailsInput): Promise<GenerateProductDetailsOutput> {
  return generateProductDetailsFlow(input);
}

const generateProductDetailsPrompt = ai.definePrompt({
  name: 'generateProductDetailsPrompt',
  input: {schema: GenerateProductDetailsInputSchema},
  output: {schema: GenerateProductDetailsOutputSchema},
  prompt: `You are an expert e-commerce copywriter and SEO specialist for a store that sells authentic handicrafts from North-East India.
Your task is to generate compelling product details based on the provided image and user notes.

- **Product Name:** Create a short, catchy, and descriptive name that is optimized for search engines.
- **Product Description:** Write a detailed and engaging description. It should highlight the craftsmanship, materials, cultural significance, and potential uses of the item. Subtly weave in promotional language.
- **SEO Keywords:** Generate a list of 5-7 relevant keywords or tags that customers might use to find this product. Include terms related to the craft, material, region, and use case.

User Notes: {{{userNotes}}}
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
    try {
      const {output} = await generateProductDetailsPrompt(input);
      return output!;
    } catch (error: any) {
      if (error.message?.includes('503')) {
        throw new Error('The AI model is currently overloaded. Please try again in a few moments.');
      }
      throw error;
    }
  }
);
