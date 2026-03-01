"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2, 
  Zap,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Award,
  Package,
  Users,
  Activity,
  Megaphone,
  ShieldCheck,
  Loader2,
  X,
  Settings,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  PartyPopper,
  Star,
  Wrench,
  Lightbulb,
  Clock,
  AlertCircle,
  Coins,
  TrendingUp,
  ArrowUpRight,
  LayoutGrid,
  PlayCircle,
  CalendarDays,
  Info,
  CloudRain,
  Sun,
  Newspaper,
  Quote,
  TrendingDown,
  ExternalLink,
  Wand2,
  Search
} from "lucide-react";
import Image from "next/image";
import { 
  CATEGORIES, 
  INGREDIENT_BASES, 
  SOURCING_MODELS, 
  PACKAGING_TYPES, 
  PRODUCTION_METHODS, 
  TARGET_AUDIENCES, 
  PRICE_TIERS, 
  CORE_VALUES,
  MARKETING_CHANNELS
} from "@/lib/simulator-data";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from "recharts";
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase, useUser, useDoc, deleteDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, limit, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { generateMarketFeedback, type MarketFeedbackOutput } from "@/ai/flows/market-feedback";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TEAM_EMBLEMS = [
  { id: 'brand-10', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F10-01.png?alt=media&token=fa6aee12-86a5-4cf2-bd0c-2b18f822d65e' },
  { id: 'brand-11', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F11-01.png?alt=media&token=eb2cfcfa-7a1e-4097-9bf3-6c9b38d0d885' },
  { id: 'brand-12', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F12-01.png?alt=media&token=4ff97d12-c967-4e32-be10-49bfa6dc68f5' },
  { id: 'brand-13', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F13-01.png?alt=media&token=7b4e1e0d-f9be-4758-9eb8-51678eadcc31' },
  { id: 'brand-14', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F14-01.png?alt=media&token=883ae152-fea5-40c3-9cb5-20d73a0e1f60' },
  { id: 'brand-16', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F16-01.png?alt=media&token=60b457b6-ad41-4544-b124-bd93055c4f55' },
  { id: 'brand-17', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F17-01.png?alt=media&token=bdf30366-24cb-4d7a-be14-f8f2b2f9ccf3' },
  { id: 'brand-18', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F18-01.png?alt=media&token=a649f0b5-c642-4bfb-a467-a05de4a09cc1' },
  { id: 'brand-19', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F19-01.png?alt=media&token=05bdc083-e465-4c82-b42e-cc94aadba5d8' },
  { id: 'brand-2', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F2-01.png?alt=media&token=4c94e823-4cc3-43c3-bd2f-393b7ef69123' },
  { id: 'brand-3', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F3-01.png?alt=media&token=242a85c4-c6bd-4cf4-856b-9763f375db9f' },
  { id: 'brand-4', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F4-01.png?alt=media&token=24c47a94-c6a3-4da4-ba42-adeedad88e96' },
  { id: 'brand-5', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F5-01.png?alt=media&token=986c6d33-6c6d-42a1-8cfe-91129dcc553f' },
  { id: 'brand-6', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F6-01.png?alt=media&token=0f067a3a-ddd5-418f-b714-e714efd7282c' },
  { id: 'brand-7', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F7-01.png?alt=media&token=23f53117-a9d8-4907-964e-9281c41dfb86' },
  { id: 'brand-8', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F535b652d-ecad-4390-a1c0-eebada8459d6' },
  { id: 'brand-9', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F9-01.png?alt=media&token=41665223-538c-482e-ac5e-45835a6d8557' },
  { id: 'brand-main', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2FGame%20Logos-01.png?alt=media&token=be0a96fc-03fc-4e8d-bc3b-b4c9f5f374a2' },
];

const TITLE_IMAGE_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Product%20Game%20Title%202.png?alt=media&token=f7698e9d-9e74-45e2-a0c1-916f1b9904db";

const STARTUP_BUDGET = 1000000;

const DEFAULT_CONFIG = {
  category: "",
  format: "",
  ingredientBase: "",
  sourcingModel: "",
  packagingType: "",
  productionMethod: "",
  targetAudience: "",
  priceTier: "",
  coreValue: "",
  marketingChannels: [] as string[],
  message: "",
  customDetails: ""
};

const SEO_PHRASES = [
  { text: "Ethically Sourced. Purely Natural.", tags: ["ethical", "natural"] },
  { text: "Conscious Craft. Zero Compromise.", tags: ["ethical", "handcrafted"] },
  { text: "Sustainable Luxury for Mindful Living.", tags: ["ethical", "luxury"] },
  { text: "Artisan Handcrafted. Heritage Quality.", tags: ["handcrafted", "traditional"] },
  { text: "Authentic Maroma Traditions.", tags: ["traditional"] },
  { text: "Slow Crafted. Pure Intent.", tags: ["handcrafted"] },
  { text: "Precision Performance. Mass Appeal.", tags: ["industrial", "modern"] },
  { text: "Efficient Quality. Modern Value.", tags: ["industrial", "budget"] },
  { text: "Elevate Your Space with Pure Scent.", tags: ["hf"] },
  { text: "Nourish Your Skin. Naturally.", tags: ["bc"] },
  { text: "Zero Waste. Maximum Impact.", tags: ["zw", "ethical"] },
  { text: "Handmade with Love in Maroma.", tags: ["handcrafted"] },
  { text: "The Future of Ethical Beauty.", tags: ["bc", "ethical"] },
  { text: "Bespoke Aromatherapy for the Home.", tags: ["hf", "luxury"] },
];

const capScore = (val: number) => Math.min(98, Math.max(0, val));

export default function SimulatorPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [phase, setPhase] = useState<'intro' | 'lab' | 'market'>('intro');
  const [year, setYear] = useState(1);
  const [teamName, setTeamName] = useState("");
  const [selectedEmblem, setSelectedEmblem] = useState("");
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  const [budget, setBudget] = useState(STARTUP_BUDGET);
  const [lastYearProfit, setLastYearProfit] = useState(0);
  const [lastYearRevenue, setLastYearRevenue] = useState(0);

  const [aiFeedback, setAiFeedback] = useState<MarketFeedbackOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [playedAnimations, setPlayedAnimations] = useState<string[]>([]);

  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "simulator_events"), orderBy("timestamp", "desc"), limit(100));
  }, [firestore]);

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "simulator_sessions"), orderBy("createdAt", "desc"), limit(100));
  }, [firestore]);

  const { data: events } = useCollection(eventsQuery);
  const { data: sessions } = useCollection(sessionsQuery);

  const allWorkshopTeams = useMemo(() => {
    const teams = new Map<string, any>();
    
    sessions?.forEach(s => {
      teams.set(s.teamName, {
        ...s,
        status: 'complete',
        sourceCollection: 'simulator_sessions'
      });
    });
    
    events?.filter(e => e.type === 'join').forEach(e => {
      if (!teams.has(e.teamName)) {
        teams.set(e.teamName, {
          ...e,
          status: 'playing',
          scores: null,
          sourceCollection: 'simulator_events'
        });
      }
    });
    
    return Array.from(teams.values()).sort((a, b) => {
      const getAvg = (s: any) => {
        if (!s.scores) return -1;
        const sum = (s.scores.earth || 0) + (s.scores.trust || 0) + (s.scores.resonance || 0) + (s.scores.impact || 0) + (s.scores.longevity || 0);
        return sum / 5;
      };
      return getAvg(b) - getAvg(a);
    });
  }, [sessions, events]);

  const takenLogoTeams = useMemo(() => {
    const map = new Map<string, string>();
    allWorkshopTeams.forEach(t => {
      if (t.emblem) map.set(t.emblem, t.teamName);
    });
    return map;
  }, [allWorkshopTeams]);

  useEffect(() => {
    if (events && events.length > 0) {
      const latest = events[0];
      if (latest.id !== lastEventId) {
        if (lastEventId !== null && latest.type === 'join') {
          toast({
            variant: "translucent",
            title: "Player Joined",
            description: (
              <div className="flex items-center gap-6 mt-2">
                {latest.emblem && (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white shrink-0 border border-white/10 shadow-sm p-2">
                    <img src={latest.emblem} alt={latest.teamName} className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white leading-tight">
                    {latest.teamName} joined the game
                  </span>
                </div>
              </div>
            ),
          });
        }
        setLastEventId(latest.id);
      }
    }
  }, [events, lastEventId, toast]);

  useEffect(() => {
    if (phase === 'market' && isAnimating) {
      setAnimationProgress(0);
      const start = Date.now();
      const duration = 6000;

      const animate = () => {
        const now = Date.now();
        const progress = Math.min(1, (now - start) / duration);
        setAnimationProgress(progress);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [phase, isAnimating]);

  const selectedCategory = useMemo(() => CATEGORIES.find(c => c.id === config.category), [config.category]);
  const selectedBase = useMemo(() => INGREDIENT_BASES.find(b => b.id === config.ingredientBase), [config.ingredientBase]);
  const selectedSourcing = useMemo(() => SOURCING_MODELS.find(s => s.id === config.sourcingModel), [config.sourcingModel]);
  const selectedPackaging = useMemo(() => PACKAGING_TYPES.find(p => p.id === config.packagingType), [config.packagingType]);
  const selectedProduction = useMemo(() => PRODUCTION_METHODS.find(p => p.id === config.productionMethod), [config.productionMethod]);
  const selectedAudience = useMemo(() => TARGET_AUDIENCES.find(a => a.id === config.targetAudience), [config.targetAudience]);
  const selectedPriceTier = useMemo(() => PRICE_TIERS.find(p => p.id === config.priceTier), [config.priceTier]);
  const selectedValue = useMemo(() => CORE_VALUES.find(v => v.id === config.coreValue), [config.coreValue]);

  const investmentCost = useMemo(() => {
    const marketingCost = config.marketingChannels.reduce((acc, channelId) => {
      const channel = MARKETING_CHANNELS.find(c => c.id === channelId);
      return acc + (channel?.cost || 0);
    }, 0);

    return (
      (selectedBase?.investmentCost || 0) +
      (selectedSourcing?.investmentCost || 0) +
      (selectedPackaging?.investmentCost || 0) +
      (selectedProduction?.investmentCost || 0) +
      marketingCost
    );
  }, [config, selectedBase, selectedSourcing, selectedPackaging, selectedProduction]);

  const scores = useMemo(() => {
    const unitCost = Math.max(10, (selectedBase?.unitCost || 0) + (selectedSourcing?.unitCostDelta || 0) + (selectedPackaging?.unitCost || 0) + (selectedProduction?.unitCostDelta || 0));
    const retailPrice = unitCost * (1 + (selectedPriceTier?.margin || 0.3));
    
    const baseEarth = selectedBase?.earthScore || 5;
    const environmentalScore = (baseEarth * (selectedPackaging?.envMultiplier || 1)) * 10;

    let consistency = 1.0;
    if ((config.coreValue === 'zw' || config.coreValue === 'lcf') && config.packagingType === 'plastic') consistency -= 0.4;
    if (config.coreValue === 'fts' && config.sourcingModel === 'is') consistency -= 0.4;

    const hasChannels = config.marketingChannels.length > 0;
    const hasMessage = config.message.trim().length > 5;
    
    const marketingMultiplier = hasChannels ? 2.2 : 0.05; 
    const marketingClarity = hasMessage ? 1.4 : 0.6;
    
    const marketingResonanceRaw = hasChannels
      ? config.marketingChannels.reduce((acc, channelId) => {
          const channel = MARKETING_CHANNELS.find(c => channelId === c.id);
          return acc + (channel?.resonance[config.targetAudience || 'fam'] || 1);
        }, 0) / config.marketingChannels.length
      : 0.1;

    const appealScore = (selectedBase?.appeal || 1) * (selectedProduction?.authenticity || 1) * (selectedAudience?.baseAppeal || 1) * marketingResonanceRaw;
    const accessibility = (selectedPriceTier?.accessibility || 1) / (selectedAudience?.priceSensitivity || 1);
    
    let resonance = ((appealScore * 0.8) + (accessibility * 3.0)) * marketingClarity * marketingMultiplier * 35;

    const trustBase = (environmentalScore * 0.05) + (consistency * 3) + ((selectedPriceTier?.fairness || 1) * 2);
    let trust = (trustBase * 10) + (selectedSourcing?.trustBonus || 0) + (selectedProduction?.trustBonus || 0);

    if (trust < 30) resonance *= 0.4; 

    const longevity = (trust * 0.6) + ((selectedPriceTier?.margin || 0) * 40);

    // SEO Score Logic
    let seo = 20;
    if (config.message) {
      const msg = config.message.toLowerCase();
      const isEthical = ['eo', 'hi', 'co', 'pw', 'an'].includes(config.ingredientBase);
      const isHandcrafted = config.productionMethod === 'hsb';
      
      if (isEthical && (msg.includes('ethical') || msg.includes('sustainable') || msg.includes('pure') || msg.includes('natural'))) seo += 30;
      if (isHandcrafted && (msg.includes('artisan') || msg.includes('handcrafted') || msg.includes('batch'))) seo += 30;
      if (msg.length > 20) seo += 10;
      
      const isExactMatch = SEO_PHRASES.some(p => p.text.toLowerCase() === msg);
      if (isExactMatch) seo = Math.max(seo, 92);
    }

    return { 
      environmentalScore: capScore(environmentalScore), 
      trust: capScore(trust), 
      shortTermSales: capScore(resonance), 
      longevity: capScore(longevity), 
      unitCost, 
      retailPrice,
      consistency,
      socialImpact: capScore((selectedSourcing?.humanScore || 5) * 10),
      seoScore: capScore(seo)
    };
  }, [config, selectedBase, selectedSourcing, selectedPackaging, selectedProduction, selectedAudience, selectedPriceTier]);

  const overallScore = useMemo(() => {
    return (scores.environmentalScore + scores.trust + scores.shortTermSales + scores.socialImpact + scores.longevity) / 5;
  }, [scores]);

  const getStatsAtMonth = (mIndex: number) => {
    const month = mIndex + 1;
    let seasonalMultiplier = 1.0;
    
    if (month >= 3 && month <= 5) {
      if (config.category === 'bc') seasonalMultiplier = 1.4; 
      if (config.category === 'hf') seasonalMultiplier = 0.7; 
    }
    
    if (month >= 6 && month <= 8) {
      if (config.sourcingModel === 'lsf') seasonalMultiplier = 0.7; 
      if (config.category === 'hf') seasonalMultiplier = 1.25; 
    }
    
    if (month >= 10 && month <= 12) seasonalMultiplier = 1.6;

    const noise = (Math.sin(mIndex * 1.5) * 1.5);
    
    const baseSales = scores.shortTermSales * 2.5;
    const growthFactor = scores.shortTermSales < 1 
      ? 1.0 
      : Math.pow(1 + (scores.longevity / 600), mIndex);
    
    const revenue = baseSales * growthFactor * seasonalMultiplier;
    
    let trustModifier = 0;
    if (month >= 4) {
      const isEthical = ['eo', 'hi', 'co', 'pw', 'an'].includes(config.ingredientBase);
      trustModifier = isEthical ? 10 : -20;
    }

    const trust = Math.min(98, scores.trust + trustModifier + (mIndex * (scores.environmentalScore > 65 ? 0.8 : -1.5)) + noise);
    const impact = Math.min(98, scores.environmentalScore + (mIndex * 0.1) + noise);
    const awareness = Math.min(98, scores.shortTermSales + (mIndex * (scores.shortTermSales > 5 ? 4 : 0.5)) + noise);

    return {
      month,
      profit: Math.round(revenue),
      trust: Math.round(trust),
      impact: Math.round(impact),
      awareness: Math.round(awareness)
    };
  };

  const chartData = useMemo(() => {
    const pointsPerMonth = 10;
    const totalPoints = 12 * pointsPerMonth;
    return Array.from({ length: totalPoints }).map((_, i) => {
      const monthProgress = i / pointsPerMonth;
      const floorM = Math.floor(monthProgress);
      const ceilM = Math.min(11, Math.ceil(monthProgress));
      const t = monthProgress - floorM;

      const s1 = getStatsAtMonth(floorM);
      const s2 = getStatsAtMonth(ceilM);

      const interp = (v1: number, v2: number) => v1 + (v2 - v1) * t;

      return {
        month: monthProgress + 1,
        displayMonth: t === 0 ? floorM + 1 : null,
        profit: interp(s1.profit, s2.profit),
        trust: interp(s1.trust, s2.trust),
        impact: interp(s1.impact, s2.impact),
        awareness: interp(s1.awareness, s2.awareness)
      };
    });
  }, [scores, config]);

  const animatedChartData = useMemo(() => {
    if (phase !== 'market') return chartData.map(d => ({ ...d, profit: null, trust: null, impact: null, awareness: null }));
    return chartData.map((d, index) => {
      const threshold = (index + 1) / chartData.length;
      if (animationProgress >= threshold) return d;
      return { ...d, profit: null, trust: null, impact: null, awareness: null };
    });
  }, [chartData, animationProgress, phase]);

  const newsArticle = useMemo(() => {
    const isEthical = ['eo', 'hi', 'co', 'pw', 'an'].includes(config.ingredientBase);
    const isLocal = config.sourcingModel === 'lsf';
    const isIndustrial = config.sourcingModel === 'is';

    if (isEthical && isLocal) {
      return {
        headline: "The Soil Revolution: How Small Farmers are Redefining Luxury",
        snippet: "A breakthrough report in the Maroma Business Journal highlights a new wave of brands opting for high-integrity ingredients. Customer trust is soaring as transparency becomes the new gold standard.",
        outcome: "Trust Index +15%, Organic Growth Accelerated",
        type: 'positive'
      };
    } else if (!isEthical && isIndustrial) {
      return {
        headline: "The Hidden Cost of Fragrance: Investigation Reveals Synthetic Toll",
        snippet: "Consumer advocacy groups have flagged a rise in low-cost, high-impact synthetic bases. Brands using industrial bulk sourcing face heavy scrutiny as 'Greenwashing' claims gain traction online.",
        outcome: "Revenue -20%, Trust Index Plummeting",
        type: 'negative'
      };
    }
    
    return {
      headline: "Market Volatility: Seasonal Shifts Challenge New Entrants",
      snippet: "As seasonal weather patterns shift, the Maroma market sees a bifurcation between stable industrial brands and weather-sensitive local craft producers.",
      outcome: "Stability Profile: Moderate",
      type: 'neutral'
    };
  }, [config]);

  const milestones = useMemo(() => {
    const list = [];
    list.push({ month: 1, title: "Market Entry", desc: "First batch released to early adopters.", icon: PlayCircle });
    
    if (config.category === 'bc') {
      list.push({ month: 3, title: "Summer Demand", desc: "Soaring temperatures drive 40% spike in body care sales.", icon: Sun });
    } else if (config.category === 'hf') {
      list.push({ month: 3, title: "Summer Slump", desc: "Heat reduces interest in indoor fragrance stability.", icon: Sun });
    }

    list.push({ 
      month: 4, 
      title: newsArticle.headline, 
      desc: newsArticle.snippet, 
      icon: Newspaper 
    });

    if (config.marketingChannels.length > 0) {
      list.push({ month: 5, title: "Channel Resonance", desc: `Initial data from ${config.marketingChannels.length} channels shows targeted branding is taking root.`, icon: Megaphone });
    }

    if (config.sourcingModel === 'lsf') {
      list.push({ month: 7, title: "Monsoon Supply Lag", desc: "Heavy rains disrupt local farm logistics, leading to inventory gaps.", icon: CloudRain });
    } else {
      list.push({ month: 7, title: "Monsoon Stability", desc: "Bulk sourcing avoids weather-related delays.", icon: Package });
    }

    if (scores.trust > 70) {
      list.push({ month: 9, title: "Brand Authority", desc: "High ethical scores translating into strong secondary recommendations.", icon: ShieldCheck });
    }

    list.push({ month: 10, title: "Diwali Gifting Surge", desc: scores.shortTermSales > 40 ? "Massive holiday demand nearly triples Q4 revenue." : "Gifting seasonal boost noticed, though growth limited by low awareness.", icon: PartyPopper });
    list.push({ month: 12, title: "Year End Retention", desc: scores.longevity > 60 ? "Strong repeat purchase intent for Year 2." : "Initial novelty wearing off; pivot required for Year 2.", icon: Clock });

    return list;
  }, [scores, config, newsArticle]);

  const handleUpdateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleStartNewGame = () => {
    setPhase('intro');
    setTeamName("");
    setSelectedEmblem("");
    setYear(1);
    setBudget(STARTUP_BUDGET);
    setLastYearProfit(0);
    setLastYearRevenue(0);
    setAiFeedback(null);
    setAnimationProgress(0);
    setIsAnimating(false);
    setConfig(DEFAULT_CONFIG); 
    setTimeout(() => {
      document.getElementById('join-game-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const scrollToLab = () => {
    setPhase('lab');
    setTimeout(() => {
      document.getElementById('lab-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const scrollToMarket = () => {
    setPhase('market');
    const isMobile = window.innerWidth < 768;
    setTimeout(() => {
      const el = document.getElementById('analysis-dashboard');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: isMobile ? 'start' : 'center' });
    }, 100);
  };

  const handleEmblemSelect = (url: string) => {
    if (takenLogoTeams.has(url) && takenLogoTeams.get(url) !== teamName) return;
    setSelectedEmblem(url);
    setTimeout(() => {
      document.getElementById('enter-lab-trigger')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const toggleMarketingChannel = (id: string) => {
    const current = config.marketingChannels;
    const next = current.includes(id) ? current.filter(c => c !== id) : [...current, id];
    handleUpdateConfig('marketingChannels', next);
  };

  const broadcastStatus = (status: 'join' | 'lab' | 'market') => {
    if (firestore && teamName) {
      addDocumentNonBlocking(collection(firestore, "simulator_events"), {
        teamName,
        emblem: selectedEmblem,
        type: status,
        timestamp: serverTimestamp()
      });
    }
  };

  const handleJoinGame = () => {
    if (!teamName.trim() || !selectedEmblem) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please enter a team name and select a logo." });
      return;
    }
    broadcastStatus('join');
    setPhase('lab');
    broadcastStatus('lab');
    setTimeout(() => {
      document.getElementById('lab-header')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSwitchTeam = (team: any) => {
    setTeamName(team.teamName);
    setSelectedEmblem(team.emblem);
    if (team.status === 'complete') {
      setPhase('market');
      setConfig(team.config || DEFAULT_CONFIG);
      setYear(team.year || 1);
      setAiFeedback(team.aiFeedback);
      setLastYearRevenue(team.scores?.totalRevenue || (team.scores?.profit * 12 * 1000) || 0);
      setLastYearProfit(team.scores?.netProfit || ((team.scores?.profit * 12 * 1000) - (team.investmentCost || 500000)) || 0);
      
      if (!playedAnimations.includes(team.teamName)) {
        setIsAnimating(true);
        setAnimationProgress(0);
        setPlayedAnimations(prev => [...prev, team.teamName]);
      } else {
        setIsAnimating(false);
        setAnimationProgress(1);
      }
    } else {
      setPhase('lab');
      setConfig(team.config || DEFAULT_CONFIG);
      setAiFeedback(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const launchSimulation = async () => {
    if (investmentCost > budget) {
      toast({ variant: "destructive", title: "Budget Overrun", description: "Your strategy exceeds available capital." });
      return;
    }

    setPhase('market');
    setIsAiLoading(true);
    
    const isMobile = window.innerWidth < 768;
    setTimeout(() => {
      const el = document.getElementById('analysis-dashboard');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: isMobile ? 'start' : 'center' });
    }, 100);

    const awarenessVal = Math.round(getStatsAtMonth(11).awareness);
    let generatedFeedback: MarketFeedbackOutput | null = null;
    const richDescription = `${selectedBase?.name || "Standard"} ${config.format || "Product"}`;
    const channelNames = config.marketingChannels.map(id => MARKETING_CHANNELS.find(c => c.id === id)?.name || id);

    try {
      generatedFeedback = await generateMarketFeedback({
        teamName,
        productName: richDescription,
        ingredients: [selectedBase?.name || "Standard", selectedSourcing?.name || "Standard", selectedPackaging?.name || "Standard"],
        marketingChannels: channelNames,
        earthScore: Math.round(scores.environmentalScore),
        trustScore: Math.round(scores.trust),
        awarenessScore: awarenessVal,
        pricePoint: Math.round(scores.retailPrice),
        message: config.message,
        targetAudience: selectedAudience?.name || "General",
        coreValue: selectedValue?.name || "None",
        year: year
      });
      setAiFeedback(generatedFeedback);
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAiLoading(false);
      
      if (!playedAnimations.includes(teamName)) {
        setAnimationProgress(0);
        setTimeout(() => setIsAnimating(true), 1500);
        setPlayedAnimations(prev => [...prev, teamName]);
      } else {
        setIsAnimating(false);
        setAnimationProgress(1);
      }
    }

    const totalRevenue = Array.from({ length: 12 }).reduce((acc, _, i) => acc + getStatsAtMonth(i).profit, 0) * 1000;
    const yearProfit = totalRevenue - investmentCost;
    setLastYearRevenue(totalRevenue);
    setLastYearProfit(yearProfit);

    if (firestore) {
      addDocumentNonBlocking(collection(firestore, "simulator_sessions"), {
        teamName,
        emblem: selectedEmblem,
        productType: richDescription,
        ingredients: [selectedBase?.name || "Standard", selectedSourcing?.name || "Standard"],
        config: config,
        aiFeedback: generatedFeedback,
        year: year,
        investmentCost: investmentCost,
        scores: {
          earth: Math.round(scores.environmentalScore),
          trust: Math.round(scores.trust),
          resonance: Math.round(scores.shortTermSales),
          impact: Math.round(scores.socialImpact),
          profit: Math.round(getStatsAtMonth(11).profit),
          totalRevenue: totalRevenue,
          netProfit: yearProfit,
          longevity: Math.round(scores.longevity),
          seoScore: Math.round(scores.seoScore)
        },
        createdAt: serverTimestamp()
      });
      broadcastStatus('market');
    }
  };

  const handleNextYear = () => {
    const reinvestmentCapital = 800000 + (Math.max(0, lastYearProfit) * 0.8);
    setBudget(Math.round(reinvestmentCapital));
    setYear(prev => prev + 1);
    setPhase('lab');
    setIsAnimating(false);
    setAiFeedback(null);
    setConfig(DEFAULT_CONFIG); 
    toast({
      title: `Year ${year + 1} Capital Assigned`,
      description: `New budget: ₹${Math.round(reinvestmentCapital).toLocaleString()}.`
    });
  };

  const displayVal = (val: number) => Math.round(val * animationProgress);

  const filteredSuggestions = useMemo(() => {
    return SEO_PHRASES.filter(phrase => {
      const currentTags = [config.category, config.ingredientBase, config.sourcingModel, config.productionMethod];
      const isEthical = ['eo', 'hi', 'co', 'pw', 'an'].includes(config.ingredientBase);
      const isHandcrafted = config.productionMethod === 'hsb';
      const isIndustrial = config.productionMethod === 'mip';
      
      const tagsToMatch = [...currentTags];
      if (isEthical) tagsToMatch.push('ethical');
      if (isHandcrafted) tagsToMatch.push('handcrafted');
      if (isIndustrial) tagsToMatch.push('industrial');

      return phrase.tags.some(tag => tagsToMatch.includes(tag));
    });
  }, [config]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#1e293b] flex flex-col transition-colors duration-1000 relative overflow-x-hidden">
      <Navbar />
      
      <div className="fixed top-20 left-4 z-[100] flex flex-col gap-3">
        {isAdmin && (
          <Dialog open={isAdminPanelOpen} onOpenChange={setIsAdminPanelOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-accent/20 backdrop-blur-xl border-accent/20 text-accent hover:text-white hover:bg-accent/40 rounded-full h-12 px-6 transition-all shadow-2xl">
                <Settings className="w-4 h-4 mr-2" /> Admin Tools
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[2.5rem] bg-slate-900 border-white/10 text-white">
              <DialogHeader>
                <CardTitle className="text-2xl font-headline flex items-center gap-2">
                  <Activity className="w-6 h-6 text-accent" /> Workshop Reset
                </CardTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] mt-6 pr-4">
                <div className="space-y-4">
                  {allWorkshopTeams?.map(s => (
                    <div key={`${s.sourceCollection}-${s.id}`} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
                          {s.emblem && <img src={s.emblem} alt="Logo" className="w-full h-full object-contain" />}
                        </div>
                        <div>
                          <p className="font-bold text-lg leading-none mb-1">{s.teamName}</p>
                          <p className="text-xs text-slate-400 uppercase tracking-widest">{s.status === 'playing' ? 'In Laboratory' : s.productType}</p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="text-slate-500 hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={() => deleteDocumentNonBlocking(doc(firestore!, s.sourceCollection, s.id))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full relative">
        <section className="mb-12 text-center space-y-8 animate-in fade-in duration-1000">
          <div className="relative h-48 w-full max-w-2xl mx-auto">
            <Image src={TITLE_IMAGE_URL} alt="The Maroma Product Game" fill className="object-contain" priority />
          </div>
          <p className="text-xl text-slate-300 font-body leading-relaxed max-w-3xl mx-auto px-4">
            Strategically design your ethical product and test its viability in the Maroma Market Simulator.
          </p>

          <div className="flex flex-col items-center gap-8 relative z-[100] mt-12">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 flex items-center shadow-2xl">
              <button
                onClick={handleStartNewGame}
                className={cn(
                  "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                  phase === 'intro' ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-white"
                )}
              >
                Join Game
              </button>
              <button
                onClick={scrollToLab}
                className={cn(
                  "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                  phase === 'lab' ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-white"
                )}
              >
                Laboratory
              </button>
              <button
                onClick={scrollToMarket}
                className={cn(
                  "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                  phase === 'market' ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-white"
                )}
              >
                Market Simulator
              </button>
            </div>

            {allWorkshopTeams.length > 0 && (
              <ScrollArea className="w-full max-w-4xl">
                <div className="flex justify-center gap-4 pb-4 px-4">
                  {allWorkshopTeams.map((team) => (
                    <button
                      key={`${team.sourceCollection}-${team.id}`}
                      onClick={() => handleSwitchTeam(team)}
                      className={cn(
                        "flex items-center gap-3 p-2 pr-4 rounded-full border transition-all shrink-0",
                        teamName === team.teamName ? "bg-accent/20 border-accent scale-105" : "bg-white/5 border-white/10 hover:bg-white/10 opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-white p-1 overflow-hidden shrink-0">
                        <img src={team.emblem} alt="" className="w-full h-full object-contain" />
                      </div>
                      <span className={cn("text-[10px] font-bold whitespace-nowrap uppercase tracking-widest", teamName === team.teamName ? "text-white" : "text-slate-400")}>
                        {team.teamName}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </section>

        {phase === 'intro' && (
          <div id="join-game-section" className="max-w-3xl mx-auto py-12 px-6 sm:px-10 bg-white rounded-[3rem] shadow-2xl border border-white/10 space-y-10 scroll-mt-24">
            <div className="space-y-4">
              <Label className="text-sm font-bold text-slate-500 tracking-[0.2em] uppercase px-2">1. Team Name</Label>
              <Input placeholder="Enter Team Name Here" value={teamName} onChange={e => setTeamName(e.target.value)} className="rounded-3xl h-20 text-center text-2xl sm:text-3xl font-headline border-primary/20 bg-slate-50" />
            </div>
            <div className="space-y-6">
              <Label className="text-sm font-bold text-slate-500 tracking-[0.2em] uppercase px-2">2. Team Logo</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {TEAM_EMBLEMS.map((emblem) => {
                  const claimingTeam = takenLogoTeams.get(emblem.url);
                  const isTakenByOther = !!claimingTeam && claimingTeam !== teamName;
                  const isSelected = selectedEmblem === emblem.url;

                  return (
                    <button 
                      key={emblem.id} 
                      disabled={isTakenByOther}
                      onClick={() => handleEmblemSelect(emblem.url)} 
                      className={cn(
                        "relative aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-300 bg-white shadow-md group",
                        isSelected ? "border-primary scale-110 z-10 shadow-xl" : "border-transparent",
                        isTakenByOther ? "cursor-not-allowed border-none shadow-none" : "hover:border-muted-foreground/30"
                      )}
                    >
                      <img src={emblem.url} alt="Logo" className="w-full h-full object-contain p-0.5" />
                      {isSelected && <div className="absolute inset-0 bg-primary/10 flex items-center justify-center"><CheckCircle2 className="text-primary w-8 h-8" /></div>}
                      {isTakenByOther && (
                        <div className="absolute inset-0 bg-orange-600/90 flex flex-col items-center justify-center p-2 text-center animate-in fade-in duration-500">
                          <span className="text-[10px] font-black text-white leading-tight uppercase drop-shadow-md">
                            {claimingTeam}
                          </span>
                          <div className="absolute bottom-0 inset-x-0 bg-black/20 text-[7px] text-white font-bold py-1 uppercase tracking-tighter">CLAIMED</div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button id="enter-lab-trigger" onClick={handleJoinGame} className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-20 text-2xl font-bold shadow-2xl transition-all active:scale-95 flex items-center justify-center">
              Enter Laboratory <ChevronRight className="w-8 h-8 ml-2" />
            </Button>
          </div>
        )}

        {phase === 'lab' && (
          <div id="lab-header" className="animate-in fade-in duration-1000 mt-8 scroll-mt-24">
            <div className="col-span-full mb-16 flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 backdrop-blur-xl">
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-[2rem] p-2 shadow-xl shrink-0">
                  <img src={selectedEmblem} alt="Team Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <Badge className="bg-primary text-white mb-2 font-bold uppercase tracking-widest">Year {year}</Badge>
                  <h1 className="text-2xl sm:text-4xl font-headline font-bold text-white tracking-tight">{teamName}</h1>
                </div>
              </div>
              
              <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
                <div className={cn(
                  "p-6 rounded-[2rem] border transition-all flex flex-col items-center md:items-end w-full sm:w-auto",
                  investmentCost > budget ? "bg-rose-500/10 border-rose-500/50" : "bg-emerald-500/10 border-emerald-500/50"
                )}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Coins className="w-3 h-3 text-accent" /> Available Capital
                  </span>
                  <div className="text-3xl font-headline font-bold text-white">₹{(budget - investmentCost).toLocaleString()}</div>
                  <Progress value={(investmentCost / budget) * 100} className="h-1.5 w-40 mt-3" />
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-4">Investment Ceiling: ₹{budget.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-12 pb-20">
                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2"><Award className="w-6 h-6 text-accent" /> 1. The Product</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Category</Label>
                      <Select value={config.category} onValueChange={v => handleUpdateConfig('category', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none text-primary font-bold"><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Format</Label>
                      <Select value={config.format} onValueChange={v => handleUpdateConfig('format', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none text-primary font-bold"><SelectValue placeholder="Select Format" /></SelectTrigger>
                        <SelectContent>{selectedCategory?.formats.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2"><Sparkles className="w-6 h-6 text-accent" /> 2. Ingredients</h3>
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-white/10 uppercase font-bold">Base Cost: ₹{(selectedBase?.investmentCost || 0).toLocaleString()}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Ingredient Base</Label>
                      <Select value={config.ingredientBase} onValueChange={v => handleUpdateConfig('ingredientBase', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none text-primary font-bold"><SelectValue placeholder="Select Base" /></SelectTrigger>
                        <SelectContent>{INGREDIENT_BASES.map(i => <SelectItem key={i.id} value={i.id}>{i.name} (₹{(i.investmentCost/1000).toLocaleString()}k)</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Sourcing Model</Label>
                      <Select value={config.sourcingModel} onValueChange={v => handleUpdateConfig('sourcingModel', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none text-primary font-bold"><SelectValue placeholder="Select Sourcing" /></SelectTrigger>
                        <SelectContent>{SOURCING_MODELS.map(s => <SelectItem key={s.id} value={s.id}>{s.name} (₹{(s.investmentCost/1000).toLocaleString()}k)</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2"><Package className="w-6 h-6 text-accent" /> 3. Production</h3>
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-white/10 uppercase font-bold">Process Cost: ₹{(selectedProduction?.investmentCost || 0).toLocaleString()}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Packaging Type</Label>
                      <Select value={config.packagingType} onValueChange={v => handleUpdateConfig('packagingType', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none text-primary font-bold"><SelectValue placeholder="Select Packaging" /></SelectTrigger>
                        <SelectContent>{PACKAGING_TYPES.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (₹{(p.investmentCost/1000).toLocaleString()}k)</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Production Method</Label>
                      <Select value={config.productionMethod} onValueChange={v => handleUpdateConfig('productionMethod', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none text-primary font-bold"><SelectValue placeholder="Select Method" /></SelectTrigger>
                        <SelectContent>{PRODUCTION_METHODS.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (₹{(p.investmentCost/1000).toLocaleString()}k)</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-12 pb-20">
                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2"><Megaphone className="w-6 h-6 text-accent" /> 4. Market Awareness</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                      {MARKETING_CHANNELS.map(channel => (
                        <div key={channel.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", config.marketingChannels.includes(channel.id) ? "bg-accent/20 border-accent" : "bg-white/5 border-transparent")} onClick={() => toggleMarketingChannel(channel.id)}>
                          <Checkbox checked={config.marketingChannels.includes(channel.id)} onCheckedChange={() => toggleMarketingChannel(channel.id)} className="border-white/30" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{channel.name}</span>
                            <span className="text-base font-black text-accent uppercase tracking-tight">₹{(channel.cost/1000).toLocaleString()}k</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Brand Positioning Message</Label>
                      <div className="relative group">
                        <Input 
                          placeholder="e.g., Authentic Craft. Sustainable Impact." 
                          value={config.message} 
                          onChange={e => handleUpdateConfig('message', e.target.value)} 
                          className="rounded-xl h-14 bg-white border-none text-primary font-medium pr-12 text-lg shadow-inner" 
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="rounded-full hover:bg-slate-100 text-accent h-10 w-10">
                                <Wand2 className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 border-none shadow-2xl bg-white">
                              <DropdownMenuLabel className="flex items-center gap-2 text-primary font-headline">
                                <Sparkles className="w-4 h-4 text-accent" /> SEO Powerful Phrases
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <ScrollArea className="h-64">
                                {filteredSuggestions.length > 0 ? (
                                  filteredSuggestions.map((phrase, i) => (
                                    <DropdownMenuItem 
                                      key={i} 
                                      onClick={() => handleUpdateConfig('message', phrase.text)}
                                      className="rounded-xl p-3 cursor-pointer hover:bg-accent/5 focus:bg-accent/5 transition-colors group"
                                    >
                                      <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors line-clamp-2">
                                          {phrase.text}
                                        </span>
                                        <div className="flex gap-1">
                                          {phrase.tags.map(tag => (
                                            <span key={tag} className="text-[8px] uppercase font-bold tracking-widest text-slate-400">#{tag}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </DropdownMenuItem>
                                  ))
                                ) : (
                                  <div className="p-4 text-center text-xs text-slate-400 italic font-body">
                                    Select ingredients to unlock suggestions.
                                  </div>
                                )}
                              </ScrollArea>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-2">Click the wand for strategy-aligned SEO phrases.</p>
                    </div>
                  </div>
                </section>

                <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl">
                  <div className="flex justify-between items-center pt-6 border-t-2 border-accent/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Target Price Point</span>
                      <span className="text-[10px] text-slate-500">Retail Target</span>
                    </div>
                    <span className="text-4xl font-bold text-white font-headline">₹{Math.round(scores.retailPrice || 0)}</span>
                  </div>
                </div>

                <Button 
                  onClick={launchSimulation} 
                  disabled={investmentCost > budget || !config.ingredientBase}
                  className={cn(
                    "w-full rounded-full h-20 text-xl font-bold shadow-xl transition-all active:scale-95",
                    investmentCost > budget ? "bg-rose-600 text-white cursor-not-allowed" : "bg-accent hover:bg-accent/90 text-white"
                  )}
                >
                  {!config.ingredientBase ? "Select Strategy First" : investmentCost > budget ? "Insufficient Capital" : "Launch Year Strategy"} <ArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {phase === 'market' && (
          <div id="analysis-dashboard" className="space-y-8 animate-in fade-in zoom-in-95 duration-1000 mt-8 scroll-mt-24">
            <div className="text-center space-y-6 flex flex-col items-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 bg-white rounded-3xl p-2 shadow-2xl animate-in zoom-in duration-700">
                  <img src={selectedEmblem} alt={teamName} className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-accent uppercase tracking-widest">{teamName}</h3>
              </div>
              <div className="space-y-2">
                <Badge className="bg-green-500 text-white px-4 py-1 rounded-full font-bold uppercase tracking-widest text-[10px]">Year {year} Cycle Analysis</Badge>
                <h2 className="text-4xl font-headline font-bold text-white">Simulation Insights</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              <div className="lg:col-span-1 space-y-4">
                {[
                  { label: "Annual Revenue", val: `₹${displayVal(lastYearRevenue).toLocaleString()}`, icon: TrendingUp, color: "text-blue-400" },
                  { label: "Market Trust", val: `${displayVal(getStatsAtMonth(11).trust)}%`, icon: ShieldCheck, color: "text-green-400" },
                  { label: "Net Profit", val: `₹${displayVal(lastYearProfit).toLocaleString()}`, icon: ArrowUpRight, color: lastYearProfit > 0 ? "text-emerald-400" : "text-rose-400" },
                  { label: "Awareness", val: `${displayVal(getStatsAtMonth(11).awareness)}%`, icon: Users, color: "text-blue-400" },
                  { label: "SEO Power", val: `${displayVal(scores.seoScore)}%`, icon: Search, color: "text-accent" }
                ].map((m, i) => (
                  <Card key={i} className="rounded-[1.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-md">
                    <CardContent className="p-6 flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                        <m.icon className={cn("w-6 h-6", m.color || "text-slate-400")} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-0.5">{m.label}</p>
                        <p className="text-2xl font-bold text-white font-headline leading-none">{m.val}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="lg:col-span-3 rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl p-4 sm:p-8 relative overflow-hidden">
                <CardHeader className="px-0 pt-0 flex flex-col gap-6">
                  <CardTitle className="font-headline text-3xl text-white">Market Trajectory</CardTitle>
                  {animationProgress === 1 && (
                    <div className="w-full max-w-xl animate-in slide-in-from-top-4 duration-1000">
                      <div className="bg-accent/20 border border-accent/30 rounded-2xl p-4 flex items-center justify-between gap-4 backdrop-blur-2xl">
                        <div className="flex items-center gap-3">
                          <div className="bg-accent p-2 rounded-xl shadow-lg shrink-0"><PartyPopper className="w-5 h-5 text-white" /></div>
                          <div className="flex flex-col">
                            <h3 className="text-sm font-headline font-bold text-white">Cycle Complete</h3>
                            <p className="text-[10px] text-slate-300 font-body uppercase tracking-[0.2em] font-bold">Next Funding Round Ready</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={handleNextYear} className="bg-primary hover:bg-primary/90 text-white rounded-full px-4 text-xs font-bold gap-2">
                          Advance <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                
                <div className="h-[400px] sm:h-[500px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={animatedChartData} key={`${teamName}-${phase}-${animationProgress === 1}`} margin={{ top: 40, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="month" 
                        stroke="rgba(255,255,255,0.3)" 
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                        type="number"
                        domain={[1, 12]}
                        ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                      />
                      <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                      
                      {animationProgress >= 0.08 && (
                        <ReferenceLine x={1} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" label={{ position: 'top', value: 'Market Entry', fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 'bold' }} />
                      )}
                      
                      {animationProgress >= 0.33 && (
                        <ReferenceLine 
                          x={4} 
                          stroke="#ec4899" 
                          strokeDasharray="3 3" 
                          label={{ 
                            position: 'top', 
                            value: newsArticle.headline.length > 20 ? newsArticle.headline.substring(0, 17) + '...' : newsArticle.headline, 
                            fill: '#ec4899', 
                            fontSize: 9, 
                            fontWeight: 'bold' 
                          }} 
                        />
                      )}

                      {animationProgress >= 0.5 && (
                        <ReferenceLine 
                          x={6} 
                          stroke="#3b82f6" 
                          strokeDasharray="3 3" 
                          label={{ 
                            position: 'top', 
                            value: config.sourcingModel === 'lsf' ? 'Monsoon Supply Lag' : 'Monsoon Stability', 
                            fill: '#3b82f6', 
                            fontSize: 9, 
                            fontWeight: 'bold' 
                          }} 
                        />
                      )}

                      {animationProgress >= 0.83 && (
                        <ReferenceLine 
                          x={10} 
                          stroke="#fbbf24" 
                          strokeDasharray="3 3" 
                          label={{ 
                            position: 'top', 
                            value: 'Diwali Gifting Surge', 
                            fill: '#fbbf24', 
                            fontSize: 9, 
                            fontWeight: 'bold',
                            className: "animate-in fade-in duration-1000"
                          }} 
                        />
                      )}

                      <Tooltip content={({ active, payload, label }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="bg-slate-950 border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[180px] backdrop-blur-2xl">
                              <p className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Month {Math.floor(Number(label))}</p>
                              <div className="space-y-2">
                                {payload.map((entry: any) => (
                                  <div key={entry.name} className="flex justify-between gap-4 items-center">
                                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: entry.color }}>{entry.name}</span>
                                    <span className="text-sm font-black text-white">{Math.round(entry.value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Legend verticalAlign="top" align="center" height={60} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Line isAnimationActive={false} type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="REVENUE" dot={false} connectNulls />
                      <Line isAnimationActive={false} type="monotone" dataKey="awareness" stroke="#fbbf24" strokeWidth={3} name="AWARENESS" dot={false} connectNulls />
                      <Line isAnimationActive={false} type="monotone" dataKey="trust" stroke="#22c55e" strokeWidth={3} name="TRUST" dot={false} connectNulls />
                      <Line isAnimationActive={false} type="monotone" dataKey="impact" stroke="#ec4899" strokeWidth={3} name="EARTH SCORE" dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
              <div className="space-y-8">
                <Card className={cn(
                  "rounded-[2.5rem] p-8 border-l-8 overflow-hidden relative group animate-in slide-in-from-left duration-1000",
                  newsArticle.type === 'positive' ? "bg-emerald-950/20 border-emerald-500" : 
                  newsArticle.type === 'negative' ? "bg-rose-950/20 border-rose-500" : 
                  "bg-slate-900/40 border-slate-500"
                )}>
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <Badge className={cn(
                        "rounded-full px-4 py-1 uppercase tracking-widest text-[10px] font-black border-none",
                        newsArticle.type === 'positive' ? "bg-emerald-500 text-white" : 
                        newsArticle.type === 'negative' ? "bg-rose-500 text-white" : 
                        "bg-slate-500 text-white"
                      )}>
                        Breaking News: Month 4 Cycle
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Latest Edition
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-2xl sm:text-3xl font-headline font-bold text-white leading-tight group-hover:text-accent transition-colors">
                        "{newsArticle.headline}"
                      </h3>
                      <p className="text-slate-300 font-body leading-relaxed text-base sm:text-lg">
                        {newsArticle.snippet}
                      </p>
                    </div>

                    <div className={cn(
                      "p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border",
                      newsArticle.type === 'positive' ? "bg-emerald-500/10 border-emerald-500/30" : 
                      newsArticle.type === 'negative' ? "bg-rose-500/10 border-rose-500/30" : 
                      "bg-white/5 border-white/10"
                    )}>
                      <div className="flex items-center gap-3">
                        {newsArticle.type === 'positive' ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-rose-400" />}
                        <span className="text-sm font-bold text-white uppercase tracking-widest">{newsArticle.outcome}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 text-xs gap-2 justify-start sm:justify-center">Read Full Story <ExternalLink className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-[2.5rem] bg-white/5 backdrop-blur-sm text-white border border-white/10 p-8 space-y-8">
                  <CardHeader className="p-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-headline text-3xl">Strategic Insights</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-400 border-none">Yearly Event Log</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {milestones.map((m, i) => {
                        const Icon = m.icon;
                        return (
                          <div key={i} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all",
                                displayVal(12) >= m.month ? "bg-accent/20 border-accent text-accent" : "bg-white/5 border-white/10 text-slate-500"
                              )}>
                                {m.month}
                              </div>
                              {i !== milestones.length - 1 && <div className="w-px h-full bg-white/10 my-1" />}
                            </div>
                            <div className={cn(
                              "flex-grow pb-6 transition-opacity",
                              displayVal(12) >= m.month ? "opacity-100" : "opacity-20"
                            )}>
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className="w-3.5 h-3.5 text-accent" />
                                <h4 className="text-sm font-bold text-white group-hover:text-accent transition-colors">{m.title}</h4>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                        <Activity className="w-3 h-3" /> Core Performance Drivers
                      </div>
                      {[
                        { label: "Earth Score", val: scores.environmentalScore, color: "bg-emerald-500" },
                        { label: "Trust Index", val: scores.trust, color: "bg-blue-500" },
                        { label: "Resonance", val: scores.shortTermSales, color: "bg-amber-500" }
                      ].map((s, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-end"><span className="text-xs font-bold uppercase tracking-widest opacity-60">{s.label}</span><span className="text-2xl font-bold font-headline">{displayVal(s.val)}%</span></div>
                          <Progress value={s.val * animationProgress} className={cn("h-3 bg-white/10", `[&>div]:${s.color}`)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="lg:col-span-1 rounded-[2.5rem] bg-slate-900/60 backdrop-blur-xl text-white border border-white/10 flex flex-col">
                <CardHeader className="bg-white/5 border-b border-white/5 py-6 flex flex-row items-center justify-between">
                  <CardTitle className="font-headline text-2xl uppercase">Analyst Report</CardTitle>
                  {aiFeedback && <Badge className="bg-accent text-white uppercase font-bold tracking-widest">{aiFeedback.analystTone}</Badge>}
                </CardHeader>
                <CardContent className="p-8 space-y-8 flex-grow">
                  {isAiLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="w-12 h-12 animate-spin text-accent" /><p className="text-slate-400 font-medium animate-pulse text-xs uppercase tracking-widest">Compiling Year 1 Data...</p></div>
                  ) : aiFeedback ? (
                    <div className="space-y-8 animate-in fade-in duration-1000">
                      <p className="text-lg text-slate-200 leading-relaxed font-body italic">"{aiFeedback.feedbackText}"</p>
                      
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">Customer Voice</Label>
                        <p className="text-xl font-headline font-bold text-white">"{aiFeedback.customerQuote}"</p>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                          <Activity className="w-4 h-4" /> Market Sentiment
                        </h4>
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <Label className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                              <ThumbsUp className="w-3 h-3" /> Success Signals
                            </Label>
                            {aiFeedback.positiveReviews.map((r, i) => (
                              <div key={i} className="text-xs p-4 bg-green-500/5 rounded-2xl border border-green-500/10 text-slate-300">
                                "{r}"
                              </div>
                            ))}
                          </div>
                          <div className="space-y-4">
                            <Label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                              <ThumbsDown className="w-3 h-3" /> Friction Points
                            </Label>
                            {aiFeedback.negativeReviews.map((r, i) => (
                              <div key={i} className="space-y-2">
                                <div className="text-xs p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 text-slate-300 italic">
                                  "{r}"
                                </div>
                                {aiFeedback.negativeReviewFixes[i] && (
                                  <div className="text-[9px] px-3 font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                                    <Wrench className="w-3 h-3" /> Fix: {aiFeedback.negativeReviewFixes[i]}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <div className="p-6 bg-accent/10 rounded-3xl border border-accent/20 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" /> Strategic Adjustment
                          </h4>
                          <p className="text-sm text-slate-200 leading-relaxed font-body">
                            {aiFeedback.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-slate-500 italic">Launch Year 1 Strategy to receive the analysis.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
