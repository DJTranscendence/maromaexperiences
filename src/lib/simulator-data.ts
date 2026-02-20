export interface IngredientBase {
  id: string;
  name: string;
  cost: number;
  earthScore: number;
  humanScore: number;
  appeal: number;
}

export interface SourcingModel {
  id: string;
  name: string;
  humanScore: number;
  trustBonus: number;
  costDelta: number;
}

export interface PackagingType {
  id: string;
  name: string;
  envMultiplier: number;
  cost: number;
}

export interface ProductionMethod {
  id: string;
  name: string;
  costDelta: number;
  authenticity: number;
  trustBonus: number;
}

export interface TargetAudience {
  id: string;
  name: string;
  priceSensitivity: number;
  trustImpact: number;
  baseAppeal: number;
}

export interface PriceTier {
  id: string;
  name: string;
  accessibility: number;
  margin: number;
  fairness: number;
}

export interface CoreValue {
  id: string;
  name: string;
  description: string;
}

export const CATEGORIES = [
  { id: 'hf', name: 'Home Fragrance', formats: ['Candle', 'Incense sticks', 'Resin blend', 'Room mist', 'Oil diffuser blend'] },
  { id: 'bc', name: 'Body Care', formats: ['Soap bar', 'Solid balm', 'Roll-on perfume', 'Body mist', 'Lotion bar'] },
  { id: 'hc', name: 'Home Care', formats: ['Surface cleaner', 'Fabric spray', 'Laundry booster', 'Dish bar'] },
  { id: 'do', name: 'Decorative Object', formats: ['Scented sculpture', 'Ceramic scent stone', 'Wax tablet', 'Decorative candle'] },
  { id: 'rm', name: 'Ritual / Meditation', formats: ['Meditation kit', 'Resin incense set', 'Aromatherapy oil blend', 'Chakra candle set'] },
  { id: 'gi', name: 'Gifting Item', formats: ['Travel kit', 'Mini sampler set', 'Refill bundle'] },
];

export const INGREDIENT_BASES: IngredientBase[] = [
  { id: 'eo', name: 'Essential oils (ethical)', cost: 50, earthScore: 9, humanScore: 9, appeal: 7 },
  { id: 'sf', name: 'Synthetic fragrance', cost: 10, earthScore: 2, humanScore: 3, appeal: 9 },
  { id: 'hi', name: 'Herbal infusion', cost: 30, earthScore: 8, humanScore: 8, appeal: 5 },
  { id: 'co', name: 'Coconut oil (ethical source)', cost: 30, earthScore: 8, humanScore: 9, appeal: 7 },
  { id: 'po', name: 'Palm oil derivative', cost: 10, earthScore: 1, humanScore: 4, appeal: 6 },
  { id: 'pw', name: 'Plant wax (soy/coconut)', cost: 35, earthScore: 8, humanScore: 7, appeal: 7 },
  { id: 'pf', name: 'Paraffin wax', cost: 12, earthScore: 1, humanScore: 3, appeal: 6 },
  { id: 'an', name: 'Alcohol base (natural)', cost: 25, earthScore: 7, humanScore: 8, appeal: 6 },
  { id: 'as', name: 'Alcohol base (synthetic)', cost: 10, earthScore: 2, humanScore: 3, appeal: 6 },
];

export const SOURCING_MODELS: SourcingModel[] = [
  { id: 'lsf', name: 'Local small farmers', humanScore: 10, trustBonus: 10, costDelta: 20 },
  { id: 'ftc', name: 'Fair trade cooperative', humanScore: 9, trustBonus: 8, costDelta: 15 },
  { id: 'is', name: 'Industrial supplier', humanScore: 3, trustBonus: -5, costDelta: -10 },
  { id: 'ibd', name: 'Imported bulk distributor', humanScore: 4, trustBonus: -2, costDelta: -5 },
  { id: 'uwm', name: 'Upcycled waste materials', humanScore: 7, trustBonus: 15, costDelta: 5 },
];

export const PACKAGING_TYPES: PackagingType[] = [
  { id: 'none', name: 'No packaging', envMultiplier: 1.5, cost: 0 },
  { id: 'paper', name: 'Recycled paper wrap', envMultiplier: 1.2, cost: 10 },
  { id: 'glass', name: 'Glass jar', envMultiplier: 1.0, cost: 30 },
  { id: 'metal', name: 'Refillable metal tin', envMultiplier: 1.3, cost: 40 },
  { id: 'pouch', name: 'Compostable pouch', envMultiplier: 1.4, cost: 20 },
  { id: 'plastic', name: 'Plastic container', envMultiplier: 0.2, cost: 5 },
];

export const PRODUCTION_METHODS: ProductionMethod[] = [
  { id: 'hsb', name: 'Handcrafted small batch', costDelta: 50, authenticity: 1.5, trustBonus: 15 },
  { id: 'sef', name: 'Semi-automated ethical facility', costDelta: 30, authenticity: 1.2, trustBonus: 10 },
  { id: 'mip', name: 'Mass industrial production', costDelta: 10, authenticity: 0.8, trustBonus: -10 },
  { id: 'spw', name: 'Solar-powered workshop', costDelta: 40, authenticity: 1.1, trustBonus: 20 },
];

export const TARGET_AUDIENCES: TargetAudience[] = [
  { id: 'stu', name: 'Students', priceSensitivity: 1.5, trustImpact: 0.8, baseAppeal: 0.8 },
  { id: 'fam', name: 'Families', priceSensitivity: 1.0, trustImpact: 1.0, baseAppeal: 0.9 },
  { id: 'med', name: 'Meditation community', priceSensitivity: 0.7, trustImpact: 1.2, baseAppeal: 0.7 },
  { id: 'lux', name: 'Luxury buyers', priceSensitivity: 0.5, trustImpact: 0.7, baseAppeal: 1.0 },
  { id: 'eco', name: 'Eco-conscious consumers', priceSensitivity: 1.1, trustImpact: 1.5, baseAppeal: 0.8 },
  { id: 'bud', name: 'Budget shoppers', priceSensitivity: 2.0, trustImpact: 0.5, baseAppeal: 0.6 },
];

export const PRICE_TIERS: PriceTier[] = [
  { id: 'budget', name: 'Budget', accessibility: 1.0, margin: 0.1, fairness: 0.9 },
  { id: 'accessible', name: 'Accessible', accessibility: 0.8, margin: 0.3, fairness: 1.0 },
  { id: 'premium', name: 'Premium', accessibility: 0.4, margin: 0.6, fairness: 0.8 },
  { id: 'luxury', name: 'Luxury', accessibility: 0.1, margin: 0.8, fairness: 0.6 },
];

export const CORE_VALUES: CoreValue[] = [
  { id: 'zw', name: 'Zero waste', description: 'Eliminating all forms of environmental refuse.' },
  { id: 'vp', name: 'Vegan purity', description: 'Strictly plant-based and cruelty-free.' },
  { id: 'fts', name: 'Fair trade sourcing', description: 'Ensuring every worker is paid a living wage.' },
  { id: 'lcf', name: 'Low carbon footprint', description: 'Minimizing energy impact in every step.' },
  { id: 'ce', name: 'Community empowerment', description: 'Supporting local artisan development.' },
  { id: 'ml', name: 'Mindful living', description: 'Designing for stillness and presence.' },
];
