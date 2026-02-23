export interface IngredientBase {
  id: string;
  name: string;
  unitCost: number; // Cost per unit produced
  investmentCost: number; // R&D and sourcing setup cost
  earthScore: number;
  humanScore: number;
  appeal: number;
}

export interface SourcingModel {
  id: string;
  name: string;
  humanScore: number;
  trustBonus: number;
  investmentCost: number;
  unitCostDelta: number;
}

export interface PackagingType {
  id: string;
  name: string;
  envMultiplier: number;
  investmentCost: number;
  unitCost: number;
}

export interface ProductionMethod {
  id: string;
  name: string;
  investmentCost: number;
  unitCostDelta: number;
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

export interface MarketingChannel {
  id: string;
  name: string;
  cost: number;
  resonance: Record<string, number>;
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
  { id: 'eo', name: 'Essential oils (ethical)', unitCost: 120, investmentCost: 250000, earthScore: 9, humanScore: 9, appeal: 7 },
  { id: 'sf', name: 'Synthetic fragrance', unitCost: 25, investmentCost: 50000, earthScore: 2, humanScore: 3, appeal: 9 },
  { id: 'hi', name: 'Herbal infusion', unitCost: 65, investmentCost: 150000, earthScore: 8, humanScore: 8, appeal: 5 },
  { id: 'co', name: 'Coconut oil (ethical source)', unitCost: 80, investmentCost: 180000, earthScore: 8, humanScore: 9, appeal: 7 },
  { id: 'po', name: 'Palm oil derivative', unitCost: 30, investmentCost: 60000, earthScore: 1, humanScore: 4, appeal: 6 },
  { id: 'pw', name: 'Plant wax (soy/coconut)', unitCost: 90, investmentCost: 200000, earthScore: 8, humanScore: 7, appeal: 7 },
  { id: 'pf', name: 'Paraffin wax', unitCost: 35, investmentCost: 70000, earthScore: 1, humanScore: 3, appeal: 6 },
  { id: 'an', name: 'Alcohol base (natural)', unitCost: 55, investmentCost: 120000, earthScore: 7, humanScore: 8, appeal: 6 },
  { id: 'as', name: 'Alcohol base (synthetic)', unitCost: 20, investmentCost: 40000, earthScore: 2, humanScore: 3, appeal: 6 },
];

export const SOURCING_MODELS: SourcingModel[] = [
  { id: 'lsf', name: 'Local small farmers', humanScore: 10, trustBonus: 10, investmentCost: 120000, unitCostDelta: 45 },
  { id: 'ftc', name: 'Fair trade cooperative', humanScore: 9, trustBonus: 8, investmentCost: 90000, unitCostDelta: 30 },
  { id: 'is', name: 'Industrial supplier', humanScore: 3, trustBonus: -5, investmentCost: 20000, unitCostDelta: -15 },
  { id: 'ibd', name: 'Imported bulk distributor', humanScore: 4, trustBonus: -2, investmentCost: 40000, unitCostDelta: -5 },
  { id: 'uwm', name: 'Upcycled waste materials', humanScore: 7, trustBonus: 15, investmentCost: 150000, unitCostDelta: 15 },
];

export const PACKAGING_TYPES: PackagingType[] = [
  { id: 'none', name: 'No packaging', envMultiplier: 1.5, investmentCost: 0, unitCost: 0 },
  { id: 'paper', name: 'Recycled paper wrap', envMultiplier: 1.2, investmentCost: 30000, unitCost: 15 },
  { id: 'glass', name: 'Glass jar', envMultiplier: 1.0, investmentCost: 120000, unitCost: 65 },
  { id: 'metal', name: 'Refillable metal tin', envMultiplier: 1.3, investmentCost: 150000, unitCost: 85 },
  { id: 'pouch', name: 'Compostable pouch', envMultiplier: 1.4, investmentCost: 80000, unitCost: 40 },
  { id: 'plastic', name: 'Plastic container', envMultiplier: 0.2, investmentCost: 40000, unitCost: 10 },
];

export const PRODUCTION_METHODS: ProductionMethod[] = [
  { id: 'hsb', name: 'Handcrafted small batch', investmentCost: 350000, unitCostDelta: 110, authenticity: 1.5, trustBonus: 15 },
  { id: 'sef', name: 'Semi-automated ethical facility', investmentCost: 250000, unitCostDelta: 65, authenticity: 1.2, trustBonus: 10 },
  { id: 'mip', name: 'Mass industrial production', investmentCost: 80000, unitCostDelta: 20, authenticity: 0.8, trustBonus: -10 },
  { id: 'spw', name: 'Solar-powered workshop', investmentCost: 450000, unitCostDelta: 95, authenticity: 1.1, trustBonus: 20 },
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
  { id: 'budget', name: '10% Margin (Budget)', accessibility: 1.0, margin: 0.1, fairness: 0.9 },
  { id: 'accessible', name: '30% Margin (Accessible)', accessibility: 0.8, margin: 0.3, fairness: 1.0 },
  { id: 'premium', name: '60% Margin (Premium)', accessibility: 0.4, margin: 0.6, fairness: 0.8 },
  { id: 'luxury', name: '100% Margin (Luxury)', accessibility: 0.1, margin: 1.0, fairness: 0.6 },
];

export const CORE_VALUES: CoreValue[] = [
  { id: 'zw', name: 'Zero waste', description: 'Eliminating all forms of environmental refuse.' },
  { id: 'vp', name: 'Vegan purity', description: 'Strictly plant-based and cruelty-free.' },
  { id: 'fts', name: 'Fair trade sourcing', description: 'Ensuring every worker is paid a living wage.' },
  { id: 'lcf', name: 'Low carbon footprint', description: 'Minimizing energy impact in every step.' },
  { id: 'ce', name: 'Community empowerment', description: 'Supporting local artisan development.' },
  { id: 'ml', name: 'Mindful living', description: 'Designing for stillness and presence.' },
  { id: 'euc', name: 'Enviromentally-Unfriendly but Cheap', description: 'Prioritizing low price over environmental concerns.' },
  { id: 'len', name: 'Looks Environmental but is not', description: 'Marketing a sustainable image while ignoring real impact.' },
];

export const MARKETING_CHANNELS: MarketingChannel[] = [
  { id: 'fb', name: 'Facebook Ads', cost: 120000, resonance: { stu: 0.5, fam: 1.2, med: 0.8, lux: 0.7, eco: 0.9, bud: 1.1 } },
  { id: 'ig', name: 'Instagram Content', cost: 150000, resonance: { stu: 1.3, fam: 0.9, med: 1.1, lux: 1.2, eco: 1.2, bud: 0.8 } },
  { id: 'inf', name: 'Key Influencers', cost: 350000, resonance: { stu: 1.5, fam: 0.7, med: 1.2, lux: 1.4, eco: 1.3, bud: 0.6 } },
  { id: 'fly', name: 'Local Flyers', cost: 30000, resonance: { stu: 0.8, fam: 1.0, med: 0.7, lux: 0.4, eco: 0.6, bud: 1.2 } },
  { id: 'pos', name: 'Store Posters', cost: 50000, resonance: { stu: 1.1, fam: 1.0, med: 0.8, lux: 0.6, eco: 0.7, bud: 1.1 } },
];
