"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AvailabilityBadge from "@/components/booking/AvailabilityBadge";
import Link from "next/link";
import { Clock, MapPin, ArrowRight, Loader2, Sparkles, Bell } from "lucide-react";
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
              className="bg-primary text-white hover:bg-primary/90 rounded-full px-12 text-lg h-14 font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              Book Now
            </Button>
          </div>
        </div>
      </section>

      {/* Tours Grid */}
      <main id="workshops" className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">Upcoming Experiences</h2>
            <p className="text-muted-foreground mt-2 font-body">Choose your next adventure from our seasonally curated list.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours?.map((tour) => (
              <Link href={`/tours/${tour.id}`} key={tour.id}>
                <Card className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-2xl bg-white h-full flex flex-col relative">
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={tour.imageUrl}
                      alt={tour.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                      <span className="text-white text-xs font-bold uppercase tracking-widest">{tour.type}</span>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-grow flex flex-col">
                    <h3 className="text-2xl font-headline font-bold text-primary group-hover:text-accent transition-colors mb-2">
                      {tour.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-accent" /> {tour.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-accent" /> {tour.duration}</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed mb-6">
                      {tour.description}
                    </p>
                    
                    {/* Vertically aligned badges at the bottom of the content area */}
                    <div className="mt-auto pt-4 flex flex-col items-start gap-2">
                      {tour.status === 'coming-soon' ? (
                        <Badge className="bg-amber-500 text-white hover:bg-amber-600 border-none shadow-lg rounded-full px-4 py-1.5 gap-2 backdrop-blur-sm">
                          <Sparkles className="w-3.5 h-3.5 fill-current" /> Coming Soon
                        </Badge>
                      ) : (
                        <Badge className="bg-green-600/90 text-white hover:bg-green-600 border-none shadow-lg rounded-full px-4 py-1.5 gap-2 backdrop-blur-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                        </Badge>
                      )}
                      {tour.status !== 'coming-soon' && (
                        <AvailabilityBadge booked={tour.bookedSpaces} capacity={tour.capacity} />
                      )}
                      
                      {tour.status === 'coming-soon' && (
                        <div className="w-full mt-2 p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center gap-3">
                          <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[11px] text-amber-800 leading-tight">Be notified when this event goes live.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="px-6 py-4 border-t border-border flex items-center justify-between bg-gray-50/50">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-primary font-headline">₹{tour.price} <span className="text-xs font-normal">/ Person</span></span>
                    </div>
                    <Button 
                      className={cn(
                        "text-white rounded-full px-6 font-bold h-10 shadow-md transition-colors",
                        tour.status === 'coming-soon' 
                          ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" 
                          : "bg-accent hover:bg-accent/90"
                      )}
                    >
                      {tour.status === 'coming-soon' ? 'Notify Me' : 'Book Now'}
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
            {(!tours || tours.length === 0) && (
              <div className="col-span-full text-center py-20 bg-muted/20 rounded-3xl border border-dashed">
                <p className="text-muted-foreground">No experiences found. Check back later!</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
