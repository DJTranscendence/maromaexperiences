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
  positiveReviews: z.array(z.string()).describe('Exactly 4 short positive customer reviews (one sentence each).'),
  negativeReviews: z.array(z.string()).describe('Exactly 4 short negative customer reviews (one sentence each).'),
  negativeReviewFixes: z.array(z.string()).describe('Exactly 4 short, actionable suggestions matching each negative review (e.g., "Switch to glass packaging").'),
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

Also generate EXACTLY 4 positive and 4 negative customer reviews. 
Reviews should be 1 sentence long, sounding like real social media comments or website feedback.
For EACH negative review, provide a matching "Suggested Action" (one short sentence) that the team should take in the next iteration to fix that specific issue.

Base the reviews on the specific choices made: if they chose 'handcrafted', reviews should mention the artisan feel. If they chose 'plastic', reviews might mention environmental concerns.`,
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
      feedbackText: 'The market response was mixed. While the concept shows promise, the alignment between your values and production methods needs refinement.',
      customerQuote: "I like the idea, but I'm not sure if I can trust the ingredients.",
      suggestion: 'Review your sourcing model to ensure it matches your brand promise.',
      positiveReviews: [
        "The scent is unique and feels very natural.", 
        "I love the mission of this brand and what it stands for.",
        "Beautifully presented, you can really feel the handcrafted quality.",
        "Finally, a product that doesn't trigger my allergies with synthetic chemicals."
      ],
      negativeReviews: [
        "It is a bit expensive for my daily routine.", 
        "The packaging doesn't feel as premium as the price suggests.",
        "I found the marketing message a bit confusing compared to the actual product.",
        "Shipping took longer than expected and there was too much waste in the box."
      ],
      negativeReviewFixes: [
        "Switch to a 'Budget' or 'Accessible' profit margin strategy.",
        "Change packaging to 'Glass' or 'Metal' for a more premium feel.",
        "Simplify your marketing message to focus on one core value.",
        "Review your 'Packaging Type' to reduce waste and shipping weight."
      ]
    };
  }
}