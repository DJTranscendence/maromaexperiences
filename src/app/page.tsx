"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AvailabilityBadge from "@/components/booking/AvailabilityBadge";
import Link from "next/link";
import { Clock, MapPin, ArrowRight, Loader2, Sparkles, Bell, PlayCircle } from "lucide-react";
import Image from "next/image";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Tour } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Home() {
  const firestore = useFirestore();
  
  const toursQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "tours"), where("isActive", "==", true));
  }, [firestore]);

  const { data: tours, isLoading } = useCollection<Tour>(toursQuery);

  const HERO_IMAGE_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Clay%20Perfume%20Hero.png?alt=media&token=29a10f37-f9c6-4ec5-98b0-6cf2ce53d8e2";
  const GAME_TITLE_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Product%20Game%20Title%202.png?alt=media&token=f7698e9d-9e74-45e2-a0c1-916f1b9904db";

  const scrollToWorkshops = () => {
    const element = document.getElementById('workshops');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <Image
          src={HERO_IMAGE_URL}
          alt="Maroma Experiences Hero"
          fill
          className="object-cover brightness-[0.6] transition-transform duration-10000 hover:scale-110"
          priority
        />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-white mb-6 drop-shadow-lg leading-tight">
            Curated experiences for curious travellers.
          </h1>
          <p className="text-xl text-white/90 mb-10 font-body max-w-2xl mx-auto drop-shadow-md">
            From Campus-wide tours to artisan-led workshops, Maroma Experiences promises you an eye-opening and enriching enounter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={scrollToWorkshops}
              className="bg-primary text-white hover:bg-primary/90 rounded-full px-16 text-xl h-16 font-bold shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              Book Now
            </Button>
          </div>
        </div>
      </section>

      {/* Tours Grid */}
      <main id="workshops" className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-primary">Upcoming Experiences</h2>
            <p className="text-muted-foreground mt-3 text-lg font-body">Choose your next adventure from our seasonally curated list.</p>
          </div>
          <div className="h-1.5 w-24 bg-accent rounded-full hidden md:block" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-12 h-12 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {tours?.map((tour) => (
              <Link href={`/tours/${tour.id}`} key={tour.id}>
                <Card className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-white h-full flex flex-col relative border border-border/50">
                  <div className="relative h-72 overflow-hidden">
                    <Image
                      src={tour.imageUrl}
                      alt={tour.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-6 left-6">
                      <span className="text-white text-[10px] font-bold uppercase tracking-[0.2em] bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        {tour.type}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-8 flex-grow flex flex-col">
                    <h3 className="text-3xl font-headline font-bold text-primary group-hover:text-accent transition-colors mb-3 leading-tight">
                      {tour.name}
                    </h3>
                    <div className="flex items-center gap-5 text-sm text-muted-foreground mb-6">
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-accent" /> {tour.location}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" /> {tour.duration}</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-3 text-base leading-relaxed mb-8 font-body">
                      {tour.description}
                    </p>
                    
                    <div className={cn(
                      "mt-auto pt-4 flex flex-col gap-3",
                      tour.status === 'coming-soon' ? "items-center" : "items-start"
                    )}>
                      {tour.status === 'coming-soon' ? (
                        <Badge className="bg-[#FF8C00] text-white hover:bg-[#FF8C00]/90 border-none shadow-lg rounded-full px-5 py-2 gap-2 backdrop-blur-sm font-bold uppercase tracking-widest text-[10px]">
                          <Sparkles className="w-3.5 h-3.5 fill-current" /> Coming Soon
                        </Badge>
                      ) : (
                        <Badge className="bg-green-600/90 text-white hover:bg-green-600 border-none shadow-lg rounded-full px-5 py-2 gap-2 backdrop-blur-sm font-bold uppercase tracking-widest text-[10px]">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                        </Badge>
                      )}
                      {tour.status !== 'coming-soon' && (
                        <AvailabilityBadge booked={tour.bookedSpaces} capacity={tour.capacity} className="px-4 py-1.5" />
                      )}
                      
                      {tour.status === 'coming-soon' && (
                        <div className="w-full mt-2 p-4 bg-[#FF8C00]/5 rounded-2xl border border-[#FF8C00]/20 flex items-center gap-4">
                          <Bell className="w-5 h-5 text-[#FF8C00] shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-xs text-[#FF8C00] leading-snug font-medium">Be notified when this event goes live on campus.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className={cn(
                    "px-8 py-6 border-t border-border/50 flex bg-gray-50/30",
                    tour.status === 'coming-soon' ? "flex-col items-center gap-4 text-center" : "items-center justify-between"
                  )}>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-0.5">Rate</span>
                      <span className="text-2xl font-bold text-primary font-headline">₹{tour.price} <span className="text-sm font-normal text-muted-foreground">/ Person</span></span>
                    </div>
                    <Button 
                      className={cn(
                        "text-white rounded-full px-12 font-bold h-12 shadow-xl transition-all hover:scale-105 active:scale-95",
                        tour.status === 'coming-soon' 
                          ? "bg-[#FF8C00] hover:bg-[#FF8C00]/90 shadow-[#FF8C00]/20" 
                          : "bg-accent hover:bg-accent/90 shadow-accent/20"
                      )}
                    >
                      {tour.status === 'coming-soon' ? 'Notify Me' : 'Book Now'}
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
            {(!tours || tours.length === 0) && (
              <div className="col-span-full text-center py-24 bg-muted/20 rounded-[3rem] border border-dashed border-border flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground opacity-20" />
                </div>
                <p className="text-muted-foreground text-lg font-body italic">No seasonal experiences found. Check back later!</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Simulator Portal Banner */}
      <section className="bg-slate-900 py-16 md:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-[3rem] border border-white/10 py-10 px-8 md:p-16 flex flex-col md:flex-row items-center gap-6 md:gap-12 overflow-hidden relative group shadow-2xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative w-56 h-56 md:w-80 md:h-80 shrink-0 flex items-center justify-center">
              <Image 
                src={GAME_TITLE_URL}
                alt="The Maroma Product Game"
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            <div className="flex-grow text-center md:text-left space-y-8 relative z-10">
              <div className="space-y-4">
                <Badge className="bg-accent text-white px-6 py-1.5 rounded-full uppercase tracking-[0.3em] text-[10px] font-bold border-none shadow-lg">
                  Workshop Session Active
                </Badge>
                <h2 className="text-4xl md:text-6xl font-headline font-bold text-white leading-tight">
                  Join the game here
                </h2>
                <p className="text-slate-300 text-xl max-w-xl font-body leading-relaxed">
                  Name your team, create your product and see how it performs!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-full px-12 h-16 text-xl font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-3">
                  <Link href="/simulator">
                    <PlayCircle className="w-6 h-6" /> Join Game
                  </Link>
                </Button>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-bold uppercase tracking-widest mt-2 sm:mt-0 sm:ml-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Workshop Connection
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
