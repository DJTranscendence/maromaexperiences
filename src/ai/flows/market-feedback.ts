'use server';
/**
 * @fileOverview A market analysis AI agent for the Maroma Product Game.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MarketFeedbackInputSchema = z.object({
  teamName: z.string(),
  productName: z.string(),
  ingredients: z.array(z.string()),
  earthScore: z.number(),
  trustScore: z.number(),
  pricePoint: z.number(),
  message: z.string(),
  targetAudience: z.string(),
  coreValue: z.string(),
});
export type MarketFeedbackInput = z.infer<typeof MarketFeedbackInputSchema>;

const MarketFeedbackOutputSchema = z.object({
  analystTone: z.enum(['cynical', 'enthusiastic', 'concerned']),
  feedbackText: z.string().describe('A 2-3 sentence analysis of the product performance.'),
  customerQuote: z.string().describe('A "voice of the customer" snippet.'),
  suggestion: z.string().describe('A specific suggestion for Year 2 improvement.'),
  positiveReviews: z.array(z.string()).describe('2-3 short positive customer reviews (one sentence each).'),
  negativeReviews: z.array(z.string()).describe('2-3 short negative customer reviews (one sentence each).'),
});
export type MarketFeedbackOutput = z.infer<typeof MarketFeedbackOutputSchema>;

const marketFeedbackPrompt = ai.definePrompt({
  name: 'marketFeedbackPrompt',
  input: { schema: MarketFeedbackInputSchema },
  output: { schema: MarketFeedbackOutputSchema },
  prompt: `You are a Senior Maroma Market Analyst evaluating a student team's product prototype.
      
Team: {{{teamName}}}
Product: {{{productName}}} (Targeting {{{targetAudience}}})
Core Value: {{{coreValue}}}
Earth Score: {{{earthScore}}}/100
Trust Score: {{{trustScore}}}%
Price: ₹{{{pricePoint}}}
Marketing Message: "{{{message}}}"
Ingredients: {{#each ingredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Provide a "Year 1" simulation summary. 
- If they used plastic or synthetic base but claimed sustainability/zero-waste, use a 'cynical' tone and call out the "Greenwashing".
- If they prioritized profit over Earth Score, show how trust is declining among their target audience.
- If they were ethical but very expensive for a budget audience, explain the slow growth.
- If they hit the sweet spot of ethics and resonance, be 'enthusiastic'.

Also generate 2-3 positive and 2-3 negative customer reviews. Reviews should be 1 sentence long and sound like real social media or website comments.

Your response must be structured as JSON.`,
});

export async function generateMarketFeedback(input: MarketFeedbackInput): Promise<MarketFeedbackOutput> {
  const { output } = await marketFeedbackPrompt(input);
  if (!output) {
    return {
      analystTone: 'concerned',
      feedbackText: 'The market response was mixed. While the concept shows promise, the alignment between your values and production methods needs refinement.',
      customerQuote: "I like the idea, but I'm not sure if I can trust the ingredients.",
      suggestion: 'Review your sourcing model to ensure it matches your brand promise.',
      positiveReviews: ["The scent is unique and feels very natural.", "I love the mission of this brand."],
      negativeReviews: ["It is a bit expensive for my daily routine.", "The packaging doesn't feel as premium as the price suggests."],
    };
  }
  return output;
}
