"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AvailabilityBadge from "@/components/booking/AvailabilityBadge";
import Link from "next/link";
import { Clock, MapPin, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Tour } from "@/lib/types";

export default function Home() {
  const firestore = useFirestore();
  
  const toursQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "tours"), where("isActive", "==", true));
  }, [firestore]);

  const { data: tours, isLoading } = useCollection<Tour>(toursQuery);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <Image
          src="https://picsum.photos/seed/maroma-hero/1920/1080"
          alt="Maroma Experiences Hero"
          fill
          className="object-cover brightness-[0.6] transition-transform duration-10000 hover:scale-110"
          priority
          data-ai-hint="beautiful landscape"
        />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-white mb-6 drop-shadow-lg leading-tight">
            Curated Experiences for the Curious
          </h1>
          <p className="text-xl text-white/90 mb-10 font-body max-w-2xl mx-auto drop-shadow-md">
            From Campus Tours to Artisan-led workshops, discover the heart of Maroma through our bespoke group tours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent text-white hover:bg-accent/90 rounded-full px-10 text-lg h-14 font-bold shadow-lg">
              Explore Tours
            </Button>
            <Button size="lg" variant="outline" className="bg-sky-200 text-primary border-none hover:bg-sky-300 rounded-full px-10 text-lg h-14 font-bold shadow-lg">
              Our Story
            </Button>
          </div>
        </div>
      </section>

      {/* Tours Grid */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">Upcoming Experiences</h2>
            <p className="text-muted-foreground mt-2 font-body">Choose your next adventure from our seasonally curated list.</p>
          </div>
          <Link href="#" className="hidden sm:flex items-center gap-2 text-accent font-semibold hover:underline group">
            View All Tours & Workshops <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours?.map((tour) => (
              <Link href={`/tours/${tour.id}`} key={tour.id}>
                <Card className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-2xl bg-white h-full flex flex-col">
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={tour.imageUrl}
                      alt={tour.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <AvailabilityBadge booked={tour.bookedSpaces} capacity={tour.capacity} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                      <span className="text-white text-xs font-bold uppercase tracking-widest">{tour.type}</span>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-grow">
                    <h3 className="text-2xl font-headline font-bold text-primary group-hover:text-accent transition-colors mb-2">
                      {tour.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-accent" /> {tour.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-accent" /> {tour.duration}</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                      {tour.description}
                    </p>
                  </CardContent>
                  <CardFooter className="px-6 py-4 border-t border-border flex items-center justify-between bg-gray-50/50">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">From</span>
                      <span className="text-xl font-bold text-primary font-headline">₹{tour.price} <span className="text-xs font-normal">/ guest</span></span>
                    </div>
                    <Button variant="ghost" className="rounded-full group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="w-5 h-5 text-accent" />
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
