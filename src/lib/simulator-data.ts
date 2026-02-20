
export interface Ingredient {
  id: string;
  name: string;
  cost: number;
  earthScore: number;
  appeal: number;
  description: string;
  category: 'base' | 'fragrance' | 'packaging';
}

export const INGREDIENTS: Ingredient[] = [
  // Fragrances
  { id: 'synth_frag', name: 'Synthetic Fragrance', cost: 10, earthScore: 2, appeal: 9, category: 'fragrance', description: 'Mass-produced, cheap, but high chemical footprint.' },
  { id: 'ess_oil', name: 'Essential Oil', cost: 40, earthScore: 9, appeal: 6, category: 'fragrance', description: 'Pure plant extracts. Expensive but ethical.' },
  
  // Bases
  { id: 'palm_oil', name: 'Palm Oil Base', cost: 15, earthScore: 1, appeal: 5, category: 'base', description: 'Highly versatile but major driver of deforestation.' },
  { id: 'coconut_oil', name: 'Ethical Coconut Oil', cost: 30, earthScore: 8, appeal: 7, category: 'base', description: 'Fair-trade sourced from sustainable plantations.' },
  
  // Packaging
  { id: 'plastic', name: 'Plastic Bottle', cost: 5, earthScore: 1, appeal: 6, category: 'packaging', description: 'Cheap and clear, but creates permanent waste.' },
  { id: 'paper', name: 'Recycled Paper Wrap', cost: 15, earthScore: 9, appeal: 8, category: 'packaging', description: 'Compostable and artisanal aesthetic.' },
];

export const PRODUCT_TYPES = [
  { id: 'incense', name: 'Incense', baseCost: 100 },
  { id: 'candle', name: 'Hand-poured Candle', baseCost: 200 },
  { id: 'soap', name: 'Cold-process Soap', baseCost: 150 },
  { id: 'perfume', name: 'Perfume Roll-on', baseCost: 350 },
];

export const TOUR_QUESTIONS = [
  {
    question: "Maroma incense is famous for being 'charcoal-free'. Why is this important for health?",
    options: ["It smells better", "It reduces harmful smoke inhalation", "It burns faster"],
    correct: 1,
    reward: "Essential Oil Subsidized (Cost -50%)"
  },
  {
    question: "What is Maroma's core principle for business?",
    options: ["Profit first", "Care for Earth = Care for People", "Speed over Quality"],
    correct: 1,
    reward: "Bonus Trust (+20)"
  }
];
