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
  marketingChannels: z.array(z.string()).describe('The channels used to promote the product.'),
  earthScore: z.number(),
  trustScore: z.number(),
  pricePoint: z.number(),
  message: z.string(),
  targetAudience: z.string(),
  coreValue: z.string(),
  year: z.number().optional(),
});
export type MarketFeedbackInput = z.infer<typeof MarketFeedbackInputSchema>;

const MarketFeedbackOutputSchema = z.object({
  analystTone: z.enum(['cynical', 'enthusiastic', 'concerned']),
  feedbackText: z.string().describe('A 2-3 sentence analysis of the product performance, specifically mentioning marketing effectiveness.'),
  customerQuote: z.string().describe('A "voice of the customer" snippet.'),
  suggestion: z.string().describe('A specific suggestion for Year 2 improvement.'),
  positiveReviews: z.array(z.string()).describe('Exactly 4 short positive customer reviews (one sentence each).'),
  negativeReviews: z.array(z.string()).describe('Exactly 4 short negative customer reviews (one sentence each).'),
  negativeReviewFixes: z.array(z.string()).describe('Exactly 4 short, actionable suggestions matching each negative review that MUST be a specific change to the Laboratory settings.'),
});
export type MarketFeedbackOutput = z.infer<typeof MarketFeedbackOutputSchema>;

const marketFeedbackPrompt = ai.definePrompt({
  name: 'marketFeedbackPrompt',
  input: { schema: MarketFeedbackInputSchema },
  output: { schema: MarketFeedbackOutputSchema },
  prompt: `You are a Senior Maroma Market Analyst evaluating a student team's product prototype.
      
Team: {{{teamName}}}
Current Year: Year {{{year}}}
Product: {{{productName}}} (Targeting {{{targetAudience}}})
Core Value: {{{coreValue}}}
Earth Score: {{{earthScore}}}/100
Trust Score: {{{trustScore}}}%
Price: ₹{{{pricePoint}}}
Marketing Message: "{{{message}}}"
Marketing Channels: {{#each marketingChannels}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Ingredients: {{#each ingredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Provide a "Year {{{year}}}" simulation summary. 

CRITICAL - MARKETING EVALUATION:
- If they have NO marketing channels selected or a deliberately obscure/cryptic marketing strategy, use a 'concerned' tone. Explain that despite any product quality, the brand is "invisible" to the market and consumer awareness is near zero.
- If they used plastic or synthetic base but claimed sustainability/zero-waste, use a 'cynical' tone and call out the "Greenwashing".
- If they prioritized profit over Earth Score, show how trust is declining among their target audience.
- If they hit the sweet spot of ethics, resonance, and strong marketing, be 'enthusiastic'.

Generate EXACTLY 4 positive and 4 negative customer reviews. 
If marketing is missing, negative reviews should mention "Never heard of this brand" or "Hard to find information".

For EACH negative review, provide a matching "Suggested Action" (one short sentence) that MUST BE a specific setting change available in the laboratory (e.g., "Add 'Instagram' to 'Marketing Channels'").`,
});

export async function generateMarketFeedback(input: MarketFeedbackInput): Promise<MarketFeedbackOutput> {
  try {
    const { output } = await marketFeedbackPrompt(input);
    if (!output || !output.positiveReviews || output.positiveReviews.length === 0) {
      throw new Error("Invalid model output");
    }
    return output;
  } catch (err) {
    console.warn("Market Feedback Generation failed, using robust fallback:", err);
    return {
      analystTone: 'concerned',
      feedbackText: `The Year ${input.year || 1} market response was mixed. While the concept shows promise, the brand currently lacks the visibility required to reach your target audience.`,
      customerQuote: "I like the idea, but I've never actually seen this in any of the shops I visit.",
      suggestion: 'Expand your marketing channels to increase brand awareness.',
      positiveReviews: [
        "The scent is unique and feels very natural.", 
        "I love the mission of this brand and what it stands for.",
        "Beautifully presented, you can really feel the handcrafted quality.",
        "Finally, a product that doesn't trigger my allergies with synthetic chemicals."
      ],
      negativeReviews: [
        "It is a bit expensive for my daily routine.", 
        "I can't find any information about where this is made.",
        "The marketing is a bit too cryptic for me to understand the product.",
        "Shipping took longer than expected and there was too much waste in the box."
      ],
      negativeReviewFixes: [
        "Change 'Price Tier' to 'Accessible' or 'Budget' strategy.",
        "Add 'Facebook' or 'Instagram' to 'Marketing Channels'.",
        "Clarify your 'Marketing Message' in the laboratory.",
        "Change 'Packaging Type' to 'No Packaging' or 'Compostable Pouch' to reduce waste."
      ]
    };
  }
}
