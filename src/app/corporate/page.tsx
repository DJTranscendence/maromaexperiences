"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Building2, 
  Users2, 
  Target, 
  Utensils, 
  Hotel, 
  Camera, 
  Sparkles, 
  Coffee,
  CheckCircle2,
  Presentation,
  ShieldCheck,
  Quote,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Sprout,
  Heart,
  ChevronRight,
  ChevronDown,
  Info,
  ExternalLink,
  Phone,
  User,
  Mail
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, useDoc } from "@/firebase";
import { collection, query, where, serverTimestamp, doc } from "firebase/firestore";
import { Tour } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sendEmailNotification } from "@/app/actions/notifications";

const CORPORATE_HERO_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Newsletter%20Splash%20image.png?alt=media&token=1b459fe6-4123-40c5-a4bd-1b58c0f4915f";

const HOTEL_PACKAGES = [
  { id: 'h1', name: "Maroma Resort & Spa", price: "₹250/night", desc: "Ultra-luxury beachfront suites." },
  { id: 'h2', name: "Secrets Maroma Beach", price: "₹180/night", desc: "All-inclusive adults-only excellence." },
  { id: 'h3', name: "Catalonia Playa Maroma", price: "₹120/night", desc: "Authentic Mexican charm and comfort." },
];

const CATERING_OPTIONS = [
  { id: 'cat1', name: 'Naturellement Garden Cafe', price: 'Included', desc: 'Classy European dining in a lush garden setting.' },
  { id: 'cat2', name: 'Solitude Farm-to-Table', price: '+₹25/pp', desc: 'Rustic, home-grown and very healthy ingredients.' },
  { id: 'cat3', name: 'Cafe 73', price: '+₹15/pp', desc: 'Hearty burgers, wraps, and chips in a biker-styled cafe.' },
  { id: 'cat4', name: 'Maroma Spa Cafe', price: '+₹40/pp', desc: 'Vegan, healthy, rooftop dining with panoramic views.' },
];

const SPA_TREATMENTS = [
  { id: 'spa1', name: "Deep Tissue Massage", price: "₹3,000", duration: "60 Mins", desc: "Intensive targeted massage for deep muscle release.", image: "https://picsum.photos/seed/spa1/400/300" },
  { id: 'spa2', name: "Maroma Holistic Facial", price: "₹3,000", duration: "60 Mins", desc: "Nature-based products to cleanse and nourish the skin.", image: "https://picsum.photos/seed/spa2/400/300" },
  { id: 'spa3', name: "Maroma Sound Harmonisation", price: "From ₹1,800", duration: "50+ Mins", desc: "Vibrations from singing bowls and tuning forks for deep stillness.", image: "https://picsum.photos/seed/spa3/400/300" },
  { id: 'spa4', name: "Foot Reflexology", price: "₹2,700", duration: "60 Mins", desc: "Therapeutic treatment working specific reflex points.", image: "https://picsum.photos/seed/spa4/400/300" },
  { id: 'spa5', name: "Thai Yoga Massage", price: "From ₹3,000", duration: "60+ Mins", desc: "Full-body therapy to restore balance and improve mobility.", image: "https://picsum.photos/seed/spa5/400/300" },
  { id: 'spa6', name: "Lomi Lomi Massage", price: "₹4,200", duration: "90 Mins", desc: "Nurturing massage rooted in Hawaiian tradition.", image: "https://picsum.photos/seed/spa6/400/300" },
];

const PACKAGES = [
  {
    id: 'day',
    name: "Essential Connection",
    tier: "Day Retreat",
    description: "A focused single-day experience designed to break the routine and spark new ideas.",
    features: ["Private Meeting Space", "Signature Workshop Choice", "Artisan Lunch & Coffee", "Facilitated Q&A"],
    price: "₹8,000 / Person",
    icon: Users2,
    image: "https://picsum.photos/seed/corp-day/600/400"
  },
  {
    id: 'multi',
    name: "Premium Synergy",
    tier: "Multi-Day Journey",
    description: "Our most popular choice, balancing intensive strategy with immersive craft workshops.",
    features: ["2 Days / 1 Night", "Premium Catering Package", "Two Signature Workshops", "Outdoor Team Challenges", "Evening Social Event"],
    price: "₹12,000 / Person",
    icon: Target,
    popular: true,
    image: "https://picsum.photos/seed/corp-multi/600/400"
  },
  {
    id: 'bespoke',
    name: "Executive Summit",
    tier: "Bespoke Luxury",
    description: "A high-level retreat focused on deep strategy, leadership, and absolute privacy.",
    features: ["3 Days / 2 Nights", "Private Chef Experience", "Exclusive Venue Access", "Leadership Coaching Integration", "Full Concierge Support"],
    price: "On Request",
    icon: ShieldCheck,
    image: "https://picsum.photos/seed/corp-exec/600/400"
  }
];

export default function CorporatePage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedCatering, setSelectedCatering] = useState<string>('cat1');
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [contactForm, setContactForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: ""
  });

  const isInitialized = useRef(false);
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userDocRef);

  useEffect(() => {
    if (userData && !isInitialized.current) {
      setContactForm({
        companyName: userData.companyName || "",
        contactName: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
        email: userData.email || "",
        phone: userData.phoneNumber || ""
      });
      isInitialized.current = true;
    }
  }, [userData]);

  // Fetch real media from Firestore
  const mediaQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "media");
  }, [firestore]);
  const { data: mediaItems, isLoading: isMediaLoading } = useCollection<any>(mediaQuery);

  const toursQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Ensure we only fetch active tours
    return query(collection(firestore, "tours"), where("isActive", "==", true));
  }, [firestore]);
  const { data: availableTours, isLoading: isToursLoading } = useCollection<Tour>(toursQuery);

  const heroImage = CORPORATE_HERO_URL;

  const packageImages = useMemo(() => {
    return {
      day: mediaItems?.[0]?.url || PACKAGES[0].image,
      multi: mediaItems?.[8]?.url || PACKAGES[1].image,
      bespoke: mediaItems?.[3]?.url || PACKAGES[2].image,
    };
  }, [mediaItems]);

  const handleOpenBuilder = (pkg: any) => {
    setSelectedPkg(pkg);
    setIsBuilderOpen(true);
  };

  const addItemToItinerary = (item: any) => {
    if (itinerary.find(t => t.id === item.id)) return;
    setItinerary([...itinerary, item]);
  };

  const removeItemFromItinerary = (id: string) => {
    setItinerary(itinerary.filter(t => t.id !== id));
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleRequestProposal = async () => {
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please sign in to request a proposal." });
      return;
    }

    if (!contactForm.companyName || !contactForm.email || !contactForm.contactName) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please complete the contact form in the sidebar." });
      return;
    }

    setIsSubmitting(true);
    
    try {
      addDocumentNonBlocking(collection(firestore, "proposals"), {
        userId: user.uid,
        ...contactForm,
        packageName: selectedPkg?.name || "Custom Itinerary",
        itinerary: itinerary.map(item => ({ id: item.id, name: item.name, type: item.type })),
        catering: CATERING_OPTIONS.find(c => c.id === selectedCatering)?.name || "Standard",
        addons: selectedAddons,
        hotel: HOTEL_PACKAGES.find(h => h.id === selectedHotel)?.name || "Not selected",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send Customer Notification
      await sendEmailNotification({
        to: contactForm.email,
        subject: `Corporate Proposal Request Received: ${selectedPkg?.name || "Maroma Experience"}`,
        textBody: `Hello ${contactForm.contactName},\n\nThank you for reaching out to Maroma Experiences. We have received your corporate retreat proposal request for "${contactForm.companyName}".\n\nOur design team is reviewing your custom itinerary and will be in touch within 24 hours with a detailed proposal and quote.\n\nWarm regards,\nThe Maroma Team\nhttps://maromaexperience.com`
      });

      toast({
        title: "Proposal Requested!",
        description: "Our admin team is reviewing your itinerary. A confirmation receipt has been sent to your email.",
      });

      setIsBuilderOpen(false);
      setItinerary([]);
      setSelectedAddons([]);
      setSelectedCatering('cat1');
      setSelectedHotel(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Submission Failed", description: "Could not send proposal request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
          <Image
            src={heroImage}
            alt="Corporate Retreat"
            fill
            className="object-cover brightness-[0.5]"
            priority
          />
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <Badge className="mb-6 bg-accent text-white border-none px-6 py-2 rounded-full uppercase tracking-[0.3em] font-bold text-xs">
              Corporate Excellence
            </Badge>
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-white mb-8 drop-shadow-2xl leading-tight">
              Elevate Your Team's Connection.
            </h1>
            <p className="text-xl text-white/90 mb-12 font-body max-w-2xl mx-auto drop-shadow-md leading-relaxed">
              Maroma provides the perfect canvas for corporate groups to reconnect, strategize, and grow through curated artisan workshops and high-end logistics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => setIsBuilderOpen(true)} className="bg-primary text-white hover:bg-primary/90 rounded-full px-12 h-14 font-bold shadow-2xl transition-all hover:scale-105">
                Build Your Custom Itinerary
              </Button>
            </div>
          </div>
        </section>

        {/* Advantage Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">Why Maroma for Business?</h2>
              <div className="h-1.5 w-24 bg-accent mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { title: "Inspired Surroundings", desc: "Our campus offers a unique blend of nature and modern facilities that break down traditional silos.", icon: Sparkles },
                { title: "Artisan Workshops", desc: "Engage in hands-on pottery, perfumery, or textiles to foster creativity and collaborative problem solving.", icon: Building2 },
                { title: "Tailored Logistics", desc: "From gourmet catering to luxury transportation, we handle every detail so you can focus on your team.", icon: Presentation }
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="w-20 h-20 bg-muted/30 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/10 transition-colors duration-500">
                    <item.icon className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-headline font-bold text-primary mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-body">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Signature Packages */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">Signature Packages</h2>
              <p className="text-muted-foreground font-body">Choose a foundation and customise it to your specific goals.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {PACKAGES.map((pkg, i) => (
                <button key={i} onClick={() => handleOpenBuilder(pkg)} className="flex text-left w-full outline-none focus:ring-0 group h-full">
                  <Card className={cn(
                    "rounded-[2.5rem] border-none shadow-xl relative overflow-hidden flex flex-col w-full h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group/card",
                    pkg.popular ? "ring-2 ring-accent z-10" : ""
                  )}>
                    {pkg.popular && (
                      <div className="absolute top-0 right-0 z-20">
                        <div className="bg-accent text-white text-[10px] font-bold px-8 py-1.5 rotate-45 translate-x-10 translate-y-4 uppercase tracking-widest shadow-md">
                          Most Popular
                        </div>
                      </div>
                    )}
                    <div className="relative h-48 w-full">
                      <Image
                        src={packageImages[pkg.id as keyof typeof packageImages] || pkg.image}
                        alt={pkg.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
                    </div>
                    <CardHeader className="p-8 pb-4 relative z-10 -mt-12">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover/card:bg-accent/10 transition-colors">
                        <pkg.icon className="w-6 h-6 text-primary group-hover/card:text-accent transition-colors" />
                      </div>
                      <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-2">{pkg.tier}</div>
                      <CardTitle className="text-2xl font-headline font-bold text-primary">{pkg.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 flex-grow flex flex-col">
                      <p className="text-sm text-muted-foreground mb-8 font-body leading-relaxed">{pkg.description}</p>
                      <div className="space-y-4 mb-8">
                        {pkg.features.map((feat, fi) => (
                          <div key={fi} className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                            <span className="text-sm font-medium text-primary/80">{feat}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-auto pt-6 border-t border-border flex items-baseline justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Base Rate</span>
                          <span className="text-2xl font-headline font-bold text-primary whitespace-nowrap">{pkg.price}</span>
                        </div>
                        <div className="bg-primary text-white p-2 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity translate-y-1">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Builder Dialog */}
        <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden border-none rounded-3xl lg:rounded-[3rem]">
            <div className="flex flex-col h-full bg-white min-h-0">
              <div className="p-4 lg:p-8 border-b bg-muted/10 flex flex-col lg:flex-row lg:items-center justify-between shrink-0 gap-4">
                <div>
                  <DialogTitle className="text-2xl lg:text-3xl font-headline font-bold text-primary">
                    Customise Your Experience
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground mt-1 text-sm lg:text-base">
                    Select your preferred workshops, wellness treatments, and dining.
                  </DialogDescription>
                </div>
                {selectedPkg && (
                  <Badge className="bg-accent text-white px-4 lg:px-6 py-2 rounded-full uppercase tracking-widest text-[10px] lg:text-xs font-bold w-fit">
                    {selectedPkg.name}
                  </Badge>
                )}
              </div>

              <div className="flex-grow flex flex-col lg:flex-row min-h-0 overflow-hidden">
                {/* Selection Menu - Using flex-1 to share space correctly on mobile */}
                <div className="flex-1 lg:flex-[2] flex flex-col min-h-0 overflow-hidden order-1">
                  <ScrollArea className="flex-grow">
                    <div className="p-4 lg:p-8 space-y-8 lg:space-y-12 pb-20">
                      {/* Workshops Selection */}
                      <section>
                        <h3 className="text-lg lg:text-xl font-headline font-bold text-primary mb-4 lg:mb-6 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-accent" /> Select Workshops & Tours
                        </h3>
                        {isToursLoading ? (
                          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent" /></div>
                        ) : availableTours && availableTours.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableTours.map(tour => (
                              <button 
                                key={tour.id} 
                                onClick={() => addItemToItinerary({ id: tour.id, name: tour.name, imageUrl: tour.imageUrl, duration: tour.duration, type: 'Experience' })}
                                disabled={!!itinerary.find(t => t.id === tour.id)}
                                className={cn(
                                  "flex text-left items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl border transition-all group",
                                  itinerary.find(t => t.id === tour.id) 
                                    ? "bg-muted/50 border-transparent cursor-not-allowed opacity-60" 
                                    : "bg-white border-border hover:border-accent hover:shadow-md"
                                )}
                              >
                                <div className="relative w-16 lg:w-20 h-16 lg:h-20 rounded-xl overflow-hidden shrink-0">
                                  <Image src={tour.imageUrl} alt={tour.name} fill className="object-cover" />
                                </div>
                                <div className="flex-grow min-w-0">
                                  <h4 className="font-bold text-primary text-sm lg:text-base leading-tight truncate">{tour.name}</h4>
                                  <div className="flex items-center gap-2 lg:gap-3 text-[9px] lg:text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {tour.duration}</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {tour.location}</span>
                                  </div>
                                </div>
                                {itinerary.find(t => t.id === tour.id) ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Plus className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-10 border-2 border-dashed rounded-3xl text-center bg-muted/5">
                            <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">No experiences currently published.</p>
                            <Button asChild variant="link" size="sm" className="text-accent mt-1">
                              <Link href="/admin">Add Live Experiences</Link>
                            </Button>
                          </div>
                        )}
                      </section>

                      {/* Spa Treatments Selection */}
                      <section>
                        <h3 className="text-lg lg:text-xl font-headline font-bold text-primary mb-4 lg:mb-6 flex items-center gap-2">
                          <Sprout className="w-5 h-5 text-accent" /> Spa & Wellness Treatments
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {SPA_TREATMENTS.map(spa => (
                            <button 
                              key={spa.id} 
                              onClick={() => addItemToItinerary({ id: spa.id, name: spa.name, imageUrl: spa.image, duration: spa.duration, type: 'Wellness' })}
                              disabled={!!itinerary.find(t => t.id === spa.id)}
                              className={cn(
                                "flex text-left items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl border transition-all group",
                                itinerary.find(t => t.id === spa.id) 
                                  ? "bg-muted/50 border-transparent cursor-not-allowed opacity-60" 
                                  : "bg-white border-border hover:border-accent hover:shadow-md"
                              )}
                            >
                              <div className="relative w-14 lg:w-16 h-14 lg:h-16 rounded-xl overflow-hidden shrink-0">
                                <Image src={spa.image} alt={spa.name} fill className="object-cover" />
                              </div>
                              <div className="flex-grow min-w-0">
                                <h4 className="font-bold text-primary text-xs lg:text-sm leading-tight truncate">{spa.name}</h4>
                                <div className="flex items-center gap-2 lg:gap-3 text-[8px] lg:text-[9px] text-muted-foreground uppercase tracking-widest mt-1">
                                  <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {spa.duration}</span>
                                  <span className="font-bold text-accent">{spa.price}</span>
                                </div>
                              </div>
                              {itinerary.find(t => t.id === spa.id) ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Plus className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* Catering & Addons */}
                      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        <div>
                          <h3 className="text-lg lg:text-xl font-headline font-bold text-primary mb-4 lg:mb-6 flex items-center gap-2">
                            <Utensils className="w-5 h-5 text-accent" /> Catering Menus
                          </h3>
                          <div className="space-y-4">
                            {CATERING_OPTIONS.map(opt => (
                              <div 
                                key={opt.id} 
                                className={cn(
                                  "flex items-center gap-4 lg:gap-5 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border transition-all cursor-pointer bg-white group",
                                  selectedCatering === opt.id ? "border-accent shadow-md ring-1 ring-accent/20" : "border-border hover:border-accent/30 hover:shadow-sm"
                                )}
                                onClick={() => setSelectedCatering(opt.id)}
                              >
                                <div className="relative flex items-center justify-center w-7 lg:w-8 h-7 lg:h-8 shrink-0">
                                  <div className={cn(
                                    "w-6 lg:w-7 h-6 lg:h-7 rounded-full border-2 flex items-center justify-center transition-all",
                                    selectedCatering === opt.id ? "border-accent bg-accent" : "border-muted-foreground/30 bg-transparent"
                                  )}>
                                    {selectedCatering === opt.id && <div className="w-2 lg:w-2.5 h-2 lg:h-2.5 rounded-full bg-white shadow-sm" />}
                                  </div>
                                </div>
                                <div className="flex-grow">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-primary text-sm lg:text-base font-headline">{opt.name}</h4>
                                    <span className="text-[9px] lg:text-[10px] font-bold text-accent uppercase tracking-widest">{opt.price}</span>
                                  </div>
                                  <p className="text-[10px] lg:text-xs text-muted-foreground mt-1 leading-relaxed font-body">{opt.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg lg:text-xl font-headline font-bold text-primary mb-4 lg:mb-6 flex items-center gap-2">
                            <Camera className="w-5 h-5 text-accent" /> Professional Services
                          </h3>
                          <div className="space-y-3">
                            {[
                              { id: 'srv1', name: 'Event Photography', price: '₹250', icon: Camera },
                              { id: 'srv2', name: 'Team Strategy Facilitator', price: '₹400', icon: Users2 },
                              { id: 'srv3', name: 'Premium Coffee Bar', price: '₹15/pp', icon: Coffee },
                            ].map(opt => (
                              <div key={opt.id} className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl border border-border bg-white hover:border-accent/30 transition-all cursor-pointer group" onClick={() => toggleAddon(opt.id)}>
                                <div className="relative flex items-center justify-center w-5 lg:w-6 h-5 lg:h-6 shrink-0">
                                  <Checkbox 
                                    checked={selectedAddons.includes(opt.id)} 
                                    onCheckedChange={() => toggleAddon(opt.id)} 
                                    onClick={(e) => e.stopPropagation()}
                                    className="rounded-full w-5 lg:w-6 h-5 lg:h-6" 
                                  />
                                </div>
                                <opt.icon className="w-4 h-4 text-accent shrink-0" />
                                <div className="flex-grow">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-primary text-xs lg:text-sm">{opt.name}</h4>
                                    <span className="text-[9px] lg:text-[10px] font-bold text-accent uppercase tracking-widest">{opt.price}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>

                      {/* Accommodation Selection */}
                      <section>
                        <h3 className="text-lg lg:text-xl font-headline font-bold text-primary mb-4 lg:mb-6 flex items-center gap-2">
                          <Hotel className="w-5 h-5 text-accent" /> Luxury Accommodation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {HOTEL_PACKAGES.map(hotel => (
                            <div 
                              key={hotel.id} 
                              onClick={() => setSelectedHotel(hotel.id)}
                              className={cn(
                                "p-4 lg:p-5 rounded-2xl border transition-all cursor-pointer bg-white relative",
                                selectedHotel === hotel.id ? "border-accent shadow-lg ring-1 ring-accent/20" : "border-border hover:border-accent/30"
                              )}
                            >
                              <h4 className="font-bold text-primary text-sm lg:text-base mb-1 truncate pr-6">{hotel.name}</h4>
                              <p className="text-[10px] lg:text-[11px] text-muted-foreground leading-relaxed mb-4 line-clamp-2">{hotel.desc}</p>
                              <div className="text-[10px] lg:text-xs font-bold text-accent uppercase tracking-widest">{hotel.price}</div>
                              {selectedHotel === hotel.id && <div className="absolute top-4 right-4"><CheckCircle2 className="w-4 h-4 text-accent" /></div>}
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  </ScrollArea>
                </div>

                {/* Summary Sidebar - Ensure it has a share of space on mobile */}
                <aside className="flex-1 lg:w-96 bg-muted/20 border-t lg:border-t-0 lg:border-l p-6 lg:p-8 flex flex-col min-h-0 order-2 overflow-y-auto">
                  <h3 className="text-lg lg:text-xl font-headline font-bold text-primary mb-4 lg:mb-6 shrink-0">Your Itinerary</h3>
                  
                  <div className="flex-grow space-y-6 mb-8">
                    {itinerary.length === 0 && !selectedCatering && (
                      <div className="text-center py-8 lg:py-12 px-4 border border-dashed rounded-2xl">
                        <Calendar className="w-6 lg:w-8 h-6 lg:h-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-[10px] lg:text-xs text-muted-foreground">Add workshops or treatments to begin planning.</p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {itinerary.map(item => (
                        <div key={item.id} className="flex items-start gap-3 p-2 lg:p-3 bg-white rounded-xl shadow-sm border border-border">
                          <div className="relative w-10 lg:w-12 h-10 lg:h-12 rounded-lg overflow-hidden shrink-0">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="text-[7px] lg:text-[8px] font-bold text-accent uppercase tracking-[0.2em]">{item.type}</div>
                            <h5 className="text-[10px] lg:text-xs font-bold text-primary truncate">{item.name}</h5>
                            <span className="text-[8px] lg:text-[10px] text-muted-foreground uppercase tracking-widest">{item.duration}</span>
                          </div>
                          <button onClick={() => removeItemFromItinerary(item.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-primary/10">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company Details</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input 
                            placeholder="Company Name" 
                            className="pl-9 h-10 text-xs rounded-xl"
                            value={contactForm.companyName}
                            onChange={(e) => setContactForm({...contactForm, companyName: e.target.value})}
                          />
                        </div>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input 
                            placeholder="Contact Person" 
                            className="pl-9 h-10 text-xs rounded-xl"
                            value={contactForm.contactName}
                            onChange={(e) => setContactForm({...contactForm, contactName: e.target.value})}
                          />
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input 
                            placeholder="Email Address" 
                            className="pl-9 h-10 text-xs rounded-xl"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                          />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input 
                            placeholder="Phone Number" 
                            className="pl-9 h-10 text-xs rounded-xl"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 lg:pt-8 border-t mt-auto space-y-4 shrink-0 bg-muted/5 p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs lg:text-sm font-medium text-muted-foreground">Est. Base Total</span>
                      <span className="text-lg lg:text-xl font-bold text-primary font-headline">Pending Review</span>
                    </div>
                    <Button 
                      onClick={handleRequestProposal} 
                      disabled={itinerary.length === 0 || isSubmitting} 
                      className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-12 lg:h-14 font-bold text-base lg:text-lg shadow-xl shadow-primary/10 transition-all active:scale-[0.98] gap-3"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : "Request Detailed Proposal"}
                    </Button>
                    <p className="text-[9px] lg:text-[10px] text-center text-muted-foreground uppercase tracking-widest">Formal Admin Approval Required</p>
                  </div>
                </aside>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Gallery Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">Evocative Spaces</h2>
                <p className="text-muted-foreground font-body leading-relaxed">
                  Our venues are designed to inspire quiet focus and loud collaboration in equal measure.
                </p>
              </div>
              <Button variant="outline" className="rounded-full px-8 h-12 border-accent text-accent hover:bg-accent/5" asChild>
                <Link href="/#workshops">View All Venues</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isMediaLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded-[2rem]" />
                ))
              ) : mediaItems && mediaItems.length > 0 ? (
                mediaItems.slice(0, 6).map((item: any, i: number) => (
                  <div key={item.id} className={cn("relative overflow-hidden rounded-[2rem] shadow-lg group h-72", (i === 0 || i === 4) && 'md:col-span-2')}>
                    <Image
                      src={item.url}
                      alt={item.altText || `Gallery ${i}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-white/50" />
                    </div>
                  </div>
                ))
              ) : (
                [PlaceHolderImages[0].imageUrl, PlaceHolderImages[1].imageUrl, PlaceHolderImages[2].imageUrl, CORPORATE_HERO_URL, PlaceHolderImages[4].imageUrl, PlaceHolderImages[5].imageUrl].map((img, i) => (
                  <div key={i} className={cn("relative overflow-hidden rounded-[2rem] shadow-lg group h-72", (i === 0 || i === 4) && 'md:col-span-2')}>
                    <Image
                      src={img}
                      alt={`Gallery ${i}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-white/50" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Services & Enhancements */}
        <section className="py-24 bg-primary text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <Badge className="bg-white/10 text-white border-none rounded-full px-4 py-1.5 mb-6 uppercase tracking-widest text-[10px] font-bold">
                  Bespoke Services
                </Badge>
                <h2 className="text-4xl font-headline font-bold mb-8">Every detail, curated for your team.</h2>
                
                <div className="space-y-10">
                  {[
                    { title: "Gourmet Gastronomy", icon: Utensils, desc: "From energy-boosting working breakfasts to multi-course celebration dinners under the stars." },
                    { title: "Luxury Stay", icon: Hotel, desc: "Bespoke accommodation on campus or prioritized rates with our handpicked local five-star hotel partners." },
                    { title: "Event Photography", icon: Camera, desc: "Professional visual storytellers to document your team's growth and capture the spirit of the retreat." }
                  ].map((service, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-all duration-300">
                        <service.icon className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2">{service.title}</h4>
                        <p className="text-white/70 text-sm leading-relaxed font-body">{service.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="aspect-square relative rounded-[3rem] overflow-hidden rotate-3 shadow-2xl border-8 border-white/5">
                  <Image
                    src={mediaItems?.[7]?.url || "https://picsum.photos/seed/luxury/800/800"}
                    alt="Luxury Service"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-10 -left-10 bg-accent p-8 rounded-[2rem] shadow-2xl max-w-xs -rotate-3 hidden md:block">
                  <Quote className="w-8 h-8 text-white/40 mb-4" />
                  <p className="text-white text-sm font-body italic leading-relaxed">
                    "Maroma transformed our annual planning session into a journey of discovery. The pottery workshop was the breakthrough we didn't know we needed."
                  </p>
                  <div className="mt-4 font-bold text-xs uppercase tracking-widest">VP Engineering, Tech Global</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-white text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-8">Ready to transform your corporate culture?</h2>
            <p className="text-lg text-muted-foreground mb-12 font-body leading-relaxed">
              Our event designers are ready to help you craft an experience that matches your team's unique vision and goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button onClick={() => setIsBuilderOpen(true)} size="lg" className="bg-accent text-white hover:bg-accent/90 rounded-full px-12 h-14 font-bold shadow-xl">
                Build Your Custom Experience
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-12 h-14 font-bold border-primary text-primary hover:bg-primary/5">
                Contact Sales Team
              </Button>
            </div>
            <p className="mt-10 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
              Response time usually under 12 hours
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
