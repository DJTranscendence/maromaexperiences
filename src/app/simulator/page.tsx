"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sprout, 
  Heart, 
  AlertCircle, 
  CheckCircle2, 
  Dna,
  Zap,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Award,
  CircleCheck,
  Package,
  Target,
  IndianRupee,
  Users,
  Activity,
  Globe,
  Megaphone,
  ShieldCheck,
  Loader2,
  MessageSquareQuote,
  TrendingUp,
  BrainCircuit,
  Trophy,
  Star,
  X,
  Home,
  RotateCcw,
  Settings,
  Trash2,
  PlayCircle,
  ThumbsUp,
  ThumbsDown,
  User
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useFirebase, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase, useUser, useDoc, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, limit, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { generateMarketFeedback, type MarketFeedbackOutput } from "@/ai/flows/market-feedback";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const TEAM_EMBLEMS = [
  { id: 'brand-13', name: 'Brand 13', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F13-01.png?alt=media&token=7b4e1e0d-f9be-4758-9eb8-51678eadcc31' },
  { id: 'brand-7', name: 'Brand 7', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F7-01.png?alt=media&token=23f53117-a9d8-4907-964e-9281c41dfb86' },
  { id: 'brand-special', name: 'Special Brand', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2FUntitled-1-01.png?alt=media&token=df177869-bca3-4454-b2d4-16e2570e2327' },
  { id: 'brand-6', name: 'Brand 6', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F6-01.png?alt=media&token=0f067a3a-ddd5-418f-b714-e714efd7282c' },
  { id: 'brand-9', name: 'Brand 9', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F9-01.png?alt=media&token=41665223-538c-482e-ac5e-45835a6d8557' },
  { id: 'brand-19', name: 'Brand 19', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F19-01.png?alt=media&token=05bdc083-e465-4c82-b42e-cc94aadba5d8' },
  { id: 'brand-14', name: 'Brand 14', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F14-01.png?alt=media&token=883ae152-fea5-40c3-9cb5-20d73a0e1f60' },
  { id: 'brand-12', name: 'Brand 12', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F12-01.png?alt=media&token=4ff97d12-c967-4e32-be10-49bfa6dc68f5' },
  { id: 'brand-main', name: 'Main Logo', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Logos%2FGame%20Logos-01.png?alt=media&token=be0a96fc-03fc-4e8d-bc3b-b4c9f5f374a2' },
  { id: 'brand-8', name: 'Brand 8', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F8-01.png?alt=media&token=535b652d-ecad-4390-a1c0-eebada8459d6' },
  { id: 'brand-11', name: 'Brand 11', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F11-01.png?alt=media&token=eb2cfcfa-7a1e-4097-9bf3-6c9b38d0d885' },
  { id: 'brand-17', name: 'Brand 17', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F17-01.png?alt=media&token=bdf30366-24cb-4d7a-be14-f8f2b2f9ccf3' },
  { id: 'brand-18', name: 'Brand 18', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F18-01.png?alt=media&token=a649f0b5-c642-4bfb-a467-a05de4a09cc1' },
  { id: 'brand-2', name: 'Brand 2', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F2-01.png?alt=media&token=4c94e823-4cc3-43c3-bd2f-393b7ef69123' },
  { id: 'brand-4', name: 'Brand 4', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F4-01.png?alt=media&token=24c47a94-c6a3-4da4-ba42-adeedad88e96' },
  { id: 'brand-16', name: 'Brand 16', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F16-01.png?alt=media&token=60b457b6-ad41-4544-b124-bd93055c4f55' },
  { id: 'brand-3', name: 'Brand 3', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F3-01.png?alt=media&token=242a85c4-c6bd-4cf4-856b-9763f375db9f' },
  { id: 'brand-10', name: 'Brand 10', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F10-01.png?alt=media&token=23f53117-a9d8-4907-964e-9281c41dfb86' },
];

const TITLE_IMAGE_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Product%20Game%20Title%202.png?alt=media&token=f7698e9d-9e74-45e2-a0c1-916f1b9904db";

export default function SimulatorPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [phase, setPhase] = useState<'intro' | 'lab' | 'market'>('intro');
  const [teamName, setTeamName] = useState("");
  const [selectedEmblem, setSelectedEmblem] = useState(TEAM_EMBLEMS[0].url);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  
  const [aiFeedback, setAiFeedback] = useState<MarketFeedbackOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

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
            title: "Player Joined",
            description: (
              <div className="flex items-center gap-6 mt-2">
                {latest.emblem && (
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-white shrink-0 border border-border/20 shadow-lg">
                    <img src={latest.emblem} alt={latest.teamName} className="w-full h-full object-contain p-1" />
                  </div>
                )}
                <span className="font-bold text-xl">{latest.teamName} joined the game</span>
              </div>
            ),
          });
        }
        setLastEventId(latest.id);
      }
    }
  }, [events, lastEventId, toast]);

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
    message: ""
  });

  const selectedCategory = useMemo(() => CATEGORIES.find(c => c.id === config.category)!, [config.category]);
  const selectedBase = useMemo(() => INGREDIENT_BASES.find(b => b.id === config.ingredientBase)!, [config.ingredientBase]);
  const selectedSourcing = useMemo(() => SOURCING_MODELS.find(s => s.id === config.sourcingModel)!, [config.sourcingModel]);
  const selectedPackaging = useMemo(() => PACKAGING_TYPES.find(p => p.id === config.packagingType)!, [config.packagingType]);
  const selectedProduction = useMemo(() => PRODUCTION_METHODS.find(p => p.id === config.productionMethod)!, [config.productionMethod]);
  const selectedAudience = useMemo(() => TARGET_AUDIENCES.find(a => a.id === config.targetAudience)!, [config.targetAudience]);
  const selectedPriceTier = useMemo(() => PRICE_TIERS.find(p => p.id === config.priceTier)!, [config.priceTier]);
  const selectedValue = useMemo(() => CORE_VALUES.find(v => v.id === config.coreValue)!, [config.coreValue]);

  const scores = useMemo(() => {
    const marketingCost = config.marketingChannels.reduce((acc, channelId) => {
      const channel = MARKETING_CHANNELS.find(c => c.id === channelId);
      return acc + (channel?.cost || 0);
    }, 0);

    const productionCost = Math.max(10, (selectedBase?.cost || 0) + (selectedSourcing?.costDelta || 0) + (selectedPackaging?.cost || 0) + (selectedProduction?.costDelta || 0) + (marketingCost / 5));
    const retailPrice = productionCost * (1 + (selectedPriceTier?.margin || 0));
    
    const baseEarth = selectedBase?.earthScore || 0;
    const environmentalScore = Math.min(10, baseEarth * (selectedPackaging?.envMultiplier || 1));

    let consistency = 1.0;
    if ((config.coreValue === 'zw' || config.coreValue === 'lcf') && config.packagingType === 'plastic') consistency -= 0.5;
    if (config.coreValue === 'fts' && config.sourcingModel === 'is') consistency -= 0.5;
    if (config.coreValue === 'len') consistency -= 0.7;

    const marketingResonance = config.marketingChannels.length > 0 
      ? config.marketingChannels.reduce((acc, channelId) => {
          const channel = MARKETING_CHANNELS.find(c => c.id === channelId);
          return acc + (channel?.resonance[config.targetAudience] || 1);
        }, 0) / config.marketingChannels.length
      : 0.5;

    const appealScore = (selectedBase?.appeal || 1) * (selectedProduction?.authenticity || 1) * (selectedAudience?.baseAppeal || 1) * (marketingResonance * 1.5);
    const accessibility = Math.min(1.5, (selectedPriceTier?.accessibility || 1) / (selectedAudience?.priceSensitivity || 1));
    const marketingClarity = config.message.length > 5 ? 1.2 : 0.8;
    const shortTermSales = Math.min(10, (appealScore * 0.4) + (accessibility * 3) + (marketingClarity * 2));

    const trustBase = (environmentalScore * 0.5) + (consistency * 3) + ((selectedPriceTier?.fairness || 1) * 2);
    const trust = Math.min(100, (trustBase * 10) + (selectedSourcing?.trustBonus || 0) + (selectedProduction?.trustBonus || 0));

    const longevity = Math.min(10, (trust * 0.06) + ((selectedPriceTier?.margin || 0) * 4));

    return { 
      environmentalScore, 
      trust, 
      shortTermSales, 
      longevity, 
      productionCost, 
      retailPrice,
      consistency,
      socialImpact: selectedSourcing?.humanScore || 5
    };
  }, [config, selectedBase, selectedSourcing, selectedPackaging, selectedProduction, selectedAudience, selectedPriceTier]);

  const overallScore = useMemo(() => {
    return Math.round((
      (scores.environmentalScore * 10) + 
      scores.trust + 
      (scores.shortTermSales * 10) + 
      (scores.socialImpact * 10) + 
      (scores.longevity * 10)
    ) / 5);
  }, [scores]);

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      month: i + 1,
      profit: Math.max(0, (scores.shortTermSales * 15) + (i * (scores.longevity * 2 - 10))),
      trust: Math.min(100, scores.trust + (i * (scores.environmentalScore > 6 ? 1.5 : -3))),
      impact: Math.min(10, scores.environmentalScore + (i * 0.05))
    }));
  }, [scores]);

  useEffect(() => {
    if (phase === 'market' && (!aiFeedback || !aiFeedback.positiveReviews || aiFeedback.positiveReviews.length < 4) && !isAiLoading && teamName && config.format) {
      const syncFeedback = async () => {
        setIsAiLoading(true);
        try {
          const feedback = await generateMarketFeedback({
            teamName,
            productName: config.format,
            ingredients: [selectedBase.name, selectedSourcing.name, selectedPackaging.name],
            earthScore: Math.round(scores.environmentalScore * 10),
            trustScore: Math.round(scores.trust),
            pricePoint: Math.round(scores.retailPrice),
            message: config.message,
            targetAudience: selectedAudience.name,
            coreValue: selectedValue.name
          });
          setAiFeedback(feedback);
          
          if (viewingSessionId && firestore) {
            updateDocumentNonBlocking(doc(firestore, "simulator_sessions", viewingSessionId), {
              aiFeedback: feedback,
              updatedAt: serverTimestamp()
            });
          }
        } catch (err) {
          console.error("Feedback synchronization failed:", err);
        } finally {
          setIsAiLoading(false);
        }
      };
      syncFeedback();
    }
  }, [phase, aiFeedback, isAiLoading, teamName, config, selectedBase, selectedSourcing, selectedPackaging, scores, selectedAudience, selectedValue, viewingSessionId, firestore]);

  const handleUpdateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
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
    if (!teamName.trim()) {
      toast({ variant: "destructive", title: "Team Name Required", description: "Please enter a team name to start." });
      return;
    }
    broadcastStatus('join');
    setPhase('lab');
    broadcastStatus('lab');
  };

  const handleExitTeam = () => {
    setPhase('intro');
    setTeamName("");
    setAiFeedback(null);
    setLastEventId(null);
    setViewingSessionId(null);
    toast({
      title: "Team Session Ended",
      description: "You have been removed from the session. A new team can now join.",
    });
  };

  const handleViewHistoricalSession = (session: any) => {
    setViewingSessionId(session.id);
    setTeamName(session.teamName);
    setSelectedEmblem(session.emblem);
    if (session.config) {
      setConfig(session.config);
    }
    if (session.aiFeedback) {
      setAiFeedback(session.aiFeedback);
    } else {
      setAiFeedback(null);
    }
    setPhase('market');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEntry = (id: string, sourceCollection: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, sourceCollection, id));
    toast({ title: "Team Entry Removed", description: "The entry has been removed from the dashboard." });
  };

  const launchSimulation = async () => {
    setPhase('market');
    setIsAiLoading(true);
    
    let generatedFeedback: MarketFeedbackOutput | null = null;

    try {
      generatedFeedback = await generateMarketFeedback({
        teamName,
        productName: config.format,
        ingredients: [selectedBase.name, selectedSourcing.name, selectedPackaging.name],
        earthScore: Math.round(scores.environmentalScore * 10),
        trustScore: Math.round(scores.trust),
        pricePoint: Math.round(scores.retailPrice),
        message: config.message,
        targetAudience: selectedAudience.name,
        coreValue: selectedValue.name
      });
      setAiFeedback(generatedFeedback);
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAiLoading(false);
    }

    if (firestore) {
      addDocumentNonBlocking(collection(firestore, "simulator_sessions"), {
        teamName,
        emblem: selectedEmblem,
        productType: config.format,
        ingredients: [selectedBase.name, selectedSourcing.name],
        config: config,
        aiFeedback: generatedFeedback,
        scores: {
          earth: Math.round(scores.environmentalScore * 10),
          trust: Math.round(scores.trust),
          resonance: Math.round(scores.shortTermSales * 10),
          impact: Math.round(scores.socialImpact * 10),
          profit: Math.round(chartData[11].profit),
          longevity: Math.round(scores.longevity * 10)
        },
        createdAt: serverTimestamp()
      });
      broadcastStatus('market');
    }
  };

  const scrollToJoinForm = () => {
    const element = document.getElementById('join-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#1e293b] flex flex-col transition-colors duration-1000 relative overflow-x-hidden">
      <Navbar />
      
      <div className="fixed top-20 left-4 z-[100] flex flex-col gap-3">
        {phase !== 'intro' && (
          <Button 
            variant="outline" 
            onClick={handleExitTeam}
            className="bg-slate-900/80 backdrop-blur-xl border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-full h-12 px-6 transition-all shadow-2xl group"
          >
            <X className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" /> Exit Team
          </Button>
        )}

        {isAdmin && (
          <Dialog open={isAdminPanelOpen} onOpenChange={setIsAdminPanelOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-accent/20 backdrop-blur-xl border-accent/20 text-accent hover:text-white hover:bg-accent/40 rounded-full h-12 px-6 transition-all shadow-2xl"
              >
                <Settings className="w-4 h-4 mr-2" /> Admin Tools
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[2.5rem] bg-slate-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                  <Activity className="w-6 h-6 text-accent" /> Game Management
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Manage live team sessions and current game metrics.
                </DialogDescription>
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
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Status</p>
                          <p className={cn("text-xl font-black", s.status === 'playing' ? 'text-blue-400' : 'text-accent')}>
                            {s.scores ? Math.round((s.scores.earth + s.scores.trust + s.scores.resonance + s.scores.impact + s.scores.longevity) / 5) : 'LIVE'}
                          </p>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-slate-500 hover:text-destructive hover:bg-destructive/10 rounded-full"
                          onClick={() => handleDeleteEntry(s.id, s.sourceCollection)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!allWorkshopTeams || allWorkshopTeams.length === 0) && (
                    <div className="text-center py-12 text-slate-500 italic font-body">
                      No team sessions recorded in the database yet.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full relative">
        
        <section className="mb-16 text-center space-y-8 animate-in fade-in duration-1000">
          <div className="relative h-48 w-full max-w-2xl mx-auto">
            <Image src={TITLE_IMAGE_URL} alt="The Maroma Product Game" fill className="object-contain" priority />
          </div>
          <p className="text-xl text-slate-300 font-body leading-relaxed max-w-3xl mx-auto px-4">
            Based on what you have learned today about how Maroma makes its products, you will now create an imaginary product that we will run through a market simulator.
          </p>
        </section>

        <section className="space-y-8 mb-16 animate-in fade-in duration-1000 delay-300">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-3xl font-headline font-bold text-white uppercase tracking-wider flex items-center gap-3">
              <Activity className="w-8 h-8 text-accent" /> Team Scores
            </h2>
            <Badge variant="outline" className="text-slate-400 border-white/10 uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full backdrop-blur-sm">
              {allWorkshopTeams?.length || 0} Teams Competing
            </Badge>
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
                      <p className="text-xs text-slate-400 uppercase tracking-widest truncate">
                        {s.status === 'playing' ? 'In Laboratory' : s.productType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-accent font-bold uppercase tracking-tighter">
                        {s.status === 'playing' ? 'Status' : 'Score'}
                      </p>
                      <p className={cn("text-3xl font-black font-headline", s.status === 'playing' ? 'text-blue-400 text-xl' : 'text-white')}>
                        {s.scores ? Math.round((s.scores.earth + s.scores.trust + s.scores.resonance + s.scores.impact + s.scores.longevity) / 5) : 'LIVE'}
                      </p>
                    </div>
                  </div>
                  
                  {s.scores && (
                    <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                      <div className="flex justify-between items-center group/metric">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Earth</p>
                        <p className="text-lg font-bold text-emerald-400">{s.scores.earth}</p>
                      </div>
                      <div className="flex justify-between items-center group/metric">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Trust</p>
                        <p className="text-lg font-bold text-blue-400">{s.scores.trust}</p>
                      </div>
                      <div className="flex justify-between items-center group/metric">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Profit</p>
                        <p className="text-lg font-bold text-amber-400">{s.scores.profit}</p>
                      </div>
                    </div>
                  )}
                  
                  {s.status === 'playing' && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 text-blue-400/60 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Developing Prototype...</span>
                      </div>
                    </div>
                  )}

                  {s.status === 'complete' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-4 text-accent border border-accent/20 hover:bg-accent/10 rounded-xl gap-2 font-bold uppercase tracking-widest text-[10px]"
                      onClick={() => handleViewHistoricalSession(s)}
                    >
                      View Full Analysis <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {(!allWorkshopTeams || allWorkshopTeams.length === 0) && (
              <div className="col-span-full py-20 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                <p className="text-slate-500 font-body italic">Awaiting the first team to join the game...</p>
              </div>
            )}
          </div>
        </section>

        {phase === 'intro' && (
          <div className="w-full mb-8 animate-in fade-in slide-in-from-top-4 duration-1000 flex justify-center">
            <Button 
              onClick={scrollToJoinForm}
              className="w-fit px-16 bg-accent text-white hover:bg-accent/90 rounded-[2rem] h-24 shadow-2xl shadow-accent/20 flex flex-col items-center justify-center gap-1 group transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <PlayCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-3xl font-headline font-bold uppercase tracking-widest">Join Game</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">Enter your team name and company logo below</p>
            </Button>
          </div>
        )}

        {phase === 'intro' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-3xl mx-auto text-center space-y-8 mt-8">
              <div id="join-form" className="scroll-mt-32 space-y-10 py-12 px-10 bg-white rounded-[3rem] shadow-2xl border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="space-y-4 text-left relative z-10">
                  <Label className="text-sm font-bold text-slate-500 tracking-[0.2em] uppercase px-2">1. Choose Your Team Name</Label>
                  <Input 
                    placeholder="e.g. The Eco-Warriors" 
                    value={teamName} 
                    onChange={e => setTeamName(e.target.value)}
                    className="rounded-3xl h-20 text-center text-3xl font-headline border-primary/20 focus-visible:ring-primary shadow-inner bg-slate-50"
                  />
                </div>

                <div className="space-y-6 text-left relative z-10">
                  <Label className="text-sm font-bold text-slate-500 tracking-[0.2em] uppercase px-2">2. Choose Your Logo Emblem</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {TEAM_EMBLEMS.map((emblem) => (
                      <button
                        key={emblem.id}
                        onClick={() => setSelectedEmblem(emblem.url)}
                        className={cn(
                          "relative aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-300 group bg-white shadow-md",
                          selectedEmblem === emblem.url ? "border-primary scale-110 z-10 shadow-xl" : "border-transparent hover:border-muted-foreground/30 hover:scale-105"
                        )}
                      >
                        <img src={emblem.url} alt={emblem.name} className="w-full h-full object-contain p-0.5" />
                        {selectedEmblem === emblem.url && (
                          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="text-primary w-8 h-8 drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleJoinGame} className="w-fit mx-auto px-12 bg-primary hover:bg-primary/90 text-white rounded-full h-20 text-2xl font-bold shadow-2xl shadow-primary/20 transition-all active:scale-95 gap-3 relative z-10">
                  Join Game <ChevronRight className="w-8 h-8" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {phase === 'lab' && (
          <div className="animate-in fade-in duration-1000 mt-8">
            <div className="col-span-full mb-16 text-center space-y-4">
              <div className="relative w-40 h-40 mx-auto mb-6 bg-white rounded-[2.5rem] p-2 shadow-xl">
                <img src={selectedEmblem} alt="Team Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-5xl md:text-7xl font-headline font-bold text-white tracking-tight">Let's Create Your Product</h1>
              <p className="text-2xl md:text-3xl font-headline font-bold text-accent uppercase tracking-widest">Laboratory Phase</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-12 pb-20">
                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2">
                    <Award className="w-6 h-6 text-accent" /> 1. Choose Your Product
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Category</Label>
                      <Select value={config.category} onValueChange={v => handleUpdateConfig('category', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-lg text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Format</Label>
                      <Select value={config.format} onValueChange={v => handleUpdateConfig('format', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-lg text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{selectedCategory.formats.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-accent" /> 2. The Formula
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Ingredient Base</Label>
                      <Select value={config.ingredientBase} onValueChange={v => handleUpdateConfig('ingredientBase', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-lg text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{INGREDIENT_BASES.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Where do we get our ingredients?</Label>
                      <Select value={config.sourcingModel} onValueChange={v => handleUpdateConfig('sourcingModel', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-lg text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{SOURCING_MODELS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2">
                    <Package className="w-6 h-6 text-accent" /> 3. Packaging & Production
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Packaging Type</Label>
                      <Select value={config.packagingType} onValueChange={v => handleUpdateConfig('packagingType', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-lg text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{PACKAGING_TYPES.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Production Method</Label>
                      <Select value={config.productionMethod} onValueChange={v => handleUpdateConfig('productionMethod', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-lg text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{PRODUCTION_METHODS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-12 pb-20">
                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2">
                    <Target className="w-6 h-6 text-accent" /> 4. Strategy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Target Audience</Label>
                      <Select value={config.targetAudience} onValueChange={v => handleUpdateConfig('targetAudience', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-lg text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{TARGET_AUDIENCES.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Profit Margin Strategy</Label>
                      <Select value={config.priceTier} onValueChange={v => handleUpdateConfig('priceTier', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-lg text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{PRICE_TIERS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2">
                    <Heart className="w-6 h-6 text-accent" /> 5. Brand Identity
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Core Value Emphasis</Label>
                      <Select value={config.coreValue} onValueChange={v => handleUpdateConfig('coreValue', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-lg text-primary font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{CORE_VALUES.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-400 italic px-1">{selectedValue?.description || ''}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Marketing Message</Label>
                      <Input placeholder="e.g., Purely Natural. Purely Maroma." value={config.message} onChange={e => handleUpdateConfig('message', e.target.value)} className="rounded-xl h-12 bg-white border-none shadow-lg text-primary font-medium" />
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-white flex items-center gap-2">
                    <Megaphone className="w-6 h-6 text-accent" /> 6. Marketing Strategy
                  </h3>
                  <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 block">Select Channels</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {MARKETING_CHANNELS.map(channel => (
                        <div key={channel.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", config.marketingChannels.includes(channel.id) ? "bg-accent/20 border-accent" : "bg-white/5 border-transparent hover:border-white/20")} onClick={() => toggleMarketingChannel(channel.id)}>
                          <Checkbox checked={config.marketingChannels.includes(channel.id)} onCheckedChange={() => toggleMarketingChannel(channel.id)} className="border-white/30 data-[state=checked]:bg-accent data-[state=checked]:border-accent" />
                          <span className="text-sm font-medium text-white">{channel.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold uppercase tracking-widest text-slate-400">Ingredients & Sourcing</span>
                      <span className="text-white font-mono">₹{(selectedBase?.cost || 0) + (selectedSourcing?.costDelta || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold uppercase tracking-widest text-slate-400">Packaging & Production</span>
                      <span className="text-white font-mono">₹{(selectedPackaging?.cost || 0) + (selectedProduction?.costDelta || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Production Cost</span>
                      <span className="text-xl font-bold text-white">₹{Math.round(scores.productionCost)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t-2 border-accent/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Calculated Retail Price</span>
                      <span className="text-[10px] text-slate-500">Includes {Math.round((selectedPriceTier?.margin || 0) * 100)}% Profit Margin</span>
                    </div>
                    <span className="text-4xl font-bold text-white font-headline">₹{Math.round(scores.retailPrice)}</span>
                  </div>
                </div>

                <Button onClick={launchSimulation} className="w-full bg-accent hover:bg-accent/90 text-white rounded-full h-20 text-xl font-bold shadow-xl shadow-accent/20 transition-all active:scale-95">
                  Launch to Market <ArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {phase === 'market' && (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000 mt-8">
            <div className="text-center space-y-4">
              <Badge className="bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-green-500/20">Year 1 Trajectory Active</Badge>
              <h2 className="text-5xl font-headline font-bold text-white">Simulation Analysis</h2>
              <p className="text-slate-300">Market results for {teamName}'s {config.format}.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white/5 backdrop-blur-sm text-white overflow-hidden relative border border-white/10">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Dna className="w-32 h-32" /></div>
                <CardHeader className="pb-2"><CardTitle className="font-headline text-3xl">Performance Scorecard</CardTitle></CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Environmental Friendliness</span>
                      <span className="text-2xl font-bold font-headline">{Math.round(scores.environmentalScore * 10)}/100</span>
                    </div>
                    <Progress value={scores.environmentalScore * 10} className="h-3 bg-white/10 [&>div]:bg-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Public Trust Index</span>
                      <span className="text-2xl font-bold font-headline">{Math.round(scores.trust)}%</span>
                    </div>
                    <Progress value={scores.trust} className="h-3 bg-white/10 [&>div]:bg-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Market Resonance</span>
                      <span className="text-2xl font-bold font-headline">{Math.round(scores.shortTermSales * 10)}%</span>
                    </div>
                    <Progress value={scores.shortTermSales * 10} className="h-3 bg-white/10 [&>div]:bg-amber-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">Human & Social Impact</span>
                      <span className="text-2xl font-bold font-headline">{Math.round(scores.socialImpact * 10)}/100</span>
                    </div>
                    <Progress value={scores.socialImpact * 10} className="h-3 bg-white/10 [&>div]:bg-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-rose-400">Brand Longevity</span>
                      <span className="text-2xl font-bold font-headline">{Math.round(scores.longevity * 10)}%</span>
                    </div>
                    <Progress value={scores.longevity * 10} className="h-3 bg-white/10 [&>div]:bg-rose-500" />
                  </div>
                  <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">Overall Brand Score</span>
                    <span className="text-5xl font-bold font-headline text-accent">{overallScore}/100</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-slate-900/60 backdrop-blur-xl text-white overflow-hidden border border-white/10 flex flex-col">
                <CardHeader className="bg-white/5 border-b border-white/5 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/20 rounded-xl">
                        <BrainCircuit className="w-6 h-6 text-accent" />
                      </div>
                      <CardTitle className="font-headline text-2xl tracking-wide uppercase">Market Analyst Report</CardTitle>
                    </div>
                    {isAiLoading ? (
                      <Badge variant="outline" className="animate-pulse text-slate-400 border-white/20">Analyzing Trends...</Badge>
                    ) : aiFeedback && (
                      <Badge className={cn(
                        "uppercase tracking-widest font-bold",
                        aiFeedback.analystTone === 'enthusiastic' ? "bg-emerald-500" : 
                        aiFeedback.analystTone === 'cynical' ? "bg-rose-500" : "bg-amber-500"
                      )}>
                        {aiFeedback.analystTone}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-8 flex-grow space-y-8">
                  {isAiLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-12 h-12 animate-spin text-accent" />
                      <p className="text-slate-400 font-medium animate-pulse uppercase tracking-[0.2em] text-xs">Simulating Market Variables</p>
                    </div>
                  ) : aiFeedback ? (
                    <div className="space-y-8 animate-in fade-in duration-1000">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Summary Analysis</Label>
                        <p className="text-lg text-slate-200 leading-relaxed font-body italic">
                          "{aiFeedback.feedbackText}"
                        </p>
                      </div>

                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5 relative">
                        <MessageSquareQuote className="absolute -top-3 -left-3 w-10 h-10 text-white/10" />
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-3">Customer Sentiment</Label>
                        <p className="text-xl font-headline font-bold text-white">
                          "{aiFeedback.customerQuote}"
                        </p>
                      </div>

                      <div className="space-y-3 p-6 bg-accent/5 rounded-3xl border border-accent/10">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-accent" />
                          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Year 2 Strategic Pivot</Label>
                        </div>
                        <p className="text-sm text-slate-300">
                          {aiFeedback.suggestion}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-slate-500">Analysis results for historical turns are being synchronized...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                {[
                  { label: "Year 1 Revenue", val: `₹${Math.round(chartData[11].profit * 100)}`, icon: IndianRupee },
                  { label: "Year 1 Profit", val: `₹${Math.round((chartData[11].profit * 100) * (selectedPriceTier?.margin || 0.1))}`, icon: TrendingUp, color: "text-emerald-400" },
                  { label: "Final Trust Index", val: `${Math.round(chartData[11].trust)}%`, icon: ShieldCheck, color: "text-green-400" },
                  { label: "Final Price Point", val: `₹${Math.round(scores.retailPrice)}`, icon: Zap, color: "text-amber-400" },
                  { label: "Total Reach", val: Math.round(scores.shortTermSales * 5000), icon: Users, color: "text-blue-400" }
                ].map((m, i) => (
                  <Card key={i} className="rounded-2xl border-none shadow-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><m.icon className={cn("w-5 h-5", m.color)} /></div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{m.label}</p>
                        <p className="text-2xl font-bold text-white">{m.val}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="lg:col-span-3 rounded-3xl border-none shadow-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-8">
                <CardHeader className="px-0 pt-0"><CardTitle className="font-headline text-white">Trajectory: Month 1-12</CardTitle></CardHeader>
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" label={{ value: 'Months Active', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.5)' }} />
                      <YAxis stroke="rgba(255,255,255,0.5)" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', color: '#fff' }} />
                      <Legend verticalAlign="top" height={36}/>
                      <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="Revenue" dot={false} />
                      <Line type="monotone" dataKey="trust" stroke="#22c55e" strokeWidth={3} name="Trust Index" dot={false} />
                      <Line type="monotone" dataKey="impact" stroke="#ec4899" strokeWidth={3} name="Earth Impact" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="rounded-3xl border-none shadow-xl bg-white/5 border border-white/10">
                <CardHeader><CardTitle className="font-headline flex items-center gap-2 text-white"><CircleCheck className="w-5 h-5 text-green-400" /> What Helped</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {scores.consistency >= 0.8 && (
                    <div className="p-4 bg-white/5 rounded-2xl text-sm border-l-4 border-green-500 text-slate-200">
                      {config.coreValue === 'euc' || config.coreValue === 'len' ? (
                        "Despite your poor environmental values and greenwashing, you have brand integrity: at least your actions match your values. This will appeal to customers who care more about appearance and price, than true quality and sustainability."
                      ) : config.coreValue === 'zw' && config.packagingType !== 'plastic' ? (
                        "Your genuine commitment to Zero Waste is verified by your plastic-free packaging, securing high trust among eco-advocates."
                      ) : config.coreValue === 'fts' && config.sourcingModel === 'lsf' ? (
                        "Directly sourcing from local farmers perfectly aligns with your Fair Trade promise, creating a powerful story of community impact."
                      ) : config.coreValue === 'vp' && selectedBase?.earthScore > 7 ? (
                        "Your use of high-quality plant-based ingredients confirms your Vegan Purity values to even the most discerning customers."
                      ) : (
                        `Strong brand alignment: Your production choices and material sourcing directly support your claim of ${selectedValue?.name.toLowerCase()}.`
                      )}
                    </div>
                  )}
                  {scores.environmentalScore > 7 && (
                    <div className="p-4 bg-white/5 rounded-2xl text-sm border-l-4 border-green-500 text-slate-200">
                      High Earth Score is attracting the growing eco-conscious segment of the {selectedAudience?.name} market.
                    </div>
                  )}
                  {selectedProduction?.id === 'spw' && (
                    <div className="p-4 bg-white/5 rounded-2xl text-sm border-l-4 border-green-500 text-slate-200">
                      Solar-powered production is a massive trust-builder, specifically validating your ethical claims for {selectedAudience?.name}.
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-none shadow-xl bg-white/5 border border-white/10">
                <CardHeader><CardTitle className="font-headline flex items-center gap-2 text-white"><AlertCircle className="w-5 h-5 text-red-400" /> What Hurt</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {scores.consistency < 0.8 && (
                    <div className="p-4 bg-white/5 rounded-2xl text-sm border-l-4 border-red-500 text-slate-200">
                      {config.coreValue === 'zw' && config.packagingType === 'plastic' ? (
                        "Claiming 'Zero Waste' while using plastic packaging is seen as a major integrity breach by your audience."
                      ) : config.coreValue === 'fts' && config.sourcingModel === 'is' ? (
                        "Your 'Fair Trade' marketing message is undermined by your reliance on anonymous industrial suppliers."
                      ) : (
                        "A strategic mismatch exists: Your audience has detected that your primary marketing message isn't backed by your production reality."
                      )}
                    </div>
                  )}
                  {selectedPackaging?.id === 'plastic' && <div className="p-4 bg-white/5 rounded-2xl text-sm border-l-4 border-red-500 text-slate-200">Plastic packaging is causing a significant decline in trust and Earth Score.</div>}
                  {selectedPriceTier?.id === 'luxury' && selectedAudience?.id === 'stu' && <div className="p-4 bg-white/5 rounded-2xl text-sm border-l-4 border-red-500 text-slate-200">Your pricing is way too high for your target audience (Students).</div>}
                </CardContent>
              </Card>
            </div>

            <section className="space-y-8 max-w-6xl mx-auto">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-accent" />
                <h3 className="text-3xl font-headline font-bold text-white uppercase tracking-wider">Customer Feedback</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 px-2 flex items-center gap-2">
                    <ThumbsUp className="w-3 h-3" /> Positive Voices
                  </Label>
                  <div className="grid gap-4">
                    {isAiLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                      ))
                    ) : aiFeedback?.positiveReviews && aiFeedback.positiveReviews.length > 0 ? (
                      aiFeedback.positiveReviews.map((review, i) => (
                        <div key={i} className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex gap-4 group hover:bg-emerald-500/10 transition-all">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-emerald-400" />
                          </div>
                          <p className="text-slate-300 italic font-body leading-relaxed">"{review}"</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic px-2">No specific praise recorded for this session.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-rose-400 px-2 flex items-center gap-2">
                    <ThumbsDown className="w-3 h-3" /> Critical Voices
                  </Label>
                  <div className="grid gap-4">
                    {isAiLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                      ))
                    ) : aiFeedback?.negativeReviews && aiFeedback.negativeReviews.length > 0 ? (
                      aiFeedback.negativeReviews.map((review, i) => (
                        <div key={i} className="p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex gap-4 group hover:bg-rose-500/10 transition-all">
                          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-rose-400" />
                          </div>
                          <p className="text-slate-300 italic font-body leading-relaxed">"{review}"</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic px-2">No specific criticisms recorded for this session.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-center gap-4 pt-8">
              <div className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto">
                <div className="flex gap-4 w-full">
                  <Button variant="outline" onClick={() => setPhase('lab')} className="flex-1 rounded-full h-14 border-white/20 text-white hover:bg-white/10">Iterate Product</Button>
                  <Button onClick={handleExitTeam} className="flex-1 bg-primary rounded-full h-14 font-bold shadow-xl transition-all active:scale-[0.98] text-white">Start New Team Session</Button>
                </div>
                <Button asChild variant="ghost" className="text-slate-400 hover:text-white rounded-full h-12 gap-2">
                  <Link href="/"><Home className="w-4 h-4" /> Return to Main Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
