import { NextRequest, NextResponse } from 'next/server';
import { generateProductDetails } from '@/ai/flows/generate-product-details';
import { z } from 'zod';

export const maxDuration = 60; // Vercel hobby tier max duration

const InputSchema = z.object({
  imageDataUri: z.string(),
  userNotes: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedBody = InputSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.flatten() }, { status: 400 });
    }

    const { imageDataUri, userNotes } = parsedBody.data;

    const result = await generateProductDetails({
      imageDataUri,
      userNotes,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/generate-product-details:', error);

    let errorMessage = 'An unexpected error occurred.';
    let statusCode = 500;

    if (error.message) {
        if (error.message.includes('503')) {
            errorMessage = 'The AI model is currently overloaded. Please try again in a few moments.';
            statusCode = 503;
        } else if (error.message.includes('API key not valid')) {
            errorMessage = 'The AI service could not be reached. Please check the server configuration.';
            statusCode = 500;
        } else {
            errorMessage = error.message;
        }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
