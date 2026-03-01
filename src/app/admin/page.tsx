"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Trash2, Edit, Save, Loader2, Check, X, Users, Info, 
  Settings, Image as ImageIcon, Search, Shield, UserCheck, 
  User, Edit2, Upload, FileText, Activity, AlertCircle, LogIn, Palette, Type, CalendarDays,
  Bell, Building2, GraduationCap, Mail, Phone, ExternalLink, ClipboardList, Send, MessageSquare, Clock, MapPin, Navigation,
  Calendar as CalendarIcon, Plus, Wand2, ChevronLeft, ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, useDoc } from "@/firebase";
import { collection, serverTimestamp, doc, query, orderBy, Timestamp } from "firebase/firestore";
import { Tour } from "@/lib/types";
import { ImageLibrary } from "@/components/admin/ImageLibrary";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { sendEmailNotification } from "@/app/actions/notifications";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, getDay } from "date-fns";

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  accountType?: string;
}

interface BookingRecord {
  id: string;
  userId: string;
  tourName: string;
  tourDate: string;
  numberOfAttendees: number;
  totalPrice: number;
  bookingStatus: string;
  bookedAt: any;
  tourId: string;
}

interface ProposalRecord {
  id: string;
  userId: string;
  type?: string;
  schoolName?: string;
  companyName?: string;
  contactName: string;
  email: string;
  phone?: string;
  selectedDate?: string;
  packageName?: string;
  itinerary: any[];
  status: string;
  createdAt: any;
  catering?: string;
  studentCount?: string;
  adultCount?: string;
  participants?: string;
  addons?: string[];
  hotel?: string;
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  altText?: string;
  uploadedAt: any;
}

const HIGHLIGHT_OPTIONS = [
  "Tour",
  "Workshop",
  "Q&A",
  "Refreshments",
  "Take-home gift",
  "Certificate"
];

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/LOGO%20only%20NEW%20TRANS%202025.png?alt=media&token=916bf295-69a1-4640-9f92-d8d2560ee0c2";

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AUTH GUARD ---
  const isWorkshopOwner = user?.email === "indispirit@gmail.com";
  
  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);
  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminRef);
  const isAdmin = isWorkshopOwner || !!adminDoc;

  // --- PROPOSAL DETAIL MODAL ---
  const [selectedProposal, setSelectedProposal] = useState<ProposalRecord | null>(null);
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailDraft, setEmailDraft] = useState({ subject: "", body: "" });

  const handleOpenProposal = (p: ProposalRecord) => {
    setSelectedProposal(p);
    if (p.type === 'School') {
      setEmailDraft({
        subject: `Booking Confirmed: ${p.schoolName} - Maroma Tour`,
        body: `Hello ${p.contactName},\n\nWe are delighted to confirm your school tour for "${p.schoolName}" on ${p.selectedDate || "[Date]"}.\n\nSchedule: 10:30 AM — 12:00 PM\nGroup Size: ${p.studentCount} Students, ${p.adultCount} Adults\n\nWe look forward to hosting your students at the Maroma Campus!\n\nBest regards,\nThe Maroma Team`
      });
    } else {
      setEmailDraft({
        subject: `Proposal Confirmed: ${p.companyName} - Maroma Experience`,
        body: `Hello ${p.contactName},\n\nWe have reviewed your request for "${p.companyName}" and are ready to proceed with your custom Maroma experience.\n\nPackage: ${p.packageName || "Custom Itinerary"}\nCatering: ${p.catering || "Standard"}\n\nOur team will be in touch shortly with the formal contract and invoice details.\n\nWarm regards,\nThe Maroma Team`
      });
    }
  };

  const handleSendConfirmation = async () => {
    if (!selectedProposal) return;
    setIsEmailing(true);
    try {
      await sendEmailNotification({
        to: selectedProposal.email,
        subject: emailDraft.subject,
        textBody: emailDraft.body
      });
      if (firestore) {
        updateDocumentNonBlocking(doc(firestore, "proposals", selectedProposal.id), {
          status: "approved",
          updatedAt: serverTimestamp()
        });
      }
      toast({ title: "Confirmation Sent", description: `Email delivered to ${selectedProposal.email}.` });
      setIsEmailing(false);
      setSelectedProposal(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Delivery Failed", description: "Could not send the confirmation email." });
      setIsEmailing(false);
    }
  };

  // --- TOUR STATE & QUERIES ---
  const toursQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, "tours");
  }, [firestore, isAdmin]);
  const { data: tours, isLoading: isToursLoading } = useCollection<Tour>(toursQuery);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTour, setNewTour] = useState({
    name: "",
    highlights: [] as string[],
    location: "Maroma Campus",
    duration: "60 minutes",
    audience: "",
    description: "",
    price: 500,
    capacity: 20,
    minGroupSize: 8,
    type: "workshop" as Tour.type,
    status: "live" as 'live' | 'coming-soon',
    imageUrls: [] as string[],
    scheduledDates: [] as string[]
  });

  // --- SCHEDULING LOGIC ---
  const [dateSelection, setDateSelection] = useState<Date[]>([]);
  
  const generateDatesForDay = (dayIndex: number) => {
    const dates: Date[] = [];
    let current = new Date();
    const end = addMonths(new Date(), 12);
    
    while (current <= end) {
      if (getDay(current) === dayIndex) {
        dates.push(new Date(current));
      }
      current = addDays(current, 1);
    }
    
    const formatted = dates.map(d => format(d, 'yyyy-MM-dd'));
    setNewTour(prev => ({
      ...prev,
      scheduledDates: Array.from(new Set([...prev.scheduledDates, ...formatted])).sort()
    }));
    toast({ title: "Schedule Generated", description: `Added ${dates.length} occurrences over the next 12 months.` });
  };

  // --- CALENDAR VIEW LOGIC ---
  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "proposals"), orderBy("createdAt", "desc"));
  }, [firestore, isAdmin]);
  const { data: proposals, isLoading: isProposalsLoading } = useCollection<ProposalRecord>(proposalsQuery);

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  const calendarEvents = useMemo(() => {
    const events: { date: string, title: string, type: 'workshop' | 'school' | 'corporate', id: string }[] = [];
    
    tours?.forEach(t => {
      t.scheduledDates?.forEach(d => {
        events.push({ date: d, title: t.name, type: 'workshop', id: t.id });
      });
    });
    
    proposals?.forEach(p => {
      if (p.selectedDate) {
        events.push({ 
          date: p.selectedDate, 
          title: p.schoolName || p.companyName || "Group Tour", 
          type: p.type === 'School' ? 'school' : 'corporate',
          id: p.id 
        });
      }
    });
    
    return events;
  }, [tours, proposals]);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(calendarMonth),
      end: endOfMonth(calendarMonth)
    });
  }, [calendarMonth]);

  // --- BRAND SETTINGS ---
  const brandSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "brand_layout");
  }, [firestore]);
  const { data: brandSettings } = useDoc(brandSettingsRef);

  const [localBrandSettings, setLocalBrandSettings] = useState({
    navbarKerning: 0.7,
    navbarOffset: 0,
    loadingKerning: 1.05,
    loadingOffset: 0
  });

  useEffect(() => {
    if (brandSettings) {
      setLocalBrandSettings({
        navbarKerning: brandSettings.navbarKerning ?? 0.7,
        navbarOffset: brandSettings.navbarOffset ?? 0,
        loadingKerning: brandSettings.loadingKerning ?? 1.05,
        loadingOffset: brandSettings.loadingOffset ?? 0
      });
    }
  }, [brandSettings]);

  const handleSaveBrandSettings = () => {
    if (!brandSettingsRef) return;
    setDocumentNonBlocking(brandSettingsRef, {
      ...localBrandSettings,
      updatedAt: serverTimestamp()
    }, { merge: true });
    toast({ title: "Brand Settings Saved", description: "Logo layout updated across all platforms." });
  };

  const resetTourForm = () => {
    setEditingId(null);
    setNewTour({
      name: "",
      highlights: [],
      location: "Maroma Campus",
      duration: "60 minutes",
      audience: "",
      description: "",
      price: 500,
      capacity: 20,
      minGroupSize: 8,
      type: "workshop",
      status: "live",
      imageUrls: [],
      scheduledDates: []
    });
    setDateSelection([]);
  };

  const handleEditTour = (tour: Tour) => {
    setEditingId(tour.id);
    setNewTour({
      name: tour.name,
      highlights: tour.highlights || [],
      location: tour.location || "Maroma Campus",
      duration: tour.duration || "60 minutes",
      audience: tour.audience || "",
      description: tour.description || "",
      price: tour.price,
      capacity: tour.capacity || 20,
      minGroupSize: tour.minGroupSize || 8,
      type: tour.type || "workshop",
      status: tour.status || "live",
      imageUrls: tour.imageUrls || (tour.imageUrl ? [tour.imageUrl] : []),
      scheduledDates: tour.scheduledDates || []
    });
    setDateSelection((tour.scheduledDates || []).map(d => new Date(d)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveTour = () => {
    if (!newTour.name || !firestore || !user) return;
    setIsProcessing(true);
    const tourData: Partial<Tour> = {
      ...newTour,
      shortDescription: newTour.description.substring(0, 100),
      pricePerPerson: newTour.price,
      durationHours: parseInt(newTour.duration) || 1,
      isActive: true,
      updatedAt: serverTimestamp(),
      imageUrl: newTour.imageUrls[0] || `https://picsum.photos/seed/${Math.random()}/1200/800`,
    };
    if (editingId) {
      updateDocumentNonBlocking(doc(firestore, "tours", editingId), tourData);
      toast({ title: "Changes Saved" });
    } else {
      addDocumentNonBlocking(collection(firestore, "tours"), { ...tourData, tourOwnerId: user.uid, createdAt: serverTimestamp(), bookedSpaces: 0 });
      toast({ title: "Experience Published" });
    }
    setIsSuccess(true);
    setTimeout(() => { setIsSuccess(false); setIsProcessing(false); resetTourForm(); }, 2000);
  };

  // --- USER STATE & QUERIES ---
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isAdmin) return null;
    return collection(firestore, "users");
  }, [firestore, user, isAdmin]);
  const adminsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isAdmin) return null;
    return collection(firestore, "roles_admin");
  }, [firestore, user, isAdmin]);
  const facilitatorsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isAdmin) return null;
    return collection(firestore, "roles_facilitator");
  }, [firestore, user, isAdmin]);

  const { data: users, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: admins } = useCollection(adminsQuery);
  const { data: facilitators } = useCollection(facilitatorsQuery);

  const adminIds = new Set(admins?.map(a => a.id) || []);
  const facilitatorIds = new Set(facilitators?.map(f => f.id) || []);

  const filteredUsers = users?.filter(u => 
    u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // --- BOOKINGS QUERY ---
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "bookings"), orderBy("bookedAt", "desc"));
  }, [firestore, isAdmin]);
  const { data: bookings, isLoading: isBookingsLoading } = useCollection<BookingRecord>(bookingsQuery);

  // --- MEDIA STATE & QUERIES ---
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, 'media');
  }, [firestore, isAdmin]);
  const { data: media, isLoading: isMediaLoading } = useCollection<MediaItem>(mediaQuery);

  const filteredMedia = useMemo(() => {
    if (!media) return null;
    const items = media.filter(item => 
      item.url.toLowerCase().includes(mediaSearchQuery.toLowerCase()) || 
      item.altText?.toLowerCase().includes(mediaSearchQuery.toLowerCase())
    );
    return [...items].sort((a, b) => {
      const timeA = a.uploadedAt?.toMillis?.() || a.uploadedAt?.seconds * 1000 || Date.now();
      const timeB = b.uploadedAt?.toMillis?.() || b.uploadedAt?.seconds * 1000 || Date.now();
      return timeB - timeA;
    });
  }, [media, mediaSearchQuery]);

  if (isUserLoading || isAdminDocLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
        <p className="mt-4 text-muted-foreground font-medium uppercase tracking-widest text-xs">Verifying Access...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-10 text-center rounded-[2.5rem] border-none shadow-2xl bg-white">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-3xl font-headline font-bold text-primary mb-2">Access Restricted</h2>
            <p className="text-muted-foreground leading-relaxed">This area is reserved for administrators only.</p>
            <div className="mt-8 space-y-3">
              <Button asChild className="w-full bg-primary rounded-full h-12 font-bold shadow-lg"><Link href="/login">Sign In</Link></Button>
              <Button asChild variant="ghost" className="w-full rounded-full h-12"><Link href="/">Return Home</Link></Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        
        <Tabs defaultValue="bookings" className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Unified view of all Maroma activities.</p>
            </div>
            
            <div className="w-full overflow-x-auto no-scrollbar pb-4 -mb-4">
              <TabsList className="bg-white p-1 h-14 rounded-full shadow-lg border border-border/50 min-w-max flex">
                <TabsTrigger value="bookings" className="rounded-full h-full px-4 sm:px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <CalendarDays className="w-5 h-5" /> Bookings
                </TabsTrigger>
                <TabsTrigger value="proposals" className="rounded-full h-full px-4 sm:px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <ClipboardList className="w-5 h-5" /> Requests
                </TabsTrigger>
                <TabsTrigger value="calendar" className="rounded-full h-full px-4 sm:px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <CalendarIcon className="w-5 h-5" /> Schedule
                </TabsTrigger>
                <TabsTrigger value="brand" className="rounded-full h-full px-4 sm:px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Palette className="w-5 h-5" /> Brand
                </TabsTrigger>
                <TabsTrigger value="media" className="rounded-full h-full px-4 sm:px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <ImageIcon className="w-5 h-5" /> Media
                </TabsTrigger>
                <TabsTrigger value="users" className="rounded-full h-full px-4 sm:px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Users className="w-5 h-5" /> Users
                </TabsTrigger>
                <TabsTrigger value="admin" className="rounded-full h-full px-4 sm:px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Settings className="w-5 h-5" /> Experiences
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="calendar" className="m-0 focus-visible:ring-0">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-white border-b px-8 py-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-2xl text-primary">Campus Activity Calendar</CardTitle>
                  <p className="text-sm text-muted-foreground">Comprehensive view of all tours, workshops, and group events.</p>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" className="rounded-full" onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-headline font-bold text-xl min-w-[140px] text-center">{format(calendarMonth, 'MMMM yyyy')}</span>
                  <Button variant="outline" size="icon" className="rounded-full" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-slate-50 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: getDay(startOfMonth(calendarMonth)) }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white/50 h-32" />
                  ))}
                  {daysInMonth.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const events = calendarEvents.filter(e => e.date === dayStr);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div key={dayStr} className={cn("bg-white p-3 h-32 border-t border-slate-100 flex flex-col gap-1 transition-colors hover:bg-slate-50", isToday && "bg-accent/5")}>
                        <span className={cn("text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1", isToday ? "bg-accent text-white" : "text-slate-400")}>
                          {format(day, 'd')}
                        </span>
                        <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
                          {events.map((e, idx) => (
                            <div 
                              key={`${e.id}-${idx}`} 
                              className={cn(
                                "text-[9px] font-bold px-2 py-1 rounded-md border truncate uppercase tracking-tighter",
                                e.type === 'workshop' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                e.type === 'school' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                "bg-emerald-50 text-emerald-700 border-emerald-100"
                              )}
                            >
                              {e.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 flex flex-wrap gap-6 justify-center">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-blue-500" /> Public Workshops
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-purple-500" /> School Tours
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" /> Corporate Events
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="m-0 focus-visible:ring-0">
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b px-8 py-6">
                <CardTitle className="font-headline text-2xl text-primary">Individual Bookings</CardTitle>
                <p className="text-sm text-muted-foreground">Standard workshop and tour reservations.</p>
              </CardHeader>
              <Table>
                <TableHeader><TableRow className="bg-muted/30">
                  <TableHead>Experience</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {isBookingsLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-accent" /></TableCell></TableRow>
                  ) : bookings?.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-bold text-primary">{b.tourName}</TableCell>
                      <TableCell>{b.numberOfAttendees} Person(s)</TableCell>
                      <TableCell className="font-medium">₹{b.totalPrice}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-700 capitalize border-none px-3">{b.bookingStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.bookedAt?.toDate?.()?.toLocaleDateString() || "Recent"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="rounded-full h-9 gap-2 text-xs" onClick={() => deleteDocumentNonBlocking(doc(firestore!, "bookings", b.id))}>
                            <Trash2 className="w-3 h-3" /> Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="proposals" className="m-0 focus-visible:ring-0">
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b px-8 py-6">
                <CardTitle className="font-headline text-2xl text-primary">Group & Corporate Requests</CardTitle>
                <p className="text-sm text-muted-foreground">Managed inquiries for schools and businesses. Click to view details.</p>
              </CardHeader>
              <Table>
                <TableHeader><TableRow className="bg-muted/30">
                  <TableHead>Type</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Management</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {isProposalsLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-accent" /></TableCell></TableRow>
                  ) : proposals?.map(p => (
                    <TableRow 
                      key={p.id} 
                      className="group cursor-pointer hover:bg-muted/10 transition-colors"
                      onClick={() => handleOpenProposal(p)}
                    >
                      <TableCell>
                        {p.type === 'School' ? (
                          <Badge className="bg-blue-100 text-blue-700 border-none gap-1.5"><GraduationCap className="w-3 h-3" /> School</Badge>
                        ) : (
                          <Badge className="bg-purple-100 text-purple-700 border-none gap-1.5"><Building2 className="w-3 h-3" /> Corporate</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {p.schoolName || p.companyName || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium">{p.contactName}</span>
                          <span className="text-muted-foreground">{p.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {p.selectedDate || "Flexible"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-full px-3 py-0.5 text-[10px] font-bold border-none", 
                          p.status === 'pending' ? "bg-amber-100 text-amber-700" : 
                          p.status === 'reviewed' ? "bg-blue-100 text-blue-700" : 
                          "bg-green-100 text-green-700"
                        )}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" className="rounded-full hover:bg-white shadow-sm" onClick={() => handleOpenProposal(p)}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="rounded-full hover:text-destructive" onClick={() => deleteDocumentNonBlocking(doc(firestore!, "proposals", p.id))}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Dialog open={!!selectedProposal} onOpenChange={open => !open && setSelectedProposal(null)}>
              <DialogContent className="w-[95vw] sm:max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                {selectedProposal && (
                  <div className="flex flex-col h-[85vh]">
                    <div className="bg-primary p-6 sm:p-10 pb-8 sm:pb-12 text-white shrink-0 relative">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <Badge className="bg-white/20 text-white border-none px-5 py-1.5 rounded-full uppercase tracking-[0.2em] text-[10px] font-bold w-fit">
                          {selectedProposal.type || 'Request'} Detail
                        </Badge>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold uppercase tracking-widest opacity-60">Status:</span>
                          <Select 
                            value={selectedProposal.status} 
                            onValueChange={(val) => {
                              if (firestore) updateDocumentNonBlocking(doc(firestore, "proposals", selectedProposal.id), { status: val, updatedAt: serverTimestamp() });
                            }}
                          >
                            <SelectTrigger className="h-9 bg-white/10 border-white/20 text-white rounded-full text-xs min-w-[120px] font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl border-none">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewed">Reviewed</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <h2 className="text-3xl sm:text-5xl font-headline font-bold leading-tight tracking-tight mb-6 line-clamp-2">
                        {selectedProposal.schoolName || selectedProposal.companyName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-medium">
                        <div className="flex items-center gap-2.5 opacity-80"><User className="w-4 h-4 text-accent" /> {selectedProposal.contactName}</div>
                        <div className="flex items-center gap-2.5 opacity-80"><Mail className="w-4 h-4 text-accent" /> {selectedProposal.email}</div>
                      </div>
                    </div>

                    <div className="flex-grow overflow-y-auto bg-slate-50/50 p-6 sm:p-10 space-y-10">
                      <section className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">Experience Logistics</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between bg-white p-5 rounded-[1.5rem] shadow-sm border border-border/40">
                            <div className="flex items-center gap-4">
                              <CalendarIcon className="w-5 h-5 text-accent" />
                              <span className="text-sm font-bold text-primary">Requested Date</span>
                            </div>
                            <span className="text-sm font-bold text-slate-600">{selectedProposal.selectedDate || 'Flexible'}</span>
                          </div>
                          <div className="flex items-center justify-between bg-white p-5 rounded-[1.5rem] shadow-sm border border-border/40">
                            <div className="flex items-center gap-4">
                              <Users className="w-5 h-5 text-accent" />
                              <span className="text-sm font-bold text-primary">Group Size</span>
                            </div>
                            <span className="text-sm font-bold text-slate-600">
                              {selectedProposal.type === 'School' ? `${selectedProposal.studentCount} students` : `${selectedProposal.participants} participants`}
                            </span>
                          </div>
                        </div>
                      </section>

                      <section className="bg-white rounded-[2rem] p-6 sm:p-10 border border-border/60 shadow-xl space-y-8">
                        <h3 className="text-xl sm:text-2xl font-headline font-bold text-primary flex items-center gap-3">
                          <Send className="w-6 h-6 text-accent" /> Confirmation Studio
                        </h3>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Subject Line</Label>
                            <Input value={emailDraft.subject} onChange={e => setEmailDraft({...emailDraft, subject: e.target.value})} className="rounded-xl h-12 bg-slate-50/50 border-slate-200 font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Email Body Content</Label>
                            <Textarea value={emailDraft.body} onChange={e => setEmailDraft({...emailDraft, body: e.target.value})} className="min-h-[200px] rounded-[1.5rem] bg-slate-50/50 border-slate-200 text-sm font-body" />
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="p-4 sm:p-8 bg-white border-t flex flex-col sm:flex-row items-center justify-between shrink-0 gap-4">
                      <Button variant="ghost" className="rounded-full px-10 h-14 font-bold text-slate-400" onClick={() => setSelectedProposal(null)}>Cancel</Button>
                      <Button className="bg-accent hover:bg-accent/90 text-white rounded-full px-14 h-16 font-bold text-xl shadow-2xl shadow-accent/20 gap-4" onClick={handleSendConfirmation} disabled={isEmailing}>
                        {isEmailing ? <Loader2 className="animate-spin w-6 h-6" /> : <Send className="w-6 h-6" />}
                        Confirm & Send Email
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="admin" className="m-0 focus-visible:ring-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <Card className="rounded-3xl border-none shadow-xl bg-white sticky top-24">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-headline text-2xl text-primary">
                      {editingId ? "Edit Experience" : "New Experience"}
                    </CardTitle>
                    {editingId && (
                      <Button variant="ghost" size="icon" onClick={resetTourForm} className="rounded-full">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</Label>
                      <Input placeholder="Experience Name" value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} className="rounded-xl h-11" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price (₹)</Label>
                        <Input type="number" value={newTour.price} onChange={e => setNewTour({...newTour, price: parseInt(e.target.value) || 0})} className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Capacity</Label>
                        <Input type="number" value={newTour.capacity} onChange={e => setNewTour({...newTour, capacity: parseInt(e.target.value) || 0})} className="rounded-xl h-11" />
                      </div>
                    </div>

                    {/* SCHEDULING INTERFACE */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5" /> Date Management
                        </Label>
                        <Badge variant="outline" className="text-[9px] uppercase font-black">{newTour.scheduledDates.length} Dates</Badge>
                      </div>
                      
                      <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 space-y-4">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                          {newTour.scheduledDates.map(date => (
                            <Badge key={date} className="bg-primary/10 text-primary border-primary/20 shrink-0 gap-1.5 px-3 py-1">
                              {format(new Date(date), 'MMM d')}
                              <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setNewTour(prev => ({ ...prev, scheduledDates: prev.scheduledDates.filter(d => d !== date) }))} />
                            </Badge>
                          ))}
                          {newTour.scheduledDates.length === 0 && <span className="text-[10px] text-muted-foreground italic">No dates scheduled.</span>}
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Batch Generate (12 Months)</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" className="text-[10px] uppercase font-bold h-9 rounded-xl" onClick={() => generateDatesForDay(1)}>
                              Every Monday
                            </Button>
                            <Button variant="outline" size="sm" className="text-[10px] uppercase font-bold h-9 rounded-xl" onClick={() => generateDatesForDay(5)}>
                              Every Friday
                            </Button>
                          </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" className="w-full text-xs font-bold gap-2 text-accent hover:bg-accent/5 rounded-xl h-10 border border-dashed border-accent/30">
                              <Plus className="w-3.5 h-3.5" /> Open Date Picker
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md rounded-3xl">
                            <DialogHeader><DialogTitle>Select Workshop Dates</DialogTitle></DialogHeader>
                            <div className="p-4 flex justify-center">
                              <Calendar
                                mode="multiple"
                                selected={dateSelection}
                                onSelect={(dates) => {
                                  setDateSelection(dates || []);
                                  if (dates) {
                                    setNewTour(prev => ({
                                      ...prev,
                                      scheduledDates: dates.map(d => format(d, 'yyyy-MM-dd')).sort()
                                    }));
                                  }
                                }}
                                className="rounded-xl border shadow-sm"
                              />
                            </div>
                            <DialogFooter>
                              <Button className="w-full bg-primary rounded-full font-bold h-12" onClick={(e) => (e.target as any).closest('button[data-state="open"]')?.click()}>
                                Done Selecting
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                      <Textarea className="min-h-[100px] rounded-2xl" value={newTour.description} onChange={e => setNewTour({...newTour, description: e.target.value})} />
                    </div>

                    <Button 
                      className={cn("w-full rounded-full h-12 font-bold shadow-lg transition-all duration-500", isSuccess ? "bg-green-600" : "bg-primary")}
                      onClick={handleSaveTour}
                      disabled={isProcessing || isSuccess}
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : isSuccess ? <Check className="w-4 h-4" /> : <Save className="mr-2 h-4 w-4" />}
                      {editingId ? "Save Changes" : "Publish Experience"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-12">
                <section>
                  <Label className="text-xl font-headline font-bold text-primary mb-4 block">Visual Assets</Label>
                  <ImageLibrary selectedUrls={newTour.imageUrls} onSelect={(urls) => setNewTour(prev => ({ ...prev, imageUrls: urls }))} />
                </section>
                <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
                  <CardHeader className="bg-white border-b"><CardTitle className="font-headline text-2xl text-primary">Experience Catalog</CardTitle></CardHeader>
                  <Table>
                    <TableHeader><TableRow className="bg-muted/30">
                      <TableHead>Experience</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {tours?.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="font-bold">{t.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[9px]">{t.scheduledDates?.length || 0} Slots</Badge>
                          </TableCell>
                          <TableCell className="font-medium">₹{t.price}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" onClick={() => handleEditTour(t)}><Edit className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteDocumentNonBlocking(doc(firestore!, "tours", t.id))}><Trash2 className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="brand" className="m-0 focus-visible:ring-0">
            <div className="grid grid-cols-1 gap-12">
              <section className="space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
                  <div>
                    <h2 className="text-3xl font-headline font-bold text-primary">Brand Identity Studio</h2>
                    <p className="text-muted-foreground">Dial in the tracking and alignment for "EXPERIENCES".</p>
                  </div>
                  <Button onClick={handleSaveBrandSettings} className="bg-primary rounded-full px-10 h-14 font-bold shadow-xl gap-2 text-lg">
                    <Save className="w-5 h-5" /> Save Global Brand Layout
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden flex flex-col">
                    <CardHeader className="bg-slate-50 border-b p-8">
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="font-headline text-2xl flex items-center gap-2">
                          <Type className="w-6 h-6 text-accent" /> Navbar & Footer Layout
                        </CardTitle>
                        <Badge className="bg-accent text-white rounded-full">Light Mode</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow flex flex-col">
                      <div className="p-12 flex flex-col items-center justify-center bg-white min-h-[240px] border-b">
                        <div className="flex items-center space-x-1 mb-4">
                          <div className="relative w-10 h-10 object-contain translate-y-[1px]">
                            <img src={LOGO_URL} alt="Maroma" className="w-full h-full object-contain" />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-3xl font-headline font-bold text-primary tracking-tight leading-none uppercase">MAROMA</span>
                            <span className="text-[8px] font-body font-medium text-accent uppercase leading-none mt-0.5 relative" style={{ letterSpacing: `${localBrandSettings.navbarKerning}em`, left: `${localBrandSettings.navbarOffset}em` }}>Experiences</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 space-y-8 bg-slate-50/50">
                        <div className="space-y-6">
                          <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Letter Spacing (Kerning)</Label>
                          <Slider value={[localBrandSettings.navbarKerning]} onValueChange={([v]) => setLocalBrandSettings({...localBrandSettings, navbarKerning: v})} max={2} step={0.01} />
                        </div>
                        <div className="space-y-6">
                          <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Manual Alignment Nudge</Label>
                          <Slider value={[localBrandSettings.navbarOffset]} onValueChange={([v]) => setLocalBrandSettings({...localBrandSettings, navbarOffset: v})} min={-5} max={5} step={0.01} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 overflow-hidden flex flex-col">
                    <CardHeader className="bg-white/5 border-b border-white/5 p-8">
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="font-headline text-2xl text-white flex items-center gap-2">
                          <Activity className="w-6 h-6 text-accent" /> Loading Screen Layout
                        </CardTitle>
                        <Badge className="bg-accent text-white rounded-full">Dark Mode</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow flex flex-col">
                      <div className="p-12 flex flex-col items-center justify-center bg-primary min-h-[240px] border-b border-white/5">
                        <div className="flex items-center space-x-1 mb-6">
                          <div className="relative w-16 h-16 shrink-0 translate-y-[2px]">
                            <img src={LOGO_URL} alt="Maroma Logo" className="w-full h-full object-contain brightness-0 invert" />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-5xl font-headline font-bold text-white tracking-tight leading-none uppercase">MAROMA</span>
                            <span className="text-[12px] font-body font-medium text-accent uppercase leading-none relative mt-2" style={{ letterSpacing: `${localBrandSettings.loadingKerning}em`, left: `${localBrandSettings.loadingOffset + 0.47}em` }}>Experiences</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 space-y-8 bg-white/5">
                        <div className="space-y-6">
                          <Label className="text-xs font-bold uppercase tracking-widest text-white/50">Letter Spacing (Kerning)</Label>
                          <Slider value={[localBrandSettings.loadingKerning]} onValueChange={([v]) => setLocalBrandSettings({...localBrandSettings, loadingKerning: v})} max={2} step={0.01} className="[&>span:first-child]:bg-white/20" />
                        </div>
                        <div className="space-y-6">
                          <Label className="text-xs font-bold uppercase tracking-widest text-white/50">Manual Alignment Nudge</Label>
                          <Slider value={[localBrandSettings.loadingOffset]} onValueChange={([v]) => setLocalBrandSettings({...localBrandSettings, loadingOffset: v})} min={-5} max={5} step={0.01} className="[&>span:first-child]:bg-white/20" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="users" className="m-0 focus-visible:ring-0">
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b flex flex-row items-center justify-between p-6">
                <CardTitle className="font-headline text-2xl">User Directory</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search users..." value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} className="pl-10 rounded-full bg-muted/40 border-none h-10" />
                </div>
              </CardHeader>
              <Table>
                <TableHeader><TableRow className="bg-muted/5 h-14">
                  <TableHead className="pl-6 font-bold">User Profile</TableHead>
                  <TableHead className="font-bold">Permissions</TableHead>
                  <TableHead className="text-right pr-8 font-bold">Management</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {isUsersLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-accent" /></TableCell></TableRow>
                  ) : filteredUsers?.map(u => {
                    const isAdm = adminIds.has(u.id);
                    const isFac = facilitatorIds.has(u.id);
                    return (
                      <TableRow key={u.id} className="h-20 group">
                        <TableCell className="pl-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-primary">{u.firstName} {u.lastName}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {isAdm && <Badge className="bg-primary text-white rounded-full px-3">Admin</Badge>}
                            {isFac && <Badge className="bg-accent text-white rounded-full px-3">Facilitator</Badge>}
                            {!isAdm && !isFac && <Badge variant="outline" className="rounded-full px-3">Guest</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="rounded-full h-9 px-4" onClick={() => {
                              if (firestore) {
                                const ref = doc(firestore, "roles_admin", u.id);
                                if (isAdm) deleteDocumentNonBlocking(ref);
                                else setDocumentNonBlocking(ref, { email: u.email, role: 'admin', activatedAt: serverTimestamp() }, { merge: true });
                              }
                            }}>
                              <Shield className="w-3.5 h-3.5 mr-2" /> {isAdm ? "Revoke Admin" : "Make Admin"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="m-0 focus-visible:ring-0">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search assets..." value={mediaSearchQuery} onChange={e => setMediaSearchQuery(e.target.value)} className="pl-11 rounded-full bg-white border-border shadow-sm h-12" />
                </div>
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-accent hover:bg-accent/90 text-white rounded-full px-8 h-12 gap-2 shadow-lg"><Upload className="w-4 h-4" /> Upload New Assets</Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl">
                    <DialogHeader><DialogTitle>Upload Assets</DialogTitle></DialogHeader>
                    <div className="py-6 space-y-4">
                      <div className="border-2 border-dashed border-muted rounded-2xl p-10 text-center cursor-pointer hover:bg-muted/20 transition-all" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                        <p className="font-medium">Select Images</p>
                        <Input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={e => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                      <Button onClick={async () => {
                        if (!firestore || !user || selectedFiles.length === 0) return;
                        setIsMediaUploading(true);
                        for (const file of selectedFiles) {
                          const reader = new FileReader();
                          const dataUrl = await new Promise<string>((resolve) => {
                            reader.onload = (e) => resolve(e.target?.result as string);
                            reader.readAsDataURL(file);
                          });
                          addDocumentNonBlocking(collection(firestore, "media"), { url: dataUrl, type: 'image', altText: file.name, uploadedAt: serverTimestamp() });
                        }
                        setSelectedFiles([]);
                        setIsUploadDialogOpen(false);
                        setIsMediaUploading(false);
                        toast({ title: "Upload Complete" });
                      }} disabled={isMediaUploading || selectedFiles.length === 0} className="bg-primary rounded-full px-8">
                        {isMediaUploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />} Start Upload
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {filteredMedia?.map(m => (
                  <div key={m.id} className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-xl transition-all">
                    <NextImage src={m.url} alt={m.altText || ""} fill className="object-cover transition-transform group-hover:scale-110" unoptimized />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="icon" variant="destructive" className="rounded-full shadow-lg" onClick={() => deleteDocumentNonBlocking(doc(firestore!, "media", m.id))}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
