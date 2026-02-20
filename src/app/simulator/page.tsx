
"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sprout, 
  TrendingUp, 
  Heart, 
  ShieldCheck, 
  Leaf, 
  AlertCircle, 
  CheckCircle2, 
  Dna,
  Zap,
  ChevronRight,
  ArrowRight,
  History,
  Sparkles,
  Award,
  CircleCheck,
  Package,
  Factory,
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

const MAROMA_LOGO = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/LOGO%20only%20NEW%20TRANS%202025.png?alt=media&token=916bf295-69a1-4640-9f92-d8d2560ee0c2";

export default function SimulatorPage() {
  const [phase, setPhase] = useState<'intro' | 'lab' | 'market'>('intro');
  const [teamName, setTeamName] = useState("");
  
  // 9-Step Selection State
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

  // Comprehensive Scoring Logic
  const scores = useMemo(() => {
    // 1. Production Cost
    const productionCost = selectedBase.cost + selectedSourcing.costDelta + selectedPackaging.cost + selectedProduction.costDelta;
    
    // 2. Retail Price
    const retailPrice = productionCost * (1 + selectedPriceTier.margin);

    // 3. Environmental Score (Average Ingredient E score * Packaging Multiplier)
    const baseEarth = selectedBase.earthScore;
    const environmentalScore = Math.min(10, baseEarth * selectedPackaging.envMultiplier);

    // 4. Ethical Consistency Check
    let consistency = 1.0;
    
    // Greenwashing Penalty: Zero waste / Low carbon value with plastic packaging
    if ((config.coreValue === 'zw' || config.coreValue === 'lcf') && config.packagingType === 'plastic') {
      consistency -= 0.5;
    }
    // Fair Trade value with industrial supplier
    if (config.coreValue === 'fts' && config.sourcingModel === 'is') {
      consistency -= 0.5;
    }
    // "Looks Environmental but is not" is a deliberate consistency failure
    if (config.coreValue === 'len') {
      consistency -= 0.7;
    }

    // 5. Short-Term Sales
    const appealScore = selectedBase.appeal * selectedProduction.authenticity * selectedAudience.baseAppeal;
    const accessibility = selectedPriceTier.accessibility / selectedAudience.priceSensitivity;
    const marketingClarity = config.message.length > 5 ? 1.0 : 0.5;
    const shortTermSales = (appealScore * 0.4) + (accessibility * 0.3 * 10) + (marketingClarity * 0.3 * 10);

    // 6. Customer Trust
    const trustBase = (environmentalScore * 0.5) + (consistency * 0.3 * 10) + (selectedPriceTier.fairness * 0.2 * 10);
    const trust = Math.min(100, (trustBase * 10) + selectedSourcing.trustBonus + selectedProduction.trustBonus);

    // 7. Longevity Index
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

  // Simulation Data (Trajectory)
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {phase === 'intro' && (
          <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto">
              <Sprout className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Ethical Market Simulator</h1>
            <p className="text-xl text-muted-foreground font-body leading-relaxed">
              Based on what you have learned today about how Maroma makes its products, you will now create an imaginary product that we will run through a market simulator to see how it performs against other teams' products.
            </p>
            <div className="space-y-4 pt-8">
              <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Team Name</Label>
              <Input 
                placeholder="The Eco-Warriors" 
                value={teamName} 
                onChange={e => setTeamName(e.target.value)}
                className="rounded-xl h-14 text-center text-lg"
              />
              <Button 
                disabled={!teamName} 
                onClick={() => setPhase('lab')}
                className="w-full bg-primary rounded-full h-14 text-lg font-bold shadow-lg"
              >
                Enter the Workshop <ChevronRight className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {phase === 'lab' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Inspiring Sidebar Title */}
            <div className="lg:col-span-1 space-y-6 sticky top-24 h-fit">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 shrink-0">
                    <Image 
                      src={MAROMA_LOGO}
                      alt="Maroma Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h2 className="text-4xl font-headline font-bold text-primary leading-tight">
                    Welcome <br /> {teamName}
                  </h2>
                </div>
                <p className="text-2xl font-headline font-bold text-accent">Create Your Product</p>
              </div>
              <div className="pt-8 p-6 bg-white/50 rounded-3xl border border-dashed border-primary/20">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every selection is a statement. Apply the knowledge from your tour to craft a brand that balances Earth care and human prosperity.
                </p>
              </div>
            </div>

            {/* Step-by-Step Lab */}
            <div className="lg:col-span-2 space-y-12 pb-20">
              <div className="space-y-10">
                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                    <Award className="w-6 h-6 text-accent" /> 1. Product & Format
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                      <Select value={config.category} onValueChange={v => handleUpdateConfig('category', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Format</Label>
                      <Select value={config.format} onValueChange={v => handleUpdateConfig('format', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
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
                        <SelectTrigger className="h-12 rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INGREDIENT_BASES.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Where do we get our ingredients?</Label>
                      <Select value={config.sourcingModel} onValueChange={v => handleUpdateConfig('sourcingModel', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
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
                        <SelectTrigger className="h-12 rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PACKAGING_TYPES.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Production Method</Label>
                      <Select value={config.productionMethod} onValueChange={v => handleUpdateConfig('productionMethod', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCTION_METHODS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                    <Target className="w-6 h-6 text-accent" /> 4. Strategy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Audience</Label>
                      <Select value={config.targetAudience} onValueChange={v => handleUpdateConfig('targetAudience', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TARGET_AUDIENCES.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price Tier</Label>
                      <Select value={config.priceTier} onValueChange={v => handleUpdateConfig('priceTier', v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
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
                        <SelectTrigger className="h-12 rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
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
              </div>

              <Button 
                onClick={() => setPhase('market')}
                className="w-full bg-accent hover:bg-accent/90 rounded-full h-16 text-lg font-bold shadow-xl shadow-accent/20"
              >
                Launch Simulation <ArrowRight className="ml-2" />
              </Button>
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

            {/* Final Market Scorecard Card */}
            <div className="max-w-4xl mx-auto">
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-primary text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Dna className="w-32 h-32" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="font-headline text-3xl">Market Readiness</CardTitle>
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
              {/* Metric Cards */}
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

              {/* Chart */}
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

            <div className="flex justify-center gap-4 pt-8 pb-20">
              <Button variant="outline" onClick={() => setPhase('lab')} className="rounded-full px-12 h-14">Iterate Product</Button>
              <Button onClick={() => window.location.reload()} className="bg-primary rounded-full px-12 h-14 font-bold shadow-xl">Start New Team Session</Button>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
