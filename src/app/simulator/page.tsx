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
  AlertCircle
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
  Legend
} from "recharts";
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase, useUser, useDoc, deleteDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, limit, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { generateMarketFeedback, type MarketFeedbackOutput } from "@/ai/flows/market-feedback";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  { id: 'brand-8', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F8-01.png?alt=media&token=535b652d-ecad-4390-a1c0-eebada8459d6' },
  { id: 'brand-9', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F9-01.png?alt=media&token=41665223-538c-482e-ac5e-45835a6d8557' },
  { id: 'brand-main', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2FGame%20Logos-01.png?alt=media&token=be0a96fc-03fc-4e8d-bc3b-b4c9f5f374a2' },
];

const TITLE_IMAGE_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Product%20Game%20Title%202.png?alt=media&token=f7698e9d-9e74-45e2-a0c1-916f1b9904db";

const capScore = (val: number) => Math.min(98, Math.max(0, val));

export default function SimulatorPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [phase, setPhase] = useState<'intro' | 'lab' | 'market'>('intro');
  const [year, setYear] = useState(1);
  const [teamName, setTeamName] = useState("");
  const [selectedEmblem, setSelectedEmblem] = useState(TEAM_EMBLEMS[0].url);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  const [aiFeedback, setAiFeedback] = useState<MarketFeedbackOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

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
    return query(collection(firestore, "simulator_sessions"), orderBy("createdAt", "desc"), limit(50));
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

  const [config, setConfig] = useState({
    category: CATEGORIES[0].id,
    format: CATEGORIES[0].formats[0],
    ingredientBase: INGREDIENT_BASES[0].id,
    sourcingModel: SOURCING_MODELS[0].id,
    packagingType: PACKAGING_TYPES[0].id,
    productionMethod: PRODUCTION_METHODS[0].id,
    targetAudience: TARGET_AUDIENCES[0].id,
    priceTier: PRICE_TIERS[0].id,
    coreValue: CORE_VALUES[0].id,
    marketingChannels: [] as string[],
    message: "",
    customDetails: ""
  });

  const selectedCategory = useMemo(() => CATEGORIES.find(c => c.id === config.category) || CATEGORIES[0], [config.category]);
  const selectedBase = useMemo(() => INGREDIENT_BASES.find(b => b.id === config.ingredientBase) || INGREDIENT_BASES[0], [config.ingredientBase]);
  const selectedSourcing = useMemo(() => SOURCING_MODELS.find(s => s.id === config.sourcingModel) || SOURCING_MODELS[0], [config.sourcingModel]);
  const selectedPackaging = useMemo(() => PACKAGING_TYPES.find(p => p.id === config.packagingType) || PACKAGING_TYPES[0], [config.packagingType]);
  const selectedProduction = useMemo(() => PRODUCTION_METHODS.find(p => p.id === config.productionMethod) || PRODUCTION_METHODS[0], [config.productionMethod]);
  const selectedAudience = useMemo(() => TARGET_AUDIENCES.find(a => a.id === config.targetAudience) || TARGET_AUDIENCES[0], [config.targetAudience]);
  const selectedPriceTier = useMemo(() => PRICE_TIERS.find(p => p.id === config.priceTier) || PRICE_TIERS[0], [config.priceTier]);
  const selectedValue = useMemo(() => CORE_VALUES.find(v => v.id === config.coreValue) || CORE_VALUES[0], [config.coreValue]);

  const scores = useMemo(() => {
    const marketingCost = config.marketingChannels.reduce((acc, channelId) => {
      const channel = MARKETING_CHANNELS.find(c => c.id === channelId);
      return acc + (channel?.cost || 0);
    }, 0);

    const productionCost = Math.max(10, (selectedBase?.cost || 0) + (selectedSourcing?.costDelta || 0) + (selectedPackaging?.cost || 0) + (selectedProduction?.costDelta || 0) + (marketingCost / 5));
    const retailPrice = productionCost * (1 + (selectedPriceTier?.margin || 0));
    
    const baseEarth = selectedBase?.earthScore || 0;
    const environmentalScore = (baseEarth * (selectedPackaging?.envMultiplier || 1)) * 10;

    let consistency = 1.0;
    if ((config.coreValue === 'zw' || config.coreValue === 'lcf') && config.packagingType === 'plastic') consistency -= 0.5;
    if (config.coreValue === 'fts' && config.sourcingModel === 'is') consistency -= 0.5;
    if (config.coreValue === 'len') consistency -= 0.7;

    const hasChannels = config.marketingChannels.length > 0;
    const hasMessage = config.message.trim().length > 10;
    
    const marketingMultiplier = hasChannels ? 1.5 : 0.001; 
    const marketingClarity = hasMessage ? 1.2 : (config.message.length > 0 ? 0.05 : 0.001);
    
    const marketingResonanceRaw = hasChannels
      ? config.marketingChannels.reduce((acc, channelId) => {
          const channel = MARKETING_CHANNELS.find(c => channelId === c.id);
          return acc + (channel?.resonance[config.targetAudience] || 1);
        }, 0) / config.marketingChannels.length
      : 0.01;

    const appealScore = (selectedBase?.appeal || 1) * (selectedProduction?.authenticity || 1) * (selectedAudience?.baseAppeal || 1) * marketingResonanceRaw;
    const accessibility = (selectedPriceTier?.accessibility || 1) / (selectedAudience?.priceSensitivity || 1);
    
    let resonance = ((appealScore * 0.5) + (accessibility * 2.5)) * marketingClarity * marketingMultiplier * 10;

    const trustBase = (environmentalScore * 0.05) + (consistency * 3) + ((selectedPriceTier?.fairness || 1) * 2);
    let trust = (trustBase * 10) + (selectedSourcing?.trustBonus || 0) + (selectedProduction?.trustBonus || 0);

    if (trust < 40) resonance *= 0.3; 
    if (trust < 30) resonance *= 0.1; 

    const longevity = (trust * 0.6) + ((selectedPriceTier?.margin || 0) * 40);

    return { 
      environmentalScore: capScore(environmentalScore), 
      trust: capScore(trust), 
      shortTermSales: capScore(resonance), 
      longevity: capScore(longevity), 
      productionCost, 
      retailPrice,
      consistency,
      socialImpact: capScore((selectedSourcing?.humanScore || 5) * 10)
    };
  }, [config, selectedBase, selectedSourcing, selectedPackaging, selectedProduction, selectedAudience, selectedPriceTier]);

  const overallScore = useMemo(() => {
    return (scores.environmentalScore + scores.trust + scores.shortTermSales + scores.socialImpact + scores.longevity) / 5;
  }, [scores]);

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const month = i + 1;
      let seasonalMultiplier = 1.0;
      
      if (month >= 3 && month <= 6) {
        if (config.category === 'bc') seasonalMultiplier = 1.25;
        if (config.category === 'hf') seasonalMultiplier = 0.85;
      }
      
      if (month >= 7 && month <= 9) {
        if (config.category === 'hf') seasonalMultiplier = 0.7;
        if (config.sourcingModel === 'lsf') seasonalMultiplier *= 0.9;
      }
      
      if (month >= 10 && month <= 12) seasonalMultiplier = 1.45;

      const noise = (Math.sin(i * 1.5) * 1.5);
      const baseSales = scores.shortTermSales * 1.2;
      const growthFactor = scores.shortTermSales < 1 
        ? 1.0 
        : Math.pow(1 + (scores.longevity / 1000), i);
      
      const revenue = baseSales * growthFactor * seasonalMultiplier;
      const trust = Math.min(98, scores.trust + (i * (scores.environmentalScore > 65 ? 0.6 : -1.2)) + noise);
      const impact = Math.min(98, scores.environmentalScore + (i * 0.1) + noise);
      const awareness = Math.min(98, scores.shortTermSales + (i * (scores.shortTermSales > 5 ? 3 : 0.2)) + noise);

      return {
        month,
        profit: Math.round(revenue),
        trust: Math.round(trust),
        impact: Math.round(impact),
        awareness: Math.round(awareness)
      };
    });
  }, [scores, config.category, config.sourcingModel]);

  const animatedChartData = useMemo(() => {
    if (phase !== 'market' || !isAnimating) return chartData.map(d => ({ month: d.month }));
    return chartData.map((d, index) => {
      const threshold = (index + 1) / chartData.length;
      if (animationProgress >= threshold) return d;
      return { month: d.month };
    });
  }, [chartData, animationProgress, phase, isAnimating]);

  const handleUpdateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const scrollToJoin = () => {
    setPhase('intro');
    setTimeout(() => {
      document.getElementById('join-game-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const scrollToLab = () => {
    if (!teamName) {
      scrollToJoin();
      return;
    }
    setPhase('lab');
    setTimeout(() => {
      document.getElementById('lab-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const scrollToMarket = () => {
    setPhase('market');
    setTimeout(() => {
      document.getElementById('analysis-dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleEmblemSelect = (url: string) => {
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

  const broadcastStatus = (status: 'join' | 'lab' | 'market', overrideName?: string, overrideEmblem?: string) => {
    const nameToUse = overrideName || teamName;
    const emblemToUse = overrideEmblem || selectedEmblem;
    if (firestore && nameToUse) {
      addDocumentNonBlocking(collection(firestore, "simulator_events"), {
        teamName: nameToUse,
        emblem: emblemToUse,
        type: status,
        timestamp: serverTimestamp()
      });
    }
  };

  const handleJoinGame = () => {
    if (!teamName.trim()) {
      toast({ variant: "destructive", title: "Team Name Required", description: "Please enter a team name to start." });
      return;
    }
    broadcastStatus('join');
    setPhase('lab');
    broadcastStatus('lab');
    setTimeout(() => {
      document.getElementById('lab-header')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleExitTeam = () => {
    setPhase('intro');
    setTeamName("");
    setYear(1);
    setAiFeedback(null);
    setLastEventId(null);
    setAnimationProgress(0);
    setIsAnimating(false);
    toast({ title: "Team Session Ended" });
  };

  const handleViewHistoricalSession = (session: any) => {
    setTeamName(session.teamName);
    setSelectedEmblem(session.emblem);
    setYear(session.year || 1);
    if (session.config) setConfig(session.config);
    if (session.aiFeedback) setAiFeedback(session.aiFeedback);
    setPhase('market');
    setIsAnimating(false);
    setTimeout(() => {
      const el = document.getElementById('analysis-dashboard');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => setIsAnimating(true), 1500);
    }, 100);
  };

  const launchSimulation = async () => {
    setPhase('market');
    setIsAnimating(false);
    setIsAiLoading(true);
    setAnimationProgress(0);
    
    setTimeout(() => {
      const el = document.getElementById('analysis-dashboard');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    let generatedFeedback: MarketFeedbackOutput | null = null;
    const richDescription = `${selectedBase.name} ${config.format}`;
    const channelNames = config.marketingChannels.map(id => MARKETING_CHANNELS.find(c => c.id === id)?.name || id);

    try {
      generatedFeedback = await generateMarketFeedback({
        teamName,
        productName: richDescription,
        ingredients: [selectedBase.name, selectedSourcing.name, selectedPackaging.name],
        marketingChannels: channelNames,
        earthScore: Math.round(scores.environmentalScore),
        trustScore: Math.round(scores.trust),
        pricePoint: Math.round(scores.retailPrice),
        message: config.message,
        targetAudience: selectedAudience.name,
        coreValue: selectedValue.name,
        year: year
      });
      setAiFeedback(generatedFeedback);
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAiLoading(false);
      setTimeout(() => setIsAnimating(true), 1500);
    }

    if (firestore) {
      addDocumentNonBlocking(collection(firestore, "simulator_sessions"), {
        teamName,
        emblem: selectedEmblem,
        productType: richDescription,
        ingredients: [selectedBase.name, selectedSourcing.name],
        config: config,
        aiFeedback: generatedFeedback,
        year: year,
        scores: {
          earth: Math.round(scores.environmentalScore),
          trust: Math.round(scores.trust),
          resonance: Math.round(scores.shortTermSales),
          impact: Math.round(scores.socialImpact),
          profit: Math.round(chartData[11].profit),
          longevity: Math.round(scores.longevity)
        },
        createdAt: serverTimestamp()
      });
      broadcastStatus('market');
    }
  };

  const displayVal = (val: number) => Math.round(val * animationProgress);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#1e293b] flex flex-col transition-colors duration-1000 relative overflow-x-hidden">
      <Navbar />
      
      <div className="fixed top-20 left-4 z-[100] flex flex-col gap-3">
        {phase !== 'intro' && (
          <Button variant="outline" onClick={handleExitTeam} className="bg-slate-900/80 backdrop-blur-xl border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-full h-12 px-6 transition-all shadow-2xl group">
            <X className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" /> Exit Team
          </Button>
        )}
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
                  <Activity className="w-6 h-6 text-accent" /> Game Management
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
            Create an imaginary product that we will run through a market simulator based on your strategic laboratory choices.
          </p>

          <div className="flex justify-center relative z-[100] mt-12">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 flex items-center shadow-2xl">
              <button
                onClick={scrollToJoin}
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
          </div>
        </section>

        <section className="space-y-8 mb-16 animate-in fade-in duration-1000 delay-300">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-3xl font-headline font-bold text-white uppercase tracking-wider flex items-center gap-3">
              <Activity className="w-8 h-8 text-accent" /> Workshop Leaderboard
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allWorkshopTeams.map((s) => (
              <Card key={`${s.sourceCollection}-${s.id}`} className="bg-slate-900/40 backdrop-blur-md border-white/5 rounded-[2rem] overflow-hidden hover:bg-white/5 transition-all group border shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform">
                      {s.emblem && <img src={s.emblem} alt="Logo" className="w-full h-full object-contain" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-xl font-bold text-white truncate">{s.teamName}</h3>
                      <p className="text-xs text-slate-400 uppercase tracking-widest line-clamp-2 group-hover:line-clamp-none transition-all duration-300 bg-slate-900/0 group-hover:bg-slate-800/90 group-hover:p-2 group-hover:-m-2 group-hover:rounded-xl group-hover:z-20 group-hover:relative cursor-help">
                        {s.status === 'playing' ? 'In Laboratory' : s.productType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-accent font-bold uppercase tracking-tighter">Score</p>
                      <p className="text-3xl font-black font-headline text-white">
                        {s.scores ? Math.round((s.scores.earth + s.scores.trust + s.scores.resonance + s.scores.impact + s.scores.longevity) / 5) : 'IN LAB'}
                      </p>
                    </div>
                  </div>
                  {s.status === 'playing' && (
                    <Button variant="outline" className="w-full mt-6 text-white border-white/20 hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest text-[10px] py-6 h-auto" onClick={() => { setTeamName(s.teamName); setSelectedEmblem(s.emblem); setPhase('lab'); }}>
                      Edit / Launch Product
                    </Button>
                  )}
                  {s.status === 'complete' && (
                    <Button variant="ghost" className="w-full mt-4 text-white border border-white/20 hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => handleViewHistoricalSession(s)}>
                      View Analysis <ArrowRight className="w-3 h-3 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {phase === 'intro' && (
          <div id="join-game-section" className="max-w-3xl mx-auto py-12 px-10 bg-white rounded-[3rem] shadow-2xl border border-white/10 space-y-10 scroll-mt-24">
            <div className="space-y-4">
              <Label className="text-sm font-bold text-slate-500 tracking-[0.2em] uppercase px-2">1. Team Name</Label>
              <Input placeholder="e.g. The Eco-Warriors" value={teamName} onChange={e => setTeamName(e.target.value)} className="rounded-3xl h-20 text-center text-3xl font-headline border-primary/20 bg-slate-50" />
            </div>
            <div className="space-y-6">
              <Label className="text-sm font-bold text-slate-500 tracking-[0.2em] uppercase px-2">2. Team Logo</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {TEAM_EMBLEMS.map((emblem) => (
                  <button key={emblem.id} onClick={() => handleEmblemSelect(emblem.url)} className={cn("relative aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-300 bg-white shadow-md", selectedEmblem === emblem.url ? "border-primary scale-110 z-10 shadow-xl" : "border-transparent hover:border-muted-foreground/30")}>
                    <img src={emblem.url} alt="Logo" className="w-full h-full object-contain p-0.5" />
                    {selectedEmblem === emblem.url && <div className="absolute inset-0 bg-primary/10 flex items-center justify-center"><CheckCircle2 className="text-primary w-8 h-8" /></div>}
                  </button>
                ))}
              </div>
            </div>
            <Button id="enter-lab-trigger" onClick={handleJoinGame} className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-20 text-2xl font-bold shadow-2xl transition-all active:scale-95">
              Enter Laboratory <ChevronRight className="w-8 h-8 ml-2" />
            </Button>
          </div>
        )}

        {phase === 'lab' && (
          <div id="lab-header" className="animate-in fade-in duration-1000 mt-8 scroll-mt-24">
            <div className="col-span-full mb-16 text-center space-y-4">
              <div className="relative w-40 h-40 mx-auto mb-6 bg-white rounded-[2.5rem] p-2 shadow-xl">
                <img src={selectedEmblem} alt="Team Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-5xl font-headline font-bold text-white tracking-tight">Strategy Laboratory</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-12 pb-20">
                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2"><Award className="w-6 h-6 text-accent" /> 1. The Product</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Category</Label>
                      <Select value={config.category} onValueChange={v => handleUpdateConfig('category', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Format</Label>
                      <Select value={config.format} onValueChange={v => handleUpdateConfig('format', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{selectedCategory.formats.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2"><Sparkles className="w-6 h-6 text-accent" /> 2. Ingredients</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Base</Label>
                      <Select value={config.ingredientBase} onValueChange={v => handleUpdateConfig('ingredientBase', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{INGREDIENT_BASES.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Sourcing</Label>
                      <Select value={config.sourcingModel} onValueChange={v => handleUpdateConfig('sourcingModel', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{SOURCING_MODELS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2"><Package className="w-6 h-6 text-accent" /> 3. Packaging</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Type</Label>
                      <Select value={config.packagingType} onValueChange={v => handleUpdateConfig('packagingType', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{PACKAGING_TYPES.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Production</Label>
                      <Select value={config.productionMethod} onValueChange={v => handleUpdateConfig('productionMethod', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{PRODUCTION_METHODS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-12 pb-20">
                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2"><Megaphone className="w-6 h-6 text-accent" /> 4. Marketing</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                      {MARKETING_CHANNELS.map(channel => (
                        <div key={channel.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", config.marketingChannels.includes(channel.id) ? "bg-accent/20 border-accent" : "bg-white/5 border-transparent")} onClick={() => toggleMarketingChannel(channel.id)}>
                          <Checkbox checked={config.marketingChannels.includes(channel.id)} onCheckedChange={() => toggleMarketingChannel(channel.id)} className="border-white/30" />
                          <span className="text-sm font-medium text-white">{channel.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Marketing Message</Label>
                      <Input placeholder="e.g., Purely Natural. Purely Maroma." value={config.message} onChange={e => handleUpdateConfig('message', e.target.value)} className="rounded-xl h-12 bg-white border-none text-primary font-medium" />
                    </div>
                  </div>
                </section>

                <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl">
                  <div className="flex justify-between items-center pt-6 border-t-2 border-accent/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Target Price Point</span>
                      <span className="text-[10px] text-slate-500">Retail Target</span>
                    </div>
                    <span className="text-4xl font-bold text-white font-headline">₹{Math.round(scores.retailPrice)}</span>
                  </div>
                </div>

                <Button onClick={launchSimulation} className="w-full bg-accent hover:bg-accent/90 text-white rounded-full h-20 text-xl font-bold shadow-xl transition-all active:scale-95">
                  Launch Strategy <ArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {phase === 'market' && (
          <div id="analysis-dashboard" className="space-y-8 animate-in fade-in zoom-in-95 duration-1000 mt-8 scroll-mt-24">
            <div className="text-center space-y-2">
              <Badge className="bg-green-500 text-white px-4 py-1 rounded-full font-bold uppercase tracking-widest text-[10px]">Year {year} Analysis</Badge>
              <h2 className="text-4xl font-headline font-bold text-white">Simulation Results</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              <div className="lg:col-span-1 space-y-4">
                {[
                  { label: "Final Revenue", val: `₹${displayVal(chartData[11].profit * 1000)}`, icon: Clock },
                  { label: "Market Trust", val: `${displayVal(chartData[11].trust)}%`, icon: ShieldCheck, color: "text-green-400" },
                  { label: "Retail Price", val: `₹${displayVal(scores.retailPrice)}`, icon: Zap, color: "text-amber-400" },
                  { label: "Market Awareness", val: `${displayVal(chartData[11].awareness)}%`, icon: Users, color: "text-blue-400" }
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

              <Card className="lg:col-span-3 rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl p-8 md:p-12 relative overflow-hidden">
                <CardHeader className="px-0 pt-0 flex flex-col gap-6">
                  <CardTitle className="font-headline text-3xl text-white">Growth Trajectory</CardTitle>
                  {animationProgress === 1 && (
                    <div className="w-full max-w-xl animate-in slide-in-from-top-4 duration-1000">
                      <div className="bg-accent/20 border border-accent/30 rounded-2xl p-4 flex items-center justify-between gap-4 backdrop-blur-2xl">
                        <div className="flex items-center gap-3">
                          <div className="bg-accent p-2 rounded-xl shadow-lg shrink-0"><PartyPopper className="w-5 h-5 text-white" /></div>
                          <div className="flex flex-col">
                            <h3 className="text-sm font-headline font-bold text-white">Year {year} Cycle Complete!</h3>
                            <p className="text-[10px] text-slate-300 font-body uppercase tracking-[0.2em] font-bold">Data Harvested</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => { setPhase('lab'); setYear(prev => prev + 1); setIsAnimating(false); }} className="bg-primary hover:bg-primary/90 text-white rounded-full px-4 text-xs font-bold gap-2">
                          Improve Strategy <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                
                <div className="h-[500px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={animatedChartData} key={`${teamName}-${phase}-${animationProgress === 1}`} margin={{ top: 40, right: 20, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 14 }} />
                      <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="bg-slate-950 border border-white/10 p-5 rounded-3xl shadow-2xl min-w-[240px] backdrop-blur-2xl">
                              <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest">Month {label}</p>
                              <div className="space-y-3">
                                {payload.map((entry: any) => (
                                  <div key={entry.name} className="flex justify-between gap-8 items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: entry.color }}>{entry.name}</span>
                                    <span className="text-base font-black text-white">{Math.round(entry.value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Legend verticalAlign="top" align="center" height={60} iconType="circle" />
                      <Line isAnimationActive={false} type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={4} name="REVENUE" dot={false} />
                      <Line isAnimationActive={false} type="monotone" dataKey="awareness" stroke="#fbbf24" strokeWidth={4} name="AWARENESS" dot={false} />
                      <Line isAnimationActive={false} type="monotone" dataKey="trust" stroke="#22c55e" strokeWidth={4} name="TRUST INDEX" dot={false} />
                      <Line isAnimationActive={false} type="monotone" dataKey="impact" stroke="#ec4899" strokeWidth={4} name="EARTH SCORE" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
              <Card className="rounded-[2.5rem] bg-white/5 backdrop-blur-sm text-white border border-white/10 p-8 space-y-8">
                <CardHeader className="p-0"><CardTitle className="font-headline text-3xl">Strategic Opportunities</CardTitle></CardHeader>
                <div className="space-y-6">
                  {overallScore > 75 && scores.shortTermSales > 10 ? (
                    <div className="p-5 bg-white/5 rounded-2xl text-sm border-l-4 border-green-500 text-slate-200 space-y-3">
                      <div className="flex gap-3">
                        <Star className="w-5 h-5 text-green-500 shrink-0" />
                        <span>Strong brand alignment detected between production and core values.</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-green-400/80 font-bold uppercase tracking-widest text-[10px]">
                        <Zap className="w-3 h-3" /> Growth Multiplier Applied
                      </div>
                    </div>
                  ) : scores.shortTermSales <= 10 && scores.trust > 70 && scores.environmentalScore > 70 ? (
                    <div className="p-5 bg-white/5 rounded-2xl text-sm border-l-4 border-blue-500 text-slate-200 space-y-3">
                      <div className="flex gap-3">
                        <Megaphone className="w-5 h-5 text-blue-500 shrink-0" />
                        <span>Ethical core is world-class, but the brand remains a "Hidden Gem." Scale awareness to unlock growth!</span>
                      </div>
                    </div>
                  ) : scores.trust < 50 ? (
                    <div className="p-5 bg-white/5 rounded-2xl text-sm border-l-4 border-amber-500 text-slate-200 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      <span>Market skepticism is rising. Your ingredient transparency might be insufficient.</span>
                    </div>
                  ) : null}
                  <div className="space-y-4 pt-4">
                    {[{ label: "Earth Score", val: scores.environmentalScore, color: "bg-emerald-500" },
                      { label: "Trust Index", val: scores.trust, color: "bg-blue-500" },
                      { label: "Market Resonance", val: scores.shortTermSales, color: "bg-amber-500" }].map((s, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-end"><span className="text-xs font-bold uppercase tracking-widest opacity-60">{s.label}</span><span className="text-2xl font-bold font-headline">{displayVal(s.val)}%</span></div>
                        <Progress value={s.val * animationProgress} className={cn("h-3 bg-white/10", `[&>div]:${s.color}`)} />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="rounded-[2.5rem] bg-slate-900/60 backdrop-blur-xl text-white border border-white/10">
                <CardHeader className="bg-white/5 border-b border-white/5 py-6 flex flex-row items-center justify-between">
                  <CardTitle className="font-headline text-2xl uppercase">Analyst Report</CardTitle>
                  {aiFeedback && <Badge className="bg-accent text-white uppercase font-bold tracking-widest">{aiFeedback.analystTone}</Badge>}
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {isAiLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="w-12 h-12 animate-spin text-accent" /><p className="text-slate-400 font-medium animate-pulse text-xs uppercase tracking-widest">Processing Data...</p></div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <Label className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                              <ThumbsUp className="w-3 h-3" /> Strengths
                            </Label>
                            {aiFeedback.positiveReviews.map((r, i) => (
                              <div key={i} className="text-xs p-4 bg-green-500/5 rounded-2xl border border-green-500/10 text-slate-300">
                                "{r}"
                              </div>
                            ))}
                          </div>
                          <div className="space-y-4">
                            <Label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                              <ThumbsDown className="w-3 h-3" /> Friction
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
                            <Lightbulb className="w-4 h-4" /> Recommended Adjustment
                          </h4>
                          <p className="text-sm text-slate-200 leading-relaxed font-body">
                            {aiFeedback.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-slate-500 italic">Complete a simulation to see the report.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center pt-12 pb-20">
              <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 flex items-center shadow-2xl">
                <button
                  onClick={scrollToJoin}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all text-slate-400 hover:text-white"
                >
                  Join Game
                </button>
                <button
                  onClick={scrollToLab}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all text-slate-400 hover:text-white"
                >
                  Laboratory
                </button>
                <button
                  onClick={scrollToMarket}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all bg-primary text-white shadow-lg"
                >
                  Market Simulator
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
