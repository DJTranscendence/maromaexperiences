
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
import { MapPin, Clock, Users, Share2, Heart, Calendar, Loader2, Sparkles, Bell, Send, Check } from "lucide-react";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Tour } from "@/lib/types";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
                <div className="text-lg text-muted-foreground leading-relaxed font-body whitespace-pre-wrap">
                  {tour.description}
                </div>
              </div>

              {tour.highlights && tour.highlights.length > 0 && (
                <div>
                  <h3 className="text-xl font-headline font-bold text-primary mb-6">Experience Highlights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {tour.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/20 border border-border/50 group hover:bg-white hover:shadow-md transition-all">
                        <div className="mt-1 w-2 h-2 rounded-full bg-accent group-hover:scale-125 transition-transform flex-shrink-0" />
                        <span className="text-muted-foreground font-medium">{h}</span>
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
                      <Badge className="w-fit bg-amber-50 text-amber-700 border-amber-200 rounded-full px-4 py-1.5 flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
                        <Bell className="w-3.5 h-3.5" /> Coming Soon
                      </Badge>
                      <h3 className="text-3xl font-headline font-bold text-primary leading-tight">Launching Shortly</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        This exclusive experience is currently in final preparation. Click here to be notified when this event goes live.
                      </p>
                    </div>

                    <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100/50 space-y-4">
                      <form onSubmit={handleNotifyMe} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Registration</label>
                          <Input 
                            type="email" 
                            placeholder="your@email.com" 
                            className="rounded-xl h-12 border-amber-200 focus-visible:ring-amber-500"
                            value={notifyEmail}
                            onChange={(e) => setNotifyEmail(e.target.value)}
                            required
                          />
                        </div>
                        <Button className="w-full bg-primary hover:bg-primary/90 rounded-full h-12 gap-2 text-white font-bold shadow-lg shadow-primary/20">
                          <Send className="w-4 h-4" /> Notify Me
                        </Button>
                      </form>
                      <p className="text-[10px] text-center text-amber-600/80 font-medium">
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
