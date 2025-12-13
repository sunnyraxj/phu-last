'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating blog post content
 * (title, slug, and content) based on an image and user-provided notes.
 *
 * @module src/ai/flows/generate-blog-post
 *
 * @interface GenerateBlogPostInput - The input type for the flow.
 * @interface GenerateBlogPostOutput - The output type for the flow.
 * @function generateBlogPost - A function that takes GenerateBlogPostInput and returns a Promise of GenerateBlogPostOutput.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBlogPostInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo related to the blog post, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userNotes: z.string().describe('Additional notes or keywords provided by the user to guide content generation.'),
});
export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostInputSchema>;

const GenerateBlogPostOutputSchema = z.object({
  title: z.string().describe('A creative, SEO-friendly title for the blog post.'),
  slug: z.string().describe("A URL-friendly slug for the blog post, derived from the title."),
  content: z.string().describe('A well-written, engaging, and SEO-optimized blog post content.'),
});
export type GenerateBlogPostOutput = z.infer<typeof GenerateBlogPostOutputSchema>;

/**
 * This function takes an image and user notes and uses a generative AI model
 * to create a blog post title, slug, and content.
 * @param input The image and user notes.
 * @returns The generated blog post details.
 */
export async function generateBlogPost(input: GenerateBlogPostInput): Promise<GenerateBlogPostOutput> {
  return generateBlogPostFlow(input);
}

const generateBlogPostPrompt = ai.definePrompt({
  name: 'generateBlogPostPrompt',
  input: {schema: GenerateBlogPostInputSchema},
  output: {schema: GenerateBlogPostOutputSchema},
  prompt: `You are an expert content writer and SEO specialist for an e-commerce store that sells authentic handicrafts from North-East India.
Your task is to write a blog post based on the provided image and user notes.

The blog post should be engaging, informative, and optimized for search engines.
- The title should be catchy and include relevant keywords.
- The slug should be a URL-friendly version of the title.
- The content should be well-structured, easy to read, and provide value to the reader. It should subtly promote the products or lifestyle associated with the image.

User Notes: {{{userNotes}}}
Blog Post Image: {{media url=imageDataUri}}
`,
});

const generateBlogPostFlow = ai.defineFlow(
  {
    name: 'generateBlogPostFlow',
    inputSchema: GenerateBlogPostInputSchema,
    outputSchema: GenerateBlogPostOutputSchema,
  },
  async input => {
    try {
      const {output} = await generateBlogPostPrompt(input);
      // Generate slug from the title
      if(output?.title) {
        output.slug = output.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
      return output!;
    } catch (error: any) {
      if (error.message?.includes('503')) {
        throw new Error('The AI model is currently overloaded. Please try again in a few moments.');
      }
      throw error;
    }
  }
);
