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
import { MapPin, Clock, Users, Share2, Heart, Calendar, Loader2 } from "lucide-react";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Tour } from "@/lib/types";
import { useParams } from "next/navigation";

export default function TourDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  const tourRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, "tours", id);
  }, [firestore, id]);

  const { data: tour, isLoading } = useDoc<Tour>(tourRef);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-headline font-bold">Tour not found</h1>
        <Loader2 className="w-8 h-8 mt-4 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Tours</span>
            <span>/</span>
            <span className="text-primary font-medium">{tour.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 hover:text-accent transition-colors"><Share2 className="w-4 h-4" /> Share</button>
            <button className="flex items-center gap-1 hover:text-accent transition-colors"><Heart className="w-4 h-4" /> Save</button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="relative h-[50vh] rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src={tour.imageUrl}
              alt={tour.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute top-6 left-6 flex gap-2">
              <Badge className="bg-white/90 text-primary hover:bg-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs border-none shadow-lg capitalize">
                {tour.type}
              </Badge>
              <AvailabilityBadge booked={tour.bookedSpaces} capacity={tour.capacity} className="bg-white/90 backdrop-blur-md shadow-lg" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">{tour.name}</h1>
                <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-accent" /> {tour.location}</div>
                  <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-accent" /> {tour.duration}</div>
                  <div className="flex items-center gap-2"><Users className="w-5 h-5 text-accent" /> Up to {tour.capacity} guests</div>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-2xl font-headline font-bold text-primary mb-4">About this experience</h2>
                <p className="text-lg text-muted-foreground leading-relaxed font-body">
                  {tour.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-headline font-bold text-primary mb-4">Highlights</h3>
                  <ul className="space-y-3">
                    {tour.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-3xl shadow-xl border border-border p-8">
                <div className="mb-6 flex justify-between items-end">
                  <div>
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Starting from</span>
                    <div className="text-4xl font-headline font-bold text-primary">${tour.price}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Min group: {tour.minGroupSize}</span>
                  </div>
                </div>

                <Tabs defaultValue="individual" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-full h-12">
                    <TabsTrigger value="individual" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-xs font-bold tracking-tighter uppercase">Individual</TabsTrigger>
                    <TabsTrigger value="school" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-xs font-bold tracking-tighter uppercase">School</TabsTrigger>
                    <TabsTrigger value="corporate" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-xs font-bold tracking-tighter uppercase">Corporate</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="individual">
                    <div className="space-y-6">
                      <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl mb-4">
                        <p className="text-sm text-primary font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-accent" /> Next Date: {tour.scheduledDates?.[0] || 'TBA'}
                        </p>
                      </div>
                      <IndividualBookingForm tour={tour} />
                    </div>
                  </TabsContent>

                  <TabsContent value="school">
                    <SchoolBookingForm tour={tour} />
                  </TabsContent>

                  <TabsContent value="corporate">
                    <CorporateBookingForm tour={tour} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
