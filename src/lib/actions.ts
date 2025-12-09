'use server';

import { recommendCrafts } from "@/ai/flows/craft-recommendations";
import { z } from "zod";

const recommendationSchema = z.object({
  preferences: z.string().min(10, { message: "Please describe your preferences in a bit more detail." }),
  browsingHistory: z.string(),
});

export type RecommendationState = {
  recommendations?: string;
  error?: string;
  fieldErrors?: {
    preferences?: string[];
    browsingHistory?: string[];
  };
};

export async function getRecommendations(
  prevState: RecommendationState,
  formData: FormData
): Promise<RecommendationState> {
  const validatedFields = recommendationSchema.safeParse({
    preferences: formData.get('preferences'),
    browsingHistory: formData.get('browsingHistory'),
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid input.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    const result = await recommendCrafts(validatedFields.data);
    return { recommendations: result.recommendations };
  } catch (error) {
    console.error("AI recommendation error:", error);
    return { error: "We couldn't generate recommendations at this time. Please try again later." };
  }
}
