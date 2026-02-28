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
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  LogIn, 
  AlertCircle,
  Trees,
  Award,
  Users2,
  Quote,
  Utensils,
  History,
  Palette,
  PlayCircle,
  Sprout,
  Compass,
  Flame,
  Droplets,
  Wind,
  ShoppingBag,
  Image as ImageIcon,
  MessageSquare
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, useDoc } from "@/firebase";
import { collection, query, where, serverTimestamp, doc } from "firebase/firestore";
import { Tour } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { sendEmailNotification } from "@/app/actions/notifications";

const SCHOOL_HERO_URL = "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000";
const GAME_TITLE_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Product%20Game%20Title%202.png?alt=media&token=f7698e9d-9e74-45e2-a0c1-916f1b9904db";

const PROGRAMME_STEPS = [
  {
    title: "1. Guided Campus Tour",
    desc: "Students are welcomed to the Maroma campus and introduced to our philosophy and production ecosystem. The tour begins in the packing and dispatch area, where they observe how finished products are carefully prepared for distribution.",
    icon: Compass
  },
  {
    title: "2. Candle Studio",
    desc: "In the candle section, students witness the candle-making process firsthand — from preparation to pouring and finishing. Subject to availability, a short candle workshop may be conducted.",
    icon: Flame
  },
  {
    title: "3. Soap Making Unit",
    desc: "Students visit our soap production space where they observe how soaps are formulated and produced. When possible, our soap maker delivers a concise technical introduction to ingredients, processes, and quality control.",
    icon: Droplets
  },
  {
    title: "4. Incense Workshop",
    desc: "Hands-On Session: In the incense section, students participate in a practical workshop making traditional leaf incense. This interactive session provides direct engagement with natural materials and artisanal techniques.",
    icon: Wind
  },
  {
    title: "5. Snacks",
    desc: "Light refreshments are served following the workshop sessions to allow students to recharge and reflect on the morning's activities.",
    icon: Utensils
  },
  {
    title: "6. Maroma Shop Visit",
    desc: "Students have the opportunity to visit the Maroma shop, explore the full product range, and make purchases if they wish.",
    icon: ShoppingBag
  },
  {
    title: "7. Maji Maroma Gallery",
    desc: "The tour includes a visit to the Maji Maroma Gallery, offering insight into the creative and artistic dimension of the Maroma ecosystem.",
    icon: ImageIcon
  },
  {
    title: "8. Q&A Session",
    desc: "The experience concludes with an open Q&A session. Students are encouraged to engage with the team on topics such as production processes, sustainability, and values-driven enterprise.",
    icon: MessageSquare
  }
];

const EDUCATION_LEVELS = [
  { id: 'primary', name: "Primary (K-6)", desc: "Focus on sensory exploration and nature." },
  { id: 'secondary', name: "Secondary (7-12)", desc: "Deep dives into chemistry, history, and craft." },
  { id: 'higher', name: "Higher Education", desc: "Design, sustainability, and business focus." },
];

const CATERING_OPTIONS = [
  { id: 'cat1', name: 'Standard School Lunch', price: 'Included', desc: 'Healthy, balanced meal suitable for students.' },
  { id: 'cat2', name: 'Artisan Garden Picnic', price: '+₹15/pp', desc: 'Lush outdoor dining with locally sourced snacks.' },
  { id: 'cat3', name: 'Premium Education Menu', price: '+₹25/pp', desc: 'Extended menu with farm-to-table ingredients.' },
];

export default function SchoolsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('secondary');
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [selectedCatering, setSelectedCatering] = useState<string>('cat1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [contactForm, setContactForm] = useState({
    schoolName: "",
    contactName: "",
    email: "",
    phone: "",
    studentCount: "20"
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
        schoolName: userData.organization || "",
        contactName: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
        email: userData.email || "",
        phone: userData.phoneNumber || "",
        studentCount: "20"
      });
      isInitialized.current = true;
    }
  }, [userData]);

  const toursQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "tours"), where("isActive", "==", true), where("status", "==", "live"));
  }, [firestore]);
  const { data: liveTours, isLoading: isToursLoading } = useCollection<Tour>(toursQuery);

  const addItemToItinerary = (item: any) => {
    if (itinerary.find(t => t.id === item.id)) return;
    setItinerary([...itinerary, item]);
  };

  const removeItemFromItinerary = (id: string) => {
    setItinerary(itinerary.filter(t => t.id !== id));
  };

  const handleRequestInquiry = async () => {
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please sign in to request a proposal." });
      return;
    }

    if (!contactForm.schoolName || !contactForm.email || !contactForm.contactName) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please complete all required contact information." });
      const element = document.getElementById('details-section');
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (itinerary.length === 0) {
      toast({ variant: "destructive", title: "Empty Itinerary", description: "Please select at least one workshop or tour." });
      return;
    }

    setIsSubmitting(true);
    
    try {
      addDocumentNonBlocking(collection(firestore, "proposals"), {
        userId: user.uid,
        ...contactForm,
        type: 'School',
        educationLevel: selectedLevel,
        itinerary: itinerary.map(item => ({ id: item.id, name: item.name, type: item.type })),
        catering: CATERING_OPTIONS.find(c => c.id === selectedCatering)?.name || "Standard",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await sendEmailNotification({
        to: contactForm.email,
        subject: `School Inquiry Received: Maroma Experiences`,
        textBody: `Hello ${contactForm.contactName},\n\nThank you for reaching out to Maroma Experiences. We have received your educational group inquiry for "${contactForm.schoolName}".\n\nOur educational design team is reviewing your custom itinerary for ${contactForm.studentCount} students. We will be in touch within 24 hours with a detailed educational plan and quote.\n\nWarm regards,\nThe Maroma Team\nhttps://maromaexperience.com`
      });

      toast({
        title: "Inquiry Sent!",
        description: "Our educational team is reviewing your request. A confirmation receipt has been sent to your email.",
      });

      setIsBuilderOpen(false);
      setItinerary([]);
      setSelectedCatering('cat1');
    } catch (err) {
      toast({ variant: "destructive", title: "Submission Failed", description: "Could not send inquiry request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] py-24 md:py-32 flex items-center justify-center overflow-hidden">
          <Image
            src={SCHOOL_HERO_URL}
            alt="School Campus Experience"
            fill
            className="object-cover brightness-[0.5]"
            priority
          />
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
            <Badge className="mb-10 bg-accent text-white border-none px-8 py-2.5 rounded-full uppercase tracking-[0.3em] font-bold text-xs shadow-xl">
              School Campus Experience
            </Badge>
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-white mb-8 drop-shadow-2xl leading-tight">
              Ignite Curiosity in the Classroom of Life.
            </h1>
            <p className="text-xl text-white/90 mb-14 font-body max-w-2xl mx-auto drop-shadow-md leading-relaxed">
              Our Schools Programme offers an immersive, structured visit to the Maroma campus, designed to introduce students to ethical production, craftsmanship, and sustainable enterprise.
            </p>
            <Button size="lg" onClick={() => setIsBuilderOpen(true)} className="bg-primary text-white hover:bg-primary/90 rounded-full px-14 h-16 text-lg font-bold shadow-2xl transition-all hover:scale-105 active:scale-95">
              Build Your School Itinerary
            </Button>
          </div>
        </section>

        {/* The Journey Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">Programme Itinerary</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-body">
                This programme combines education, craft exposure, and hands-on learning within a functioning production campus.
              </p>
              <div className="h-1.5 w-24 bg-accent mx-auto rounded-full mt-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {PROGRAMME_STEPS.map((step, i) => (
                <Card key={i} className="rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all duration-500 group overflow-hidden flex flex-col h-full">
                  <CardHeader className="bg-muted/30 p-8 pb-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-accent/10 transition-colors">
                      <step.icon className="w-6 h-6 text-accent" />
                    </div>
                    <CardTitle className="text-xl font-headline font-bold text-primary leading-tight">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 flex-grow">
                    <p className="text-sm text-muted-foreground leading-relaxed font-body">
                      {step.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Simulator Section */}
        <section className="bg-slate-900 py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-[3rem] border border-white/10 p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative group shadow-2xl">
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
                    Educational Workshop Tool
                  </Badge>
                  <h2 className="text-4xl md:text-6xl font-headline font-bold text-white leading-tight">
                    The Maroma <br className="hidden lg:block" /> Product Game
                  </h2>
                  <p className="text-slate-300 text-xl max-w-xl font-body leading-relaxed">
                    Students step into the shoes of entrepreneurs. In our live laboratory simulator, they'll design ethical products and see the real-world market impact of their choices.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-full px-12 h-16 text-xl font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-3">
                    <Link href="/simulator">
                      <PlayCircle className="w-6 h-6" /> Launch Simulator
                    </Link>
                  </Button>
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-bold uppercase tracking-widest mt-2 sm:mt-0 sm:ml-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Integration Ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Builder Dialog */}
        <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden border-none rounded-3xl lg:rounded-[3rem] flex flex-col bg-white">
            <div className="p-4 lg:p-8 border-b bg-muted/10 flex flex-col lg:flex-row lg:items-center justify-between shrink-0 gap-4">
              <div>
                <DialogTitle className="text-2xl lg:text-3xl font-headline font-bold text-primary">
                  Educational Planner
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1 text-sm lg:text-base">
                  Select workshops and learning levels for your school group.
                </DialogDescription>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto">
              <div className="flex flex-col lg:flex-row min-h-full">
                <div className="flex-1 lg:flex-[2] p-4 lg:p-8 space-y-8 lg:space-y-12 pb-12 border-b lg:border-b-0 lg:border-r border-primary/5">
                  <section>
                    <h3 className="text-lg lg:text-xl font-headline font-bold text-primary mb-4 lg:mb-6 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-accent" /> Select Learning Level
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {EDUCATION_LEVELS.map(level => (
                        <button 
                          key={level.id} 
                          onClick={() => setSelectedLevel(level.id)}
                          className={cn(
                            "p-4 text-left rounded-2xl border transition-all",
                            selectedLevel === level.id ? "bg-accent/5 border-accent shadow-sm" : "bg-white border-border hover:border-accent/30"
                          )}
                        >
                          <h4 className="font-bold text-primary text-sm lg:text-base mb-1">{level.name}</h4>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{level.desc}</p>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg lg:text-xl font-headline font-bold text-primary mb-4 lg:mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-accent" /> Select Educational Experiences
                    </h3>
                    {isToursLoading ? (
                      <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent" /></div>
                    ) : liveTours && liveTours.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {liveTours.map(tour => (
                          <button 
                            key={tour.id} 
                            onClick={() => addItemToItinerary({ id: tour.id, name: tour.name, imageUrl: tour.imageUrl, duration: tour.duration, type: 'Field Trip' })}
                            className={cn(
                              "flex text-left items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl border transition-all group",
                              itinerary.find(t => t.id === tour.id) ? "bg-accent/5 border-accent shadow-sm" : "bg-white border-border hover:border-accent/30 hover:shadow-md"
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
                            {itinerary.find(t => t.id === tour.id) ? (
                              <CheckCircle2 className="w-5 h-5 text-accent" />
                            ) : (
                              <Plus className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 border-2 border-dashed rounded-3xl text-center bg-muted/5">
                        <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No field trips currently available.</p>
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="text-lg lg:text-xl font-headline font-bold text-primary mb-4 lg:mb-6 flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-accent" /> Student Catering
                    </h3>
                    <div className="space-y-4">
                      {CATERING_OPTIONS.map(opt => (
                        <div 
                          key={opt.id} 
                          className={cn(
                            "flex items-center gap-4 p-4 lg:p-6 rounded-2xl border transition-all cursor-pointer bg-white group",
                            selectedCatering === opt.id ? "border-accent shadow-md ring-1 ring-accent/20" : "border-border hover:border-accent/30 hover:shadow-sm"
                          )}
                          onClick={() => setSelectedCatering(opt.id)}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                            selectedCatering === opt.id ? "border-accent bg-accent" : "border-muted-foreground/30"
                          )}>
                            {selectedCatering === opt.id && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-primary text-sm lg:text-base">{opt.name}</h4>
                              <span className="text-[9px] font-bold text-accent uppercase tracking-widest">{opt.price}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">{opt.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <aside className="flex-1 lg:w-96 bg-muted/20 border-t lg:border-t-0 p-6 lg:p-8 flex flex-col space-y-8 pb-32 lg:pb-8">
                  <h3 className="text-xl font-headline font-bold text-primary mb-6">Inquiry Summary</h3>
                  
                  <div className="space-y-6">
                    {itinerary.length === 0 && (
                      <div className="text-center py-12 px-4 border border-dashed rounded-2xl bg-white/50">
                        <p className="text-xs text-muted-foreground">Add field trips to begin planning.</p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {itinerary.map(item => (
                        <div key={item.id} className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm border border-border">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h5 className="text-xs font-bold text-primary truncate">{item.name}</h5>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.duration}</span>
                          </div>
                          <button onClick={() => removeItemFromItinerary(item.id)} className="text-muted-foreground hover:text-destructive p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div id="details-section" className="space-y-4 pt-6 border-t border-primary/10 scroll-mt-24">
                      {!user ? (
                        <Card className="rounded-2xl border-dashed border-accent/30 bg-accent/5 p-6 space-y-4">
                          <p className="text-xs font-bold text-primary">Authentication Required</p>
                          <Button asChild size="sm" className="w-full bg-accent hover:bg-accent/90 text-white rounded-full">
                            <Link href="/login">Sign In to Continue</Link>
                          </Button>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">School Name *</Label>
                            <Input placeholder="Greenwood High" className="h-11 text-sm rounded-xl" value={contactForm.schoolName} onChange={e => setContactForm({...contactForm, schoolName: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Lead Teacher *</Label>
                            <Input placeholder="Mr. Smith" className="h-11 text-sm rounded-xl" value={contactForm.contactName} onChange={e => setContactForm({...contactForm, contactName: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Email Address *</Label>
                            <Input placeholder="smith@school.edu" className="h-11 text-sm rounded-xl" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Student Count</Label>
                            <Input type="number" className="h-11 text-sm rounded-xl" value={contactForm.studentCount} onChange={e => setContactForm({...contactForm, studentCount: e.target.value})} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            <div className="p-4 lg:p-8 border-t bg-white shrink-0 shadow-lg flex items-center justify-between z-20">
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-bold text-primary font-headline">{itinerary.length} Trip(s) Selected</span>
              </div>
              {!user ? (
                <Button asChild className="w-full sm:min-w-[280px] bg-accent rounded-full h-14 font-bold text-lg">
                  <Link href="/login">Sign In to Request Inquiry</Link>
                </Button>
              ) : (
                <Button onClick={handleRequestInquiry} disabled={itinerary.length === 0 || isSubmitting} className="w-full sm:min-w-[280px] bg-primary rounded-full h-14 font-bold text-lg">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Educational Inquiry"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
