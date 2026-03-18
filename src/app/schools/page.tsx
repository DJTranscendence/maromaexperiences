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
  Sparkles, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  LogIn, 
  AlertCircle,
  Utensils,
  Compass,
  Flame,
  Droplets,
  Wind,
  ShoppingBag,
  ImageIcon,
  MessageSquare,
  PlayCircle,
  Palette,
  History,
  Calendar
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { collection, serverTimestamp, doc, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { sendEmailNotification } from "@/app/actions/notifications";
import { Tour } from "@/lib/types";

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
    desc: "For the school tours, we offer refreshments that align with our ecological and ethical values. Children are served healthy biscuits baked locally at the Auroville bakery, along with hibiscus flower syrup prepared in-house from locally sourced flowers. The intention is precise: zero packaging, minimal processing, and maximal flavour.",
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

const STUDENT_COUNT_OPTIONS = ["10", "15", "20", "25", "30", "35", "40", "50", "60", "70", "80", "90", "100"];
const ADULT_COUNT_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12", "15", "20"];

const CAMPUS_TOUR_PROGRAM = {
  id: 'the-maroma-tour',
  name: 'The Maroma Tour',
  type: 'Campus Experience',
  imageUrl: SCHOOL_HERO_URL,
  duration: '90 Minutes (10:30am - 12:00pm)'
};

export default function SchoolsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [contactForm, setContactForm] = useState({
    schoolName: "",
    contactName: "",
    email: "",
    phone: "",
    studentCount: "20",
    adultCount: "2"
  });

  const isInitialized = useRef(false);
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userDocRef);

  // 1. Fetch the master campus tour record
  const tourQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "tours"), where("name", "==", "The Maroma Tour"), where("isActive", "==", true));
  }, [firestore]);
  const { data: tourDocs, isLoading: isTourLoading } = useCollection<Tour>(tourQuery);
  const tourData = tourDocs?.[0];

  // 2. Fetch existing bookings and proposals to find "taken" slots
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "bookings");
  }, [firestore]);
  const { data: allBookings, isLoading: isBookingsLoading } = useCollection<any>(bookingsQuery);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "proposals");
  }, [firestore]);
  const { data: allProposals, isLoading: isProposalsLoading } = useCollection<any>(proposalsQuery);

  // 3. Calculate Vacant Slots (Master dates minus any date with a booking/proposal)
  const availableDates = useMemo(() => {
    // Get master dates from the campus tour object
    const masterDates = tourData?.scheduledDates || [];
    
    // Default fallback list only if no tour object found in DB yet
    if (masterDates.length === 0 && !tourData && !isTourLoading) {
      return ["2025-04-14", "2025-04-21", "2025-04-28", "2025-05-05", "2025-05-12", "2025-05-19"];
    }

    // Identify all dates that already have campus activity
    const takenInProposals = allProposals?.map(p => p.selectedDate).filter(Boolean) || [];
    const takenInBookings = allBookings?.map(b => b.tourDate).filter(Boolean) || [];
    const takenDatesSet = new Set([...takenInProposals, ...takenInBookings]);
    
    // Return only those scheduled dates that are truly vacant
    return masterDates.filter(d => !takenDatesSet.has(d));
  }, [tourData, allProposals, allBookings, isTourLoading]);

  useEffect(() => {
    if (userData && !isInitialized.current) {
      setContactForm({
        schoolName: userData.schoolName || userData.organization || "",
        contactName: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
        email: userData.email || "",
        phone: userData.phoneNumber || "",
        studentCount: "20",
        adultCount: "2"
      });
      isInitialized.current = true;
    }
  }, [userData]);

  const handleRequestBooking = async () => {
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please sign in to request a booking." });
      return;
    }

    if (!contactForm.schoolName || !contactForm.email || !contactForm.contactName) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please complete all required contact information." });
      const element = document.getElementById('details-section');
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (!selectedDate) {
      toast({ variant: "destructive", title: "Date Required", description: "Please select a preferred date for your tour." });
      const element = document.getElementById('date-section');
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      addDocumentNonBlocking(collection(firestore, "proposals"), {
        userId: user.uid,
        ...contactForm,
        type: 'School',
        selectedDate: selectedDate,
        itinerary: [{ id: CAMPUS_TOUR_PROGRAM.id, name: CAMPUS_TOUR_PROGRAM.name, type: CAMPUS_TOUR_PROGRAM.type }],
        catering: "Standard Ethical Refreshments",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await sendEmailNotification({
        to: contactForm.email,
        subject: `Booking Request: The Maroma Tour`,
        textBody: `Hello ${contactForm.contactName},\n\nYour request for "The Maroma Tour" on ${selectedDate} has been received for "${contactForm.schoolName}".\n\nTiming: 10:30 AM - 12:00 PM\n\nWe will confirm your booking as soon as possible after reviewing our campus schedule.\n\nWarm regards,\nThe Maroma Team\nhttps://maromaexperience.com`
      });

      toast({
        title: "Request Sent!",
        description: "Your booking request has been received. We will confirm as soon as possible.",
      });

      setIsBuilderOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Submission Failed", description: "Could not send booking request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoadingData = isTourLoading || isBookingsLoading || isProposalsLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden py-12">
          <Image
            src={SCHOOL_HERO_URL}
            alt="School Campus Experience"
            fill
            className="object-cover brightness-[0.5]"
            priority
          />
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
            <Badge className="mb-8 bg-accent text-white border-none px-8 py-2.5 rounded-full uppercase tracking-[0.3em] font-bold text-xs shadow-xl">
              School Campus Experience
            </Badge>
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-white mb-6 drop-shadow-2xl leading-tight">
              Ignite Curiosity in the Classroom of Life.
            </h1>
            <p className="text-xl text-white/90 mb-10 font-body max-w-2xl mx-auto drop-shadow-md leading-relaxed">
              Our Schools Programme offers an immersive, structured visit to the Maroma campus, designed to introduce students to ethical production, craftsmanship, and sustainable enterprise.
            </p>
            <Button size="lg" onClick={() => setIsBuilderOpen(true)} className="bg-primary text-white hover:bg-primary/90 rounded-full px-14 h-16 text-lg font-bold shadow-2xl transition-all hover:scale-105 active:scale-95">
              Request School Booking
            </Button>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">Programme Itinerary: The Maroma Tour</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-body">
                This 8-step programme combines education, craft exposure, and hands-on learning within a functioning production campus.
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

        {/* Simulator Portal Banner */}
        <section className="bg-slate-900 py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-[3rem] border border-white/10 pt-20 pb-16 px-8 flex flex-col items-center overflow-hidden relative group shadow-2xl">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative w-full max-w-[280px] h-40 sm:max-w-[440px] sm:h-60 shrink-0 z-10 mb-8">
                <Image 
                  src={GAME_TITLE_URL}
                  alt="The Maroma Product Game"
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="flex-grow text-center space-y-8 relative z-10 flex flex-col items-center">
                <div className="space-y-4 flex flex-col items-center">
                  <Badge className="bg-accent text-white px-6 py-1.5 rounded-full uppercase tracking-[0.3em] text-[10px] font-bold border-none shadow-lg">
                    Educational Workshop Tool
                  </Badge>
                  <h2 className="text-4xl md:text-6xl font-headline font-bold text-white leading-tight">
                    Join the game here
                  </h2>
                  <p className="text-slate-300 text-xl max-w-xl font-body leading-relaxed">
                    Name your team, create your product and see how it performs!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-full px-12 h-16 text-xl font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-3 w-full sm:w-auto">
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

        <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden border-none rounded-3xl lg:rounded-[3rem] flex flex-col bg-white">
            <div className="p-4 lg:p-8 border-b bg-muted/10 flex flex-col lg:flex-row lg:items-center justify-between shrink-0 gap-4">
              <div>
                <DialogTitle className="text-2xl lg:text-3xl font-headline font-bold text-primary">
                  Book your school tour
                </DialogTitle>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto">
              <div className="flex flex-col lg:flex-row min-h-full">
                <div className="flex-1 lg:flex-[2] p-4 lg:p-8 space-y-8 lg:space-y-12 pb-12 border-b lg:border-b-0 lg:border-r border-primary/5">
                  <section id="date-section">
                    <h3 className="text-lg lg:text-xl font-headline font-bold text-primary mb-4 lg:mb-6 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-accent" /> Select Vacant Campus Slot
                    </h3>
                    
                    {isLoadingData ? (
                      <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
                    ) : availableDates.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {availableDates.map(date => (
                          <button 
                            key={date} 
                            onClick={() => setSelectedDate(date)}
                            className={cn(
                              "p-3 text-center rounded-xl border transition-all font-bold text-xs uppercase tracking-widest",
                              selectedDate === date ? "bg-primary text-white border-primary shadow-lg scale-[1.02]" : "bg-white border-border hover:border-accent/50 text-primary"
                            )}
                          >
                            {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 bg-rose-50 border-2 border-dashed border-rose-200 rounded-[2rem] text-center space-y-4">
                        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                        <div className="space-y-1">
                          <p className="font-bold text-rose-900">All Scheduled Slots are Taken</p>
                          <p className="text-sm text-rose-700">Please contact our campus design team directly for bespoke school arrangements.</p>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-[10px] text-muted-foreground mt-4 italic">Dates above represent truly vacant slots where no other campus tours or workshops are scheduled. Mondays and Fridays are preferred.</p>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Compass className="w-5 h-5 text-accent" />
                      <h3 className="text-lg lg:text-xl font-headline font-bold text-primary">Core Experience</h3>
                    </div>
                    <Card className="rounded-[2rem] border-none bg-accent/5 p-8 flex items-center gap-6">
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-lg">
                        <Image src={CAMPUS_TOUR_PROGRAM.imageUrl} alt={CAMPUS_TOUR_PROGRAM.name} fill className="object-cover" />
                      </div>
                      <div>
                        <h4 className="text-xl font-headline font-bold text-primary mb-1">{CAMPUS_TOUR_PROGRAM.name}</h4>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground uppercase tracking-widest font-bold">
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 90 Minutes</span>
                          <span className="flex items-center gap-1.5 text-accent font-black">10:30AM — 12:00PM</span>
                          <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> 8-Step Programme</span>
                        </div>
                        <p className="text-sm text-primary/70 mt-3 leading-relaxed">
                          A comprehensive tour of our production ecosystem, including hands-on incense making and ethical refreshment service.
                        </p>
                      </div>
                    </Card>
                  </section>
                </div>

                <aside className="flex-1 lg:w-96 bg-muted/20 border-t lg:border-t-0 p-6 lg:p-8 flex flex-col space-y-8 pb-32 lg:pb-8">
                  <h3 className="text-xl font-headline font-bold text-primary mb-6">Booking Summary</h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm border border-accent/20">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                          <Image src={CAMPUS_TOUR_PROGRAM.imageUrl} alt={CAMPUS_TOUR_PROGRAM.name} fill className="object-cover" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="text-[8px] font-bold text-accent uppercase tracking-widest">Selected Program</div>
                          <h5 className="text-xs font-bold text-primary truncate">{CAMPUS_TOUR_PROGRAM.name}</h5>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{selectedDate ? `Date: ${selectedDate}` : '90 Mins (10:30 AM — 12:00 PM)'}</span>
                        </div>
                      </div>
                    </div>

                    <div id="details-section" className="space-y-4 pt-6 border-t border-primary/10 scroll-mt-24">
                      {!user ? (
                        <Card className="rounded-2xl border-dashed border-accent/30 bg-accent/5 p-6 space-y-4">
                          <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-accent shrink-0" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-primary">Authentication Required</p>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">Please sign in to your Maroma account to request and manage your educational inquiries.</p>
                            </div>
                          </div>
                          <Button asChild size="sm" className="w-full bg-accent hover:bg-accent/90 text-white rounded-full h-10 font-bold gap-2">
                            <Link href="/login">
                              <LogIn className="w-3.5 h-3.5" /> Sign In to Continue
                            </Link>
                          </Button>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground pl-1">School Name *</Label>
                            <Input placeholder="Greenwood High" className="h-11 text-sm rounded-xl bg-white" value={contactForm.schoolName} onChange={e => setContactForm({...contactForm, schoolName: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Lead Teacher *</Label>
                            <Input placeholder="Mr. Smith" className="h-11 text-sm rounded-xl bg-white" value={contactForm.contactName} onChange={e => setContactForm({...contactForm, contactName: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Email Address *</Label>
                            <Input placeholder="smith@school.edu" className="h-11 text-sm rounded-xl bg-white" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Number of students *</Label>
                              <Select value={contactForm.studentCount} onValueChange={v => setContactForm({...contactForm, studentCount: v})}>
                                <SelectTrigger className="h-11 text-sm rounded-xl bg-white">
                                  <SelectValue placeholder="Count" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STUDENT_COUNT_OPTIONS.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt} Students</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Number of adults *</Label>
                              <Select value={contactForm.adultCount} onValueChange={v => setContactForm({...contactForm, adultCount: v})}>
                                <SelectTrigger className="h-11 text-sm rounded-xl bg-white">
                                  <SelectValue placeholder="Count" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ADULT_COUNT_OPTIONS.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt} Adult(s)</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            <div className="p-4 lg:p-8 border-t bg-white shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-between z-20">
              <div className="hidden sm:flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Selection Status</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary font-headline">
                    {selectedDate ? `Reserved for ${selectedDate}` : "Select a date to request booking"}
                  </span>
                  {selectedDate && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                </div>
              </div>
              <div className="w-full sm:w-auto flex flex-col gap-2">
                {!user ? (
                  <Button 
                    asChild
                    className="w-full sm:min-w-[280px] bg-accent hover:bg-accent/90 text-white rounded-full h-14 font-bold text-lg shadow-xl shadow-accent/10 transition-all active:scale-[0.98] gap-3"
                  >
                    <Link href="/login">
                      Sign In to Request Booking
                      <LogIn className="w-5 h-5" />
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    onClick={handleRequestBooking} 
                    disabled={isSubmitting || !selectedDate} 
                    className="w-full sm:min-w-[280px] bg-primary hover:bg-primary/90 text-white rounded-full h-14 font-bold text-lg shadow-xl shadow-primary/10 transition-all active:scale-[0.98] gap-3"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        {!selectedDate ? "Select Date to Request" : "Request Booking"}
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                )}
                <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                  Final confirmation within 24 Hours
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
