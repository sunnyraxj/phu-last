import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GENAI_API_KEY, apiVersion: 'v1'})],
  model: 'gemini-1.5-flash-latest',
});
