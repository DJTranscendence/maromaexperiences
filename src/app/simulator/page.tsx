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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sprout, 
  Heart, 
  ShieldCheck, 
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
  Users
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
  CORE_VALUES 
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
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const TEAM_EMBLEMS = [
  { id: 'brand-13', name: 'Brand 13', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F13-01.png?alt=media&token=7b4e1e0d-f9be-4758-9eb8-51678eadcc31' },
  { id: 'brand-7', name: 'Brand 7', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F7-01.png?alt=media&token=23f53117-a9d8-4907-964e-9281c41dfb86' },
  { id: 'brand-10', name: 'Brand 10', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F10-01.png?alt=media&token=fa6aee12-86a5-4cf2-bd0c-2b18f822d65e' },
  { id: 'brand-6', name: 'Brand 6', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F6-01.png?alt=media&token=0f067a3a-ddd5-418f-b714-e714efd7282c' },
  { id: 'brand-9', name: 'Brand 9', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F9-01.png?alt=media&token=41665223-538c-482e-ac5e-45835a6d8557' },
  { id: 'brand-19', name: 'Brand 19', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F19-01.png?alt=media&token=05bdc083-e465-4c82-b42e-cc94aadba5d8' },
  { id: 'brand-14', name: 'Brand 14', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F14-01.png?alt=media&token=883ae152-fea5-40c3-9cb5-20d73a0e1f60' },
  { id: 'brand-12', name: 'Brand 12', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F12-01.png?alt=media&token=4ff97d12-c967-4e32-be10-49bfa6dc68f5' },
  { id: 'brand-main', name: 'Main Logo', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2FGame%20Logos-01.png?alt=media&token=be0a96fc-03fc-4e8d-bc3b-b4c9f5f374a2' },
  { id: 'brand-8', name: 'Brand 8', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F8-01.png?alt=media&token=535b652d-ecad-4390-a1c0-eebada8459d6' },
  { id: 'brand-11', name: 'Brand 11', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F11-01.png?alt=media&token=eb2cfcfa-7a1e-4097-9bf3-6c9b38d0d885' },
  { id: 'brand-17', name: 'Brand 17', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F17-01.png?alt=media&token=bdf30366-24cb-4d7a-be14-f8f2b2f9ccf3' },
  { id: 'brand-18', name: 'Brand 18', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F18-01.png?alt=media&token=a649f0b5-c642-4bfb-a467-a05de4a09cc1' },
  { id: 'brand-2', name: 'Brand 2', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F2-01.png?alt=media&token=4c94e823-4cc3-43c3-bd2f-393b7ef69123' },
  { id: 'brand-4', name: 'Brand 4', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F4-01.png?alt=media&token=24c47a94-c6a3-4da4-ba42-adeedad88e96' },
  { id: 'brand-16', name: 'Brand 16', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F16-01.png?alt=media&token=60b457b6-ad41-4544-b124-bd93055c4f55' },
  { id: 'brand-3', name: 'Brand 3', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2F3-01.png?alt=media&token=242a85c4-c6bd-4cf4-856b-9763f375db9f' },
  { id: 'brand-special', name: 'Special Brand', url: 'https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Game%20Brand%20Logos%2FUntitled-1-01.png?alt=media&token=df177869-bca3-4454-b2d4-16e2570e2327' },
];

const TITLE_IMAGE_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Product%20Game%20Title%202.png?alt=media&token=f7698e9d-9e74-45e2-a0c1-916f1b9904db";

export default function SimulatorPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [phase, setPhase] = useState<'intro' | 'lab' | 'market'>('intro');
  const [teamName, setTeamName] = useState("");
  const [selectedEmblem, setSelectedEmblem] = useState(TEAM_EMBLEMS[0].url);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  
  // Real-time listener for join events
  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "simulator_events"),
      orderBy("timestamp", "desc"),
      limit(5)
    );
  }, [firestore]);

  const { data: events } = useCollection(eventsQuery);

  useEffect(() => {
    if (events && events.length > 0) {
      const latest = events[0];
      // Only toast if it's a new event and not the very first one on page load
      if (latest.id !== lastEventId) {
        if (lastEventId !== null) {
          toast({
            title: "Player Joined",
            description: `${latest.teamName} joined the game`,
          });
        }
        setLastEventId(latest.id);
      }
    }
  }, [events, lastEventId, toast]);

  // Selection State
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

  // Scoring Logic
  const scores = useMemo(() => {
    const productionCost = selectedBase.cost + selectedSourcing.costDelta + selectedPackaging.cost + selectedProduction.costDelta;
    const retailPrice = productionCost * (1 + selectedPriceTier.margin);
    const baseEarth = selectedBase.earthScore;
    const environmentalScore = Math.min(10, baseEarth * selectedPackaging.envMultiplier);

    let consistency = 1.0;
    if ((config.coreValue === 'zw' || config.coreValue === 'lcf') && config.packagingType === 'plastic') consistency -= 0.5;
    if (config.coreValue === 'fts' && config.sourcingModel === 'is') consistency -= 0.5;
    if (config.coreValue === 'len') consistency -= 0.7;

    const appealScore = selectedBase.appeal * selectedProduction.authenticity * selectedAudience.baseAppeal;
    const accessibility = selectedPriceTier.accessibility / selectedAudience.priceSensitivity;
    const marketingClarity = config.message.length > 5 ? 1.0 : 0.5;
    const shortTermSales = (appealScore * 0.4) + (accessibility * 0.3 * 10) + (marketingClarity * 0.3 * 10);

    const trustBase = (environmentalScore * 0.5) + (consistency * 0.3 * 10) + (selectedPriceTier.fairness * 0.2 * 10);
    const trust = Math.min(100, (trustBase * 10) + selectedSourcing.trustBonus + selectedProduction.trustBonus);

    const reinvestmentCapacity = selectedPriceTier.margin * 10;
    const longevity = (trust * 0.06) + (reinvestmentCapacity * 0.4);

    return { 
      environmentalScore, 
      trust, 
      shortTermSales, 
      longevity, 
      productionCost, 
      retailPrice,
      consistency 
    };
  }, [config, selectedBase, selectedSourcing, selectedPackaging, selectedProduction, selectedAudience, selectedPriceTier, selectedValue]);

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      month: i + 1,
      profit: Math.max(0, (scores.shortTermSales * 8) + (i * (scores.longevity - 5))),
      trust: Math.min(100, scores.trust + (i * (scores.environmentalScore > 5 ? 2 : -4))),
      impact: Math.min(10, scores.environmentalScore + (i * 0.1))
    }));
  }, [scores]);

  const handleUpdateConfig = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleJoinGame = () => {
    if (!teamName.trim()) {
      toast({
        variant: "destructive",
        title: "Team Name Required",
        description: "Please enter a team name to start the workshop."
      });
      return;
    }

    // Broadcast join event
    if (firestore) {
      addDocumentNonBlocking(collection(firestore, "simulator_events"), {
        teamName,
        type: 'join',
        timestamp: serverTimestamp()
      });
    }

    setPhase('lab');
  };

  const launchSimulation = () => {
    if (firestore) {
      addDocumentNonBlocking(collection(firestore, "simulator_sessions"), {
        teamName,
        productType: config.format,
        ingredients: [selectedBase.name, selectedSourcing.name],
        scores: {
          earth: Math.round(scores.environmentalScore * 10),
          trust: Math.round(scores.trust),
          profit: Math.round(chartData[11].profit),
          longevity: Math.round(scores.longevity * 10)
        },
        createdAt: serverTimestamp()
      });
    }
    setPhase('market');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {phase === 'intro' && (
          <div className="max-w-3xl mx-auto text-center space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4">
              <div className="relative h-40 w-full max-w-2xl mx-auto">
                <Image 
                  src={TITLE_IMAGE_URL}
                  alt="The Maroma Product Game"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <p className="text-xl text-muted-foreground font-body leading-relaxed max-w-2xl mx-auto">
                Based on what you have learned today about how Maroma makes its products, you will now create an imaginary product that we will run through a market simulator.
              </p>
            </div>

            <div className="space-y-10 py-8 px-8 bg-white rounded-[3rem] shadow-xl border border-border/50">
              <div className="space-y-4 text-left">
                <Label className="text-sm font-bold text-muted-foreground tracking-wide px-2">
                  1. Choose Your Team Name (it can be different to your logo name)
                </Label>
                <Input 
                  placeholder="e.g. The Eco-Warriors" 
                  value={teamName} 
                  onChange={e => setTeamName(e.target.value)}
                  className="rounded-2xl h-16 text-center text-2xl font-headline border-primary/20 focus-visible:ring-primary shadow-inner"
                />
              </div>

              <div className="space-y-6 text-left">
                <Label className="text-sm font-bold text-muted-foreground tracking-wide px-2">
                  2. Choose Your Logo Emblem
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                  {TEAM_EMBLEMS.map((emblem) => (
                    <button
                      key={emblem.id}
                      onClick={() => setSelectedEmblem(emblem.url)}
                      className={cn(
                        "relative aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-300 group bg-muted/20",
                        selectedEmblem === emblem.url ? "border-primary scale-105 shadow-lg" : "border-transparent hover:border-muted-foreground/30"
                      )}
                    >
                      <Image src={emblem.url} alt={emblem.name} fill className="object-contain p-2" unoptimized />
                      {selectedEmblem === emblem.url && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="text-primary w-6 h-6 drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleJoinGame}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-16 text-xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 gap-2"
              >
                Join the Game <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}

        {phase === 'lab' && (
          <div className="animate-in fade-in duration-1000">
            <div className="col-span-full mb-16 text-center space-y-4">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <Image src={selectedEmblem} alt="Team Logo" fill className="object-contain" unoptimized />
              </div>
              <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary tracking-tight">
                Welcome, {teamName}
              </h1>
              <p className="text-2xl md:text-3xl font-headline font-bold text-accent uppercase tracking-widest">
                Let's Create Your Product
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-12 pb-20">
                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                    <Award className="w-6 h-6 text-accent" /> 1. Choose Your Product
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                      <Select value={config.category} onValueChange={v => handleUpdateConfig('category', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Format</Label>
                      <Select value={config.format} onValueChange={v => handleUpdateConfig('format', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {selectedCategory.formats.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-accent" /> 2. The Formula
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ingredient Base</Label>
                      <Select value={config.ingredientBase} onValueChange={v => handleUpdateConfig('ingredientBase', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INGREDIENT_BASES.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Where do we get our ingredients?</Label>
                      <Select value={config.sourcingModel} onValueChange={v => handleUpdateConfig('sourcingModel', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SOURCING_MODELS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                    <Package className="w-6 h-6 text-accent" /> 3. Packaging & Production
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Packaging Type</Label>
                      <Select value={config.packagingType} onValueChange={v => handleUpdateConfig('packagingType', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PACKAGING_TYPES.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Production Method</Label>
                      <Select value={config.productionMethod} onValueChange={v => handleUpdateConfig('productionMethod', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRODUCTION_METHODS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-12 pb-20">
                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                    <Target className="w-6 h-6 text-accent" /> 4. Strategy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Audience</Label>
                      <Select value={config.targetAudience} onValueChange={v => handleUpdateConfig('targetAudience', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TARGET_AUDIENCES.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price Tier</Label>
                      <Select value={config.priceTier} onValueChange={v => handleUpdateConfig('priceTier', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRICE_TIERS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                    <Heart className="w-6 h-6 text-accent" /> 5. Brand Identity
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Core Value Emphasis</Label>
                      <Select value={config.coreValue} onValueChange={v => handleUpdateConfig('coreValue', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CORE_VALUES.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground italic px-1">{selectedValue.description}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Marketing Message</Label>
                      <Input 
                        placeholder="e.g., Purely Natural. Purely Maroma." 
                        value={config.message} 
                        onChange={e => handleUpdateConfig('message', e.target.value)} 
                        className="rounded-xl h-12"
                      />
                    </div>
                  </div>
                </section>

                <Button 
                  onClick={launchSimulation}
                  className="w-full bg-accent hover:bg-accent/90 text-white rounded-full h-16 text-lg font-bold shadow-xl shadow-accent/20 transition-all active:scale-95"
                >
                  Launch Simulation <ArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {phase === 'market' && (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000">
            <div className="text-center space-y-4">
              <Badge className="bg-green-100 text-green-700 px-6 py-2 rounded-full font-bold">Launch Successful: Year 1 trajectory</Badge>
              <h2 className="text-5xl font-headline font-bold text-primary">Simulation Analysis</h2>
              <p className="text-muted-foreground">How your {config.format} performed in the real world.</p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-primary text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Dna className="w-32 h-32" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="font-headline text-3xl">Final Market Scorecard</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">Earth Score</span>
                      <span className="text-3xl font-bold font-headline">{Math.round(scores.environmentalScore * 10)}/100</span>
                    </div>
                    <Progress value={scores.environmentalScore * 10} className="h-3 bg-white/20" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">Brand Longevity</span>
                      <span className="text-3xl font-bold font-headline">{Math.round(scores.longevity * 10)}%</span>
                    </div>
                    <Progress value={scores.longevity * 10} className="h-3 bg-white/20" />
                  </div>

                  <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">Est. Retail Price</span>
                    <span className="text-5xl font-bold font-headline">₹{Math.round(scores.retailPrice)}</span>
                  </div>

                  {scores.consistency < 1 && (
                    <div className="bg-red-500/20 p-4 rounded-2xl flex items-center gap-3 border border-red-500/30">
                      <AlertCircle className="w-6 h-6 text-red-300" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold uppercase text-red-100 tracking-widest">Consistency Warning</span>
                        <span className="text-xs text-red-100/70">Market feedback suggests your packaging or sourcing contradicts your brand message.</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                {[
                  { label: "Year 1 Revenue", val: `₹${Math.round(chartData[11].profit)}`, icon: IndianRupee },
                  { label: "Public Trust Index", val: `${Math.round(chartData[11].trust)}%`, icon: ShieldCheck, color: "text-green-600" },
                  { label: "Market Resonance", val: Math.round(scores.shortTermSales * 10), icon: Zap, color: "text-amber-500" },
                  { label: "Human Impact", val: Math.round(selectedSourcing.humanScore * 10), icon: Users, color: "text-blue-500" }
                ].map((m, i) => (
                  <Card key={i} className="rounded-2xl border-none shadow-lg">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <m.icon className={cn("w-5 h-5", m.color)} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{m.label}</p>
                        <p className="text-2xl font-bold text-primary">{m.val}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="lg:col-span-3 rounded-3xl border-none shadow-2xl bg-white p-8">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="font-headline">Trajectory: Month 1-12</CardTitle>
                </CardHeader>
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" label={{ value: 'Months Active', position: 'insideBottom', offset: -5 }} />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="top" height={36}/>
                      <Line type="monotone" dataKey="profit" stroke="#2563eb" strokeWidth={3} name="Revenue" dot={false} />
                      <Line type="monotone" dataKey="trust" stroke="#16a34a" strokeWidth={3} name="Trust Index" dot={false} />
                      <Line type="monotone" dataKey="impact" stroke="#db2777" strokeWidth={3} name="Earth Impact" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="rounded-3xl border-none shadow-xl bg-muted/20">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <CircleCheck className="w-5 h-5 text-green-600" /> What Helped
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scores.consistency >= 1 && <div className="p-4 bg-white rounded-2xl text-sm border-l-4 border-green-500">Your brand integrity is perfect. Customers see your actions match your values.</div>}
                  {scores.environmentalScore > 7 && <div className="p-4 bg-white rounded-2xl text-sm border-l-4 border-green-500">High Earth Score is attracting the growing eco-conscious segment.</div>}
                  {selectedProduction.id === 'spw' && <div className="p-4 bg-white rounded-2xl text-sm border-l-4 border-green-500">Solar-powered production is a massive trust-builder for your {selectedAudience.name} audience.</div>}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-none shadow-xl bg-muted/20">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" /> What Hurt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scores.consistency < 1 && <div className="p-4 bg-white rounded-2xl text-sm border-l-4 border-red-500">The market detected a mismatch between your values and your actions (Greenwashing).</div>}
                  {selectedPackaging.id === 'plastic' && <div className="p-4 bg-white rounded-2xl text-sm border-l-4 border-red-500">Plastic packaging is causing a significant decline in trust and Earth Score.</div>}
                  {selectedPriceTier.id === 'luxury' && selectedAudience.id === 'stu' && <div className="p-4 bg-white rounded-2xl text-sm border-l-4 border-red-500">Your pricing is way too high for your target audience (Students).</div>}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center gap-4 pt-8 pb-20">
              <div className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto">
                <div className="flex gap-4 w-full">
                  <Button variant="outline" onClick={() => setPhase('lab')} className="flex-1 rounded-full h-14">Iterate Product</Button>
                  <Button onClick={() => window.location.reload()} className="flex-1 bg-primary rounded-full h-14 font-bold shadow-xl transition-all active:scale-95">Start New Team Session</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
