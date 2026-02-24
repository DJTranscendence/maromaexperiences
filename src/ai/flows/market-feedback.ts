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
  awarenessScore: z.number().describe('0-100 percentage of market awareness.'),
  pricePoint: z.number(),
  message: z.string(),
  targetAudience: z.string(),
  coreValue: z.string(),
  year: z.number().optional(),
});
export type MarketFeedbackInput = z.infer<typeof MarketFeedbackInputSchema>;

const MarketFeedbackOutputSchema = z.object({
  analystTone: z.enum(['cynical', 'enthusiastic', 'concerned', 'neutral']),
  feedbackText: z.string().describe('A 2-3 sentence analysis of the product performance, specifically acknowledging awareness vs effectiveness.'),
  customerQuote: z.string().describe('A "voice of the customer" snippet.'),
  suggestion: z.string().describe('A specific suggestion for Year 2 improvement.'),
  positiveReviews: z.array(z.string()).describe('Exactly 4 unique, fun, and specific customer reviews.'),
  negativeReviews: z.array(z.string()).describe('Exactly 4 unique customer friction points.'),
  negativeReviewFixes: z.array(z.string()).describe('Exactly 4 actionable suggestions linked to Laboratory settings.'),
});
export type MarketFeedbackOutput = z.infer<typeof MarketFeedbackOutputSchema>;

const marketFeedbackPrompt = ai.definePrompt({
  name: 'marketFeedbackPrompt',
  input: { schema: MarketFeedbackInputSchema },
  output: { schema: MarketFeedbackOutputSchema },
  prompt: `You are a Senior Maroma Market Analyst evaluating a student team's product prototype.
      
Team: {{{teamName}}}
Year: {{{year}}}
Product: {{{productName}}}
Audience: {{{targetAudience}}}
Awareness: {{{awarenessScore}}}%
Earth/Trust: {{{earthScore}}}/{{{trustScore}}}
Price: ₹{{{pricePoint}}}
Marketing: {{{message}}} via {{#each marketingChannels}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

CRITICAL - ALIGNMENT & LOGIC:
1. AWARENESS LOGIC: If Awareness is ABOVE 50%, you MUST NOT say "I haven't seen it". Instead, talk about why people who HAVE seen it are buying or ignoring it.
2. INVISIBILITY: Only if awareness is BELOW 30% should you focus on "the brand is invisible". 
3. GREENWASHING: If ingredients are synthetic but message is "sustainable/pure", be 'cynical' and call out the disconnect.
4. ETHICAL MASTERPIECE: If Earth/Trust > 80 but Awareness < 30, use 'concerned' and call it a "hidden gem that needs a megaphone".
5. REPETITION: Avoid boilerplate. Use vivid, organic language.

Generate EXACTLY 4 positive and 4 negative customer reviews. 
For EACH negative review, provide a matching "Suggested Action" that is a specific setting change in the laboratory.`,
});

export async function generateMarketFeedback(input: MarketFeedbackInput): Promise<MarketFeedbackOutput> {
  try {
    const { output } = await marketFeedbackPrompt(input);
    if (!output) throw new Error("Invalid model output");
    return output;
  } catch (err) {
    console.warn("Market Feedback Generation failed, using robust fallback:", err);
    
    const isVisible = input.awarenessScore > 50;
    
    return {
      analystTone: isVisible ? 'neutral' : 'concerned',
      feedbackText: isVisible 
        ? `Year ${input.year || 1} saw high market visibility. While many people encountered the brand, conversion was mixed based on your pricing and core value alignment.`
        : `The Year ${input.year || 1} market response was limited. Your ethical foundation is solid, but the brand currently lacks the visibility required to reach your target audience.`,
      customerQuote: isVisible 
        ? "I see this brand everywhere on social media, but I'm not sure if the price matches the handcrafted claims."
        : "I love the idea of local sourcing, but I've actually never seen this in the shops I visit.",
      suggestion: isVisible ? 'Refine your pricing strategy or message clarity.' : 'Expand your marketing channels to increase visibility.',
      positiveReviews: [
        "The scent is unique and feels very natural.", 
        "Beautifully presented, you can really feel the quality.",
        "Finally, a product that doesn't trigger my allergies.",
        "Love the local sourcing story behind this."
      ],
      negativeReviews: [
        isVisible ? "I see the ads constantly but the price feels a bit high for what it is." : "I found this by accident, they should really advertise more.",
        "I can't find enough info about the ingredients.",
        "The packaging feels a bit industrial for an artisan brand.",
        "Sustainability claims are great but I'm skeptical of the base oils used."
      ],
      negativeReviewFixes: [
        isVisible ? "Lower 'Price Tier' to increase accessible conversion." : "Add 'Instagram' to 'Marketing Channels'.",
        "Improve your 'Brand Positioning Message' to be more transparent.",
        "Switch 'Packaging Type' to 'Recycled Paper' or 'Glass'.",
        "Upgrade your 'Ingredient Base' to 'Essential Oils' in the lab."
      ]
    };
  }
}
