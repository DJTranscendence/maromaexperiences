
"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AvailabilityBadge from "@/components/booking/AvailabilityBadge";
import IndividualBookingForm from "@/components/booking/IndividualBookingForm";
import SchoolBookingForm from "@/components/booking/SchoolBookingForm";
import CorporateBookingForm from "@/components/booking/CorporateBookingForm";
import { 
  MapPin, 
  Clock, 
  Users, 
  Share2, 
  Heart, 
  Calendar, 
  Loader2, 
  Sparkles, 
  Bell, 
  Send, 
  Check,
  MessageCircleQuestion,
  Gift,
  Palette,
  Utensils,
  Compass,
  Award,
  Camera,
  History,
  Trees,
  Users2,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Tour } from "@/lib/types";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const getHighlightIcon = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes('q&a') || t.includes('question')) return <MessageCircleQuestion className="w-5 h-5 text-accent" />;
  if (t.includes('gift') || t.includes('take-home')) return <Gift className="w-5 h-5 text-accent" />;
  if (t.includes('workshop') || t.includes('craft') || t.includes('clay')) return <Palette className="w-5 h-5 text-accent" />;
  if (t.includes('refreshments') || t.includes('coffee') || t.includes('catering') || t.includes('food')) return <Utensils className="w-5 h-5 text-accent" />;
  if (t.includes('tour') || t.includes('walk') || t.includes('expedition')) return <Compass className="w-5 h-5 text-accent" />;
  if (t.includes('certificate') || t.includes('award')) return <Award className="w-5 h-5 text-accent" />;
  if (t.includes('photo') || t.includes('camera')) return <Camera className="w-5 h-5 text-accent" />;
  if (t.includes('history') || t.includes('medieval')) return <History className="w-5 h-5 text-accent" />;
  if (t.includes('garden') || t.includes('nature') || t.includes('forest')) return <Trees className="w-5 h-5 text-accent" />;
  if (t.includes('team') || t.includes('challenge') || t.includes('group')) return <Users2 className="w-5 h-5 text-accent" />;
  
  return <CheckCircle2 className="w-5 h-5 text-accent" />;
};

export default function TourDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { toast } = useToast();
  const [notifyEmail, setNotifyEmail] = useState("");

  const tourRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, "tours", id);
  }, [firestore, id]);

  const { data: tour, isLoading } = useDoc<Tour>(tourRef);

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Registration Successful",
      description: "We'll let you know as soon as this experience goes live!",
    });
    setNotifyEmail("");
  };

  const DIRECTIONS_URL = "https://www.google.com/maps/search/?api=1&query=Maroma+Aspiration+Campus";
  const mapPlaceholder = PlaceHolderImages.find(p => p.id === 'map-campus')?.imageUrl || "https://picsum.photos/seed/maroma-map/400/300";

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-accent" />
          <p className="text-sm font-medium text-muted-foreground">Syncing experience details...</p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-headline font-bold text-primary">Experience not found</h1>
        <p className="text-muted-foreground mt-2">The experience you are looking for may have been moved or unpublished.</p>
        <Button asChild className="mt-8 rounded-full px-8" variant="outline">
          <a href="/">Back to Home</a>
        </Button>
      </div>
    );
  }

  const isComingSoon = tour.status === 'coming-soon';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <a href="/" className="hover:text-accent transition-colors">Tours & Workshops</a>
            <span>/</span>
            <span className="text-primary font-medium">{tour.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 hover:text-accent transition-colors"><Share2 className="w-4 h-4" /> Share</button>
            <button className="flex items-center gap-1.5 hover:text-accent transition-colors"><Heart className="w-4 h-4" /> Save</button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="relative h-[50vh] rounded-3xl overflow-hidden shadow-2xl border border-border/50">
            <Image
              src={tour.imageUrl}
              alt={tour.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute top-6 left-6 flex gap-2">
              <Badge className="bg-white/90 text-primary hover:bg-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold border-none shadow-lg capitalize">
                {tour.type}
              </Badge>
              {isComingSoon ? (
                <Badge className="bg-amber-500 text-white border-none rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 fill-current" /> Coming Soon
                </Badge>
              ) : (
                <Badge className="bg-green-600 text-white border-none rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg">
                  <Check className="w-3.5 h-3.5" /> Live
                </Badge>
              )}
              {!isComingSoon && (
                <AvailabilityBadge booked={tour.bookedSpaces} capacity={tour.capacity} className="bg-white/90 backdrop-blur-md shadow-lg" />
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-6">{tour.name}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Location Card */}
                  <a 
                    href={DIRECTIONS_URL} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex flex-col p-4 bg-white rounded-2xl border border-border hover:border-accent hover:shadow-lg transition-all group"
                  >
                    <div className="relative h-20 w-full mb-3 rounded-xl overflow-hidden">
                      <Image 
                        src={mapPlaceholder} 
                        alt="Campus Map" 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-accent/10 group-hover:bg-transparent transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-accent drop-shadow-md" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary truncate">{tour.location}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Get Directions</span>
                  </a>

                  <div className="flex flex-col p-4 bg-muted/20 border border-transparent rounded-2xl">
                    <div className="p-2 bg-white rounded-xl shadow-sm w-fit mb-3">
                      <Clock className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-sm font-bold text-primary">{tour.duration}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Duration</span>
                  </div>

                  <div className="flex flex-col p-4 bg-muted/20 border border-transparent rounded-2xl">
                    <div className="p-2 bg-white rounded-xl shadow-sm w-fit mb-3">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-sm font-bold text-primary">Up to {tour.capacity} Guest/s</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Capacity</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-2xl font-headline font-bold text-primary mb-4">About this experience</h2>
                <div className="text-lg text-muted-foreground leading-relaxed font-body whitespace-pre-wrap">
                  {tour.description}
                </div>
              </div>

              {tour.highlights && tour.highlights.length > 0 && (
                <div>
                  <h3 className="text-xl font-headline font-bold text-primary mb-6">Experience Highlights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {tour.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-muted/20 border border-border/50 group hover:bg-white hover:shadow-md transition-all">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                          {getHighlightIcon(h)}
                        </div>
                        <span className="text-primary font-bold">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-[2rem] shadow-2xl border border-border p-8 overflow-hidden">
                {isComingSoon ? (
                  <div className="space-y-6 relative">
                    <div className="flex flex-col gap-4">
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
                        <Bell className="w-6 h-6 text-amber-600 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-amber-900 font-headline">Coming Soon!</span>
                          <span className="text-[11px] text-amber-800 leading-tight">Click the button below to be notified when this event goes live</span>
                        </div>
                      </div>
                      <h3 className="text-3xl font-headline font-bold text-primary leading-tight px-1">Launching Shortly</h3>
                    </div>

                    <div className="p-6 bg-amber-50/30 rounded-2xl border border-amber-100/50 space-y-4">
                      <form onSubmit={handleNotifyMe} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Email Registration</label>
                          <Input 
                            type="email" 
                            placeholder="your@email.com" 
                            className="rounded-xl h-12 border-amber-200 focus-visible:ring-amber-500"
                            value={notifyEmail}
                            onChange={(e) => setNotifyEmail(e.target.value)}
                            required
                          />
                        </div>
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 rounded-full h-12 gap-2 text-white font-bold shadow-lg shadow-amber-500/20">
                          <Send className="w-4 h-4" /> Notify Me
                        </Button>
                      </form>
                      <p className="text-[10px] text-center text-amber-700/80 font-medium">
                        Secure your spot in the notification queue.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-8 flex justify-between items-end">
                      <div>
                        <div className="text-4xl font-headline font-bold text-primary flex items-baseline gap-1">
                          ₹{tour.price}
                          <span className="text-sm font-normal text-muted-foreground">/ guest</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="rounded-full px-3 py-1 border-accent/20 text-accent font-bold">
                          Min: {tour.minGroupSize}
                        </Badge>
                      </div>
                    </div>

                    <Tabs defaultValue="individual" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-full h-12">
                        <TabsTrigger value="individual" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-[10px] font-bold tracking-tight uppercase">Individual</TabsTrigger>
                        <TabsTrigger value="school" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-[10px] font-bold tracking-tight uppercase">School</TabsTrigger>
                        <TabsTrigger value="corporate" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-[10px] font-bold tracking-tight uppercase">Corporate</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="individual" className="mt-0">
                        <div className="space-y-6">
                          <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-accent" />
                            <div>
                              <div className="text-[10px] font-bold text-accent uppercase tracking-wider">Upcoming Date</div>
                              <div className="text-sm font-bold text-primary">{tour.scheduledDates?.[0] || 'TBA'}</div>
                            </div>
                          </div>
                          <IndividualBookingForm tour={tour} />
                        </div>
                      </TabsContent>

                      <TabsContent value="school" className="mt-0">
                        <SchoolBookingForm tour={tour} />
                      </TabsContent>

                      <TabsContent value="corporate" className="mt-0">
                        <CorporateBookingForm tour={tour} />
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
