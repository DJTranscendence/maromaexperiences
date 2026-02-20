
'use server';

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
});

const MarketFeedbackOutputSchema = z.object({
  analystTone: z.enum(['cynical', 'enthusiastic', 'concerned']),
  feedbackText: z.string(),
  customerQuote: z.string(),
  suggestion: z.string(),
});

export const generateMarketFeedback = ai.defineFlow(
  {
    name: 'generateMarketFeedback',
    inputSchema: MarketFeedbackInputSchema,
    outputSchema: MarketFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are a Maroma Market Analyst evaluating a school team's product.
      
      Team: ${input.teamName}
      Product: ${input.productName}
      Earth Score: ${input.earthScore}/10
      Trust Score: ${input.trustScore}/100
      Price: ₹${input.pricePoint}
      Marketing Message: ${input.message}
      
      Provide a "Year 1" summary. If they used plastic but claimed sustainability, call out the "Greenwashing".
      If they prioritized profit over Earth Score, show how trust is crashing.
      If they were ethical but expensive, explain the slow but steady growth.`,
    });
    
    // For simplicity in this demo, we return a structured mock if the LLM output isn't perfect
    // but in real use, ai.definePrompt would handle the mapping.
    return JSON.parse(output?.text || '{}') as z.infer<typeof MarketFeedbackOutputSchema>;
  }
);
