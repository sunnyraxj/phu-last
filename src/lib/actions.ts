
'use server';

import { z } from "zod";

export type RecommendationState = {
  recommendations?: string;
  error?: string;
  fieldErrors?: {
    preferences?: string[];
    browsingHistory?: string[];
  };
};
