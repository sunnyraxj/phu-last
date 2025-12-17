'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-blog-post.ts';
import '@/ai/flows/generate-product-details.ts';
