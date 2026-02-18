'use server';
/**
 * @fileOverview This file provides a Genkit flow for generating detailed tour and workshop descriptions.
 *
 * - generateTourDescription - A function that generates a detailed tour description based on provided basic details.
 * - GenerateTourDescriptionInput - The input type for the generateTourDescription function.
 * - GenerateTourDescriptionOutput - The return type for the generateTourDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTourDescriptionInputSchema = z.object({
  tourName: z.string().describe('The name of the tour or workshop.'),
  highlights: z
    .string()
    .describe('Key highlights or main attractions of the tour.'),
  location: z.string().describe('The geographical location where the tour takes place.'),
  duration: z.string().describe('The duration of the tour (e.g., "3 hours", "Full day", "2 days").'),
  targetAudience: z
    .string()
    .describe('The intended audience for the tour (e.g., "History enthusiasts", "Families with young children", "Corporate teams").'),
});
export type GenerateTourDescriptionInput = z.infer<
  typeof GenerateTourDescriptionInputSchema
>;

const GenerateTourDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A compelling and detailed description for the tour or workshop.'),
});
export type GenerateTourDescriptionOutput = z.infer<
  typeof GenerateTourDescriptionOutputSchema
>;

export async function generateTourDescription(
  input: GenerateTourDescriptionInput
): Promise<GenerateTourDescriptionOutput> {
  return generateTourDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTourDescriptionPrompt',
  input: {schema: GenerateTourDescriptionInputSchema},
  output: {schema: GenerateTourDescriptionOutputSchema},
  prompt: `You are an expert travel marketing copywriter. Your task is to create a compelling and detailed description for a new tour or workshop based on the provided information. The description should be engaging, highlight key selling points, and appeal to the target audience.

Tour Name: {{{tourName}}}
Highlights: {{{highlights}}}
Location: {{{location}}}
Duration: {{{duration}}}
Target Audience: {{{targetAudience}}}

Please generate a detailed, captivating description for this tour:`,
});

const generateTourDescriptionFlow = ai.defineFlow(
  {
    name: 'generateTourDescriptionFlow',
    inputSchema: GenerateTourDescriptionInputSchema,
    outputSchema: GenerateTourDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
