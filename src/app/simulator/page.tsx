
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Loader2,
  Trophy
} from "lucide-react";
import { INGREDIENTS, PRODUCT_TYPES, TOUR_QUESTIONS, Ingredient } from "@/lib/simulator-data";
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

export default function SimulatorPage() {
  const [phase, setPhase] = useState<'intro' | 'tour-check' | 'lab' | 'market'>('intro');
  const [teamName, setTeamName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(PRODUCT_TYPES[0]);
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState(500);
  const [unlockedBonuses, setUnlockedBonuses] = useState<string[]>([]);
  
  // Scoring
  const scores = useMemo(() => {
    const earth = selectedIngredients.reduce((acc, curr) => acc + curr.earthScore, 0) / (selectedIngredients.length || 1);
    const appeal = selectedIngredients.reduce((acc, curr) => acc + curr.appeal, 0) / (selectedIngredients.length || 1);
    const cost = selectedIngredients.reduce((acc, curr) => acc + curr.cost, 0);
    
    // Logic: Trust drops if Earth is low. Profit drops if Trust is low.
    const trust = (earth * 10) + (unlockedBonuses.includes('Bonus Trust (+20)') ? 20 : 0);
    const shortTermSales = (appeal * 1.5) - (price / 200);
    const longevity = (trust * 0.7) + (earth * 2);

    return { earth, appeal, cost, trust, shortTermSales, longevity };
  }, [selectedIngredients, price, unlockedBonuses]);

  // Simulation Data
  const chartData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      month: i + 1,
      profit: Math.max(0, (scores.shortTermSales * 10) - (i * (10 - scores.earth))),
      trust: Math.min(100, scores.trust + (i * (scores.earth > 5 ? 2 : -5))),
      longevity: Math.max(0, scores.longevity + (i * (scores.earth - 4)))
    }));
  }, [scores]);

  const toggleIngredient = (ing: Ingredient) => {
    if (selectedIngredients.find(i => i.id === ing.id)) {
      setSelectedIngredients(selectedIngredients.filter(i => i.id !== ing.id));
    } else {
      setSelectedIngredients([...selectedIngredients, ing]);
    }
  };

  const handleTourAnswer = (qIdx: number, optIdx: number) => {
    if (optIdx === TOUR_QUESTIONS[qIdx].correct) {
      setUnlockedBonuses([...unlockedBonuses, TOUR_QUESTIONS[qIdx].reward]);
    }
    if (qIdx === TOUR_QUESTIONS.length - 1) {
      setPhase('lab');
    }
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
            <p className="text-xl text-muted-foreground font-body">
              Can you build a brand that cares for the Earth as much as it cares for people? Design your product and see if it survives the test of time.
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
                onClick={() => setPhase('tour-check')}
                className="w-full bg-primary rounded-full h-14 text-lg font-bold"
              >
                Enter the Workshop <ChevronRight className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {phase === 'tour-check' && (
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center">
              <Badge className="mb-4 bg-accent/20 text-accent border-none px-4 py-1 uppercase tracking-widest font-bold">Tour Knowledge Challenge</Badge>
              <h2 className="text-3xl font-headline font-bold text-primary">Recall Your Journey</h2>
              <p className="text-muted-foreground mt-2">Correct answers unlock Fair Trade bonuses for your brand.</p>
            </div>
            
            <div className="space-y-8">
              {TOUR_QUESTIONS.map((q, qIdx) => (
                <Card key={qIdx} className="rounded-3xl border-none shadow-xl overflow-hidden">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg font-headline">{q.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 gap-3">
                    {q.options.map((opt, optIdx) => (
                      <Button 
                        key={optIdx} 
                        variant="outline" 
                        onClick={() => handleTourAnswer(qIdx, optIdx)}
                        className="rounded-xl h-12 justify-start text-left px-6 hover:bg-primary hover:text-white transition-all"
                      >
                        {opt}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {phase === 'lab' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Sidebar Stats */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-primary text-white sticky top-24 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Dna className="w-32 h-32" />
                </div>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Brand DNA</CardTitle>
                  <p className="text-primary-foreground/70 text-sm">Real-time Impact Analysis</p>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span>Earth Score</span>
                      <span>{Math.round(scores.earth)}/10</span>
                    </div>
                    <Progress value={scores.earth * 10} className="h-2 bg-white/20" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span>Customer Trust</span>
                      <span>{Math.round(scores.trust)}/100</span>
                    </div>
                    <Progress value={scores.trust} className="h-2 bg-white/20" />
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/50">Estimated Cost</p>
                        <p className="text-3xl font-headline font-bold">₹{scores.cost}</p>
                      </div>
                      <Badge className="bg-white/20 border-none">Budget: ₹500</Badge>
                    </div>
                  </div>
                  {unlockedBonuses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/50">Unlocked Perks</p>
                      <div className="flex flex-wrap gap-2">
                        {unlockedBonuses.map((b, i) => <Badge key={i} variant="secondary" className="bg-accent text-white border-none text-[9px]">{b}</Badge>)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="p-6 bg-white rounded-3xl border border-border/50">
                <h3 className="font-headline font-bold text-primary mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" /> Expert Insight
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {scores.earth < 4 ? "Careful: Low Earth scores might boost early profits, but consumers will eventually turn away." : "Strong ethics! Your trust index is climbing, which is the key to longevity."}
                </p>
              </div>
            </div>

            {/* Main Lab */}
            <div className="lg:col-span-2 space-y-12">
              <section>
                <h3 className="text-2xl font-headline font-bold text-primary mb-6">1. Choose Your Vessel</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {PRODUCT_TYPES.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => setSelectedProduct(p)}
                      className={cn(
                        "p-6 rounded-3xl border-2 transition-all text-center group",
                        selectedProduct.id === p.id ? "border-primary bg-primary/5 shadow-lg" : "border-border hover:border-primary/30"
                      )}
                    >
                      <span className={cn("block font-bold", selectedProduct.id === p.id ? "text-primary" : "text-muted-foreground")}>{p.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-headline font-bold text-primary mb-6">2. Build the Formula</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {INGREDIENTS.map(ing => (
                    <button 
                      key={ing.id} 
                      onClick={() => toggleIngredient(ing)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-3xl border-2 text-left transition-all",
                        selectedIngredients.find(i => i.id === ing.id) ? "border-accent bg-accent/5 shadow-md" : "border-border hover:border-accent/30"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        selectedIngredients.find(i => i.id === ing.id) ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {ing.category === 'fragrance' ? <Leaf className="w-6 h-6" /> : ing.category === 'base' ? <TrendingUp className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-primary">{ing.name}</h4>
                          <span className="text-xs font-bold text-accent">₹{ing.cost}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{ing.description}</p>
                        <div className="flex gap-4 mt-2">
                          <div className="flex items-center gap-1 text-[9px] font-bold uppercase"><Sprout className="w-3 h-3" /> E: {ing.earthScore}</div>
                          <div className="flex items-center gap-1 text-[9px] font-bold uppercase"><Heart className="w-3 h-3" /> A: {ing.appeal}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-headline font-bold text-primary mb-6">3. Position Your Brand</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Market Message</Label>
                    <Input 
                      placeholder="e.g., Purely Natural. Purely Maroma." 
                      value={message} 
                      onChange={e => setMessage(e.target.value)} 
                      className="rounded-xl h-12"
                    />
                  </div>
                  <Button 
                    onClick={() => setPhase('market')}
                    disabled={selectedIngredients.length === 0}
                    className="w-full bg-accent hover:bg-accent/90 rounded-full h-16 text-lg font-bold shadow-xl shadow-accent/20"
                  >
                    Launch Simulation <ArrowRight className="ml-2" />
                  </Button>
                </div>
              </section>
            </div>
          </div>
        )}

        {phase === 'market' && (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000">
            <div className="text-center space-y-4">
              <Badge className="bg-green-100 text-green-700 px-6 py-2 rounded-full font-bold">Market Active: Year 1</Badge>
              <h2 className="text-5xl font-headline font-bold text-primary">Simulation Results</h2>
              <p className="text-muted-foreground">Watch how your ethical choices influence the market over 12 months.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Metric Cards */}
              <div className="lg:col-span-1 space-y-4">
                {[
                  { label: "Short-term Profit", val: Math.round(scores.shortTermSales * 10), icon: TrendingUp, color: "text-blue-600" },
                  { label: "Final Trust Index", val: Math.round(chartData[11].trust), icon: ShieldCheck, color: "text-green-600" },
                  { label: "Brand Longevity", val: Math.round(chartData[11].longevity), icon: History },
                  { label: "Earth Impact", val: `${Math.round(scores.earth * 10)}%`, icon: Leaf, color: "text-emerald-600" }
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
                  <CardTitle className="font-headline">Trajectory Forecast</CardTitle>
                </CardHeader>
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="top" height={36}/>
                      <Line type="monotone" dataKey="profit" stroke="#2563eb" strokeWidth={3} name="Profitability" dot={false} />
                      <Line type="monotone" dataKey="trust" stroke="#16a34a" strokeWidth={3} name="Consumer Trust" dot={false} />
                      <Line type="monotone" dataKey="longevity" stroke="#db2777" strokeWidth={3} name="Longevity Index" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="rounded-3xl border-none shadow-xl bg-muted/20">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" /> What Helped
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scores.earth > 6 && <div className="p-4 bg-white rounded-2xl text-sm border-l-4 border-green-500">Your high-integrity ingredients built deep consumer trust.</div>}
                  {unlockedBonuses.length > 0 && <div className="p-4 bg-white rounded-2xl text-sm border-l-4 border-green-500">Tour knowledge gave you a competitive edge.</div>}
                  {scores.appeal > 7 && <div className="p-4 bg-white rounded-2xl text-sm border-l-4 border-green-500">The product's high appeal ensured a strong market entry.</div>}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-none shadow-xl bg-muted/20">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" /> What Hurt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scores.earth < 4 && <div className="p-4 bg-white rounded-2xl text-sm border-l-4 border-red-500">Environmental neglect is causing a massive trust deficit.</div>}
                  {price > 600 && <div className="p-4 bg-white rounded-2xl text-sm border-l-4 border-red-500">Price accessibility is low for student demographics.</div>}
                  {selectedIngredients.some(i => i.id === 'plastic') && <div className="p-4 bg-white rounded-2xl text-sm border-l-4 border-red-500">Plastic packaging is being flagged by eco-conscious buyers.</div>}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center gap-4 pt-8">
              <Button variant="outline" onClick={() => setPhase('lab')} className="rounded-full px-12 h-14">Iterate Product</Button>
              <Button onClick={() => window.location.reload()} className="bg-primary rounded-full px-12 h-14 font-bold shadow-xl">New Session</Button>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

const History = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);
