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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Trash2, Edit, Save, Loader2, Check, X, Users, 
  Settings, Image as ImageIcon, Search, Shield, 
  Upload, FileText, Activity, AlertCircle, Palette, Type, CalendarDays,
  Building2, GraduationCap, Mail, ExternalLink, ClipboardList, Send, Clock, 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Repeat, Wrench, Plus, Eye, EyeOff,
  UserCheck, UserPlus, Bell, User, Edit3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, useDoc } from "@/firebase";
import { collection, serverTimestamp, doc, query, orderBy } from "firebase/firestore";
import { Tour, TourType } from "@/lib/types";
import { ImageLibrary } from "@/components/admin/ImageLibrary";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { sendEmailNotification } from "@/app/actions/notifications";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, getDay, parseISO, parse } from "date-fns";

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

interface FacilitatorRole {
  id: string;
  email: string;
  name?: string;
  specialty?: string;
  activatedAt: any;
}

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());

  // Confirmation States
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'facilitator' | 'tour' | 'booking' | 'bulk-booking' | null;
    id: string | null;
    title: string | null;
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: null
  });

  const isWorkshopOwner = user?.email === "indispirit@gmail.com";
  
  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);
  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminRef);
  const isAdmin = isWorkshopOwner || !!adminDoc;

  const facilitatorsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, "roles_facilitator");
  }, [firestore, isAdmin]);
  const { data: facilitators } = useCollection<FacilitatorRole>(facilitatorsQuery);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [editingFacilitatorId, setEditingFacilitatorId] = useState<string | null>(null);

  const handleSaveFacilitator = async () => {
    if (!inviteEmail || !inviteName || !firestore) {
      toast({ variant: "destructive", title: "Missing Information", description: "Name and Email are required." });
      return;
    }
    const cleanEmail = inviteEmail.toLowerCase().trim();
    const cleanName = inviteName.trim();
    
    if (editingFacilitatorId) {
      updateDocumentNonBlocking(doc(firestore, "roles_facilitator", editingFacilitatorId), {
        email: cleanEmail,
        name: cleanName,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Facilitator Updated", description: `${cleanName}'s details have been saved.` });
    } else {
      addDocumentNonBlocking(collection(firestore, "roles_facilitator"), {
        email: cleanEmail,
        name: cleanName,
        activatedAt: serverTimestamp(),
        status: 'active'
      });

      await sendEmailNotification({
        to: cleanEmail,
        subject: "Welcome to Maroma Experiences: Team Access Granted",
        textBody: `Hello ${cleanName},\n\nYou have been onboarded as a facilitator for Maroma Experiences. You will now receive automated updates for any bookings assigned to your name.\n\nWe are excited to have you leading our campus workshops and tours!\n\nBest regards,\nMaroma Administration\nhttps://maromaexperience.com`
      });

      toast({ title: "Facilitator Added", description: `${cleanName} has been onboarded and notified.` });
    }
    
    setInviteEmail("");
    setInviteName("");
    setEditingFacilitatorId(null);
  };

  const handleEditFacilitator = (f: FacilitatorRole) => {
    setEditingFacilitatorId(f.id);
    setInviteEmail(f.email);
    setInviteName(f.name || "");
    const element = document.getElementById('facilitator-onboarding-card');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelFacilitatorEdit = () => {
    setEditingFacilitatorId(null);
    setInviteEmail("");
    setInviteName("");
  };

  const openDeleteFacilitator = (f: FacilitatorRole) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'facilitator',
      id: f.id,
      title: f.name || f.email
    });
  };

  const executeDelete = () => {
    if (!firestore || !deleteConfirm.type || (!deleteConfirm.id && deleteConfirm.type !== 'bulk-booking')) return;

    switch (deleteConfirm.type) {
      case 'facilitator':
        deleteDocumentNonBlocking(doc(firestore, "roles_facilitator", deleteConfirm.id!));
        toast({ title: "Facilitator Removed", description: `${deleteConfirm.title} has been removed from the directory.` });
        break;
      case 'tour':
        deleteDocumentNonBlocking(doc(firestore, "tours", deleteConfirm.id!));
        toast({ title: "Experience Deleted", description: `${deleteConfirm.title} removed from catalog.` });
        break;
      case 'booking':
        deleteDocumentNonBlocking(doc(firestore, "bookings", deleteConfirm.id!));
        toast({ title: "Booking Removed" });
        break;
      case 'bulk-booking':
        selectedBookingIds.forEach(id => deleteDocumentNonBlocking(doc(firestore, "bookings", id)));
        setSelectedBookingIds(new Set());
        toast({ title: "Bulk Delete Complete", description: "Selected bookings have been removed." });
        break;
    }

    setDeleteConfirm({ isOpen: false, type: null, id: null, title: null });
  };

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

  const handleNotifyFacilitator = async (targetEmail: string, eventDetails: any) => {
    if (!targetEmail) {
      toast({ variant: "destructive", title: "Assignment Required", description: "Please assign a facilitator to this experience first." });
      return;
    }

    const facilitator = facilitators?.find(f => f.email === targetEmail);
    const greetingName = facilitator?.name || "Facilitator";
    
    setIsEmailing(true);
    try {
      await sendEmailNotification({
        to: targetEmail,
        subject: `Event Reminder & Briefing: ${eventDetails.title}`,
        textBody: `Hello ${greetingName},\n\nThis is a briefing for your upcoming event at the Maroma Campus.\n\nExperience: ${eventDetails.title}\nDate: ${eventDetails.date}\nConfirmed Guests: ${eventDetails.count}\n\nPlease review your preparation list and ensure the venue is ready for arrival.\n\nWarm regards,\nMaroma Administration`
      });
      toast({ title: "Facilitator Notified", description: `Briefing sent to ${targetEmail}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Notification Failed", description: "Could not reach the facilitator." });
    } finally {
      setIsEmailing(false);
    }
  };

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
    childPrice: 0,
    capacity: 20,
    minGroupSize: 8,
    type: "workshop" as TourType,
    status: "live" as 'live' | 'coming-soon',
    isActive: true,
    imageUrls: [] as string[],
    scheduledDates: [] as string[],
    facilitatorEmail: ""
  });

  useEffect(() => {
    if (editingId || newTour.name || newTour.scheduledDates.length > 0) {
      const element = document.getElementById('save-publish-button');
      if (element) {
        const activeEl = document.activeElement;
        const isTyping = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
        if (!isTyping) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }, [newTour, editingId]);

  const [recurrence, setRecurrence] = useState({
    day: "6",
    interval: "2",
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd')
  });

  const handleGenerateRecurring = () => {
    const dayIndex = parseInt(recurrence.day);
    const intervalWeeks = parseInt(recurrence.interval);
    const parseLocal = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    const start = parseLocal(recurrence.startDate);
    const end = parseLocal(recurrence.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      toast({ variant: "destructive", title: "Invalid Range", description: "Please check your start and end dates." });
      return;
    }
    const dates: string[] = [];
    let current = new Date(start);
    while (current.getDay() !== dayIndex) {
      current.setDate(current.getDate() + 1);
    }
    while (current <= end) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current.setDate(current.getDate() + (7 * intervalWeeks));
    }
    setNewTour(prev => ({
      ...prev,
      scheduledDates: Array.from(new Set([...prev.scheduledDates, ...dates])).sort()
    }));
    toast({ title: "Recurrence Set", description: `Generated ${dates.length} occurrences.` });
  };

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "bookings"), orderBy("bookedAt", "desc"));
  }, [firestore, isAdmin]);
  const { data: bookings, isLoading: isBookingsLoading } = useCollection<BookingRecord>(bookingsQuery);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    bookings?.forEach(b => {
      const key = `${b.tourId}_${b.tourDate}`;
      map[key] = (map[key] || 0) + (b.numberOfAttendees || 0);
    });
    return map;
  }, [bookings]);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "proposals"), orderBy("createdAt", "desc"));
  }, [firestore, isAdmin]);
  const { data: proposals, isLoading: isProposalsLoading } = useCollection<ProposalRecord>(proposalsQuery);

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const calendarEvents = useMemo(() => {
    const events: { date: string, title: string, type: 'workshop' | 'school' | 'corporate' | 'draft', id: string, count: number, facilitatorEmail?: string }[] = [];
    tours?.forEach(t => {
      t.scheduledDates?.forEach(d => {
        const key = `${t.id}_${d}`;
        const count = bookingsByDate[key] || 0;
        events.push({ date: d, title: t.name, type: 'workshop', id: t.id, count, facilitatorEmail: t.facilitatorEmail });
      });
    });
    if (newTour.name && newTour.scheduledDates.length > 0) {
      newTour.scheduledDates.forEach(d => {
        const isAlreadySaved = tours?.some(t => t.id === editingId && t.scheduledDates.includes(d));
        if (!isAlreadySaved) {
          events.push({ date: d, title: `[Draft] ${newTour.name}`, type: 'draft', id: editingId || 'draft-new', count: 0 });
        }
      });
    }
    proposals?.forEach(p => {
      if (p.selectedDate) {
        let count = 0;
        if (p.type === 'School') {
          count = (parseInt(p.studentCount || "0")) + (parseInt(p.adultCount || "0"));
        } else {
          count = parseInt(p.participants || "0");
        }
        events.push({ 
          date: p.selectedDate, 
          title: p.schoolName || p.companyName || "Group Tour", 
          type: p.type === 'School' ? 'school' : 'corporate',
          id: p.id,
          count
        });
      }
    });
    return events;
  }, [tours, proposals, bookingsByDate, newTour, editingId]);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(calendarMonth), end: endOfMonth(calendarMonth) });
  }, [calendarMonth]);

  const handleCalendarEventClick = (e: any) => {
    if (e.type === 'workshop' || e.type === 'draft') {
      const tour = tours?.find(t => t.id === e.id);
      if (tour) {
        handleEditTour(tour);
        setActiveTab("admin");
      } else if (e.id === 'draft-new') {
        setActiveTab("admin");
      }
    } else {
      const proposal = proposals?.find(p => p.id === e.id);
      if (proposal) {
        handleOpenProposal(proposal);
        setActiveTab("proposals");
      }
    }
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
      childPrice: tour.childPrice || 0,
      capacity: tour.capacity || 20,
      minGroupSize: tour.minGroupSize || 8,
      type: tour.type || "workshop",
      status: tour.status || "live",
      isActive: tour.isActive ?? true,
      imageUrls: tour.imageUrls || (tour.imageUrl ? [tour.imageUrl] : []),
      scheduledDates: tour.scheduledDates || [],
      facilitatorEmail: tour.facilitatorEmail || ""
    });
    const editor = document.getElementById('tour-editor-card');
    if (editor) editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      childPrice: 0,
      capacity: 20,
      minGroupSize: 8,
      type: "workshop",
      status: "live",
      isActive: true,
      imageUrls: [],
      scheduledDates: [],
      facilitatorEmail: ""
    });
  };

  const handleSaveTour = () => {
    if (!newTour.name) {
      toast({ variant: "destructive", title: "Missing Information", description: "Experience Name is required." });
      return;
    }
    if (!firestore || !user) return;
    setIsProcessing(true);
    const tourData: Partial<Tour> = {
      ...newTour,
      updatedAt: serverTimestamp(),
      imageUrl: newTour.imageUrls[0] || `https://picsum.photos/seed/${Math.random()}/1200/800`,
    };
    if (editingId) {
      updateDocumentNonBlocking(doc(firestore, "tours", editingId), tourData);
      toast({ title: "Changes Saved" });
    } else {
      addDocumentNonBlocking(collection(firestore, "tours"), { 
        ...tourData, 
        tourOwnerId: user.uid, 
        createdAt: serverTimestamp(), 
        bookedSpaces: 0 
      });
      toast({ title: "Experience Published" });
    }
    setIsSuccess(true);
    setTimeout(() => { setIsSuccess(false); setIsProcessing(false); resetTourForm(); }, 2000);
  };

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isAdmin) return null;
    return collection(firestore, "users");
  }, [firestore, user, isAdmin]);
  const adminsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isAdmin) return null;
    return collection(firestore, "roles_admin");
  }, [firestore, user, isAdmin]);
  
  const { data: users, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: admins } = useCollection(adminsQuery);
  const adminIds = new Set(admins?.map(a => a.id) || []);

  if (isUserLoading || isAdminDocLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
        <p className="mt-4 text-muted-foreground uppercase tracking-widest text-xs">Authenticating Dashboard...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-10 text-center rounded-[2.5rem] border-none shadow-2xl bg-white">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
            <h2 className="text-3xl font-headline font-bold text-primary mb-2">Unauthorized</h2>
            <p className="text-muted-foreground">Admin access required.</p>
            <Button asChild className="w-full mt-8 bg-primary rounded-full h-12 font-bold"><Link href="/">Return Home</Link></Button>
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Unified campus management console.</p>
            </div>
            
            <div className="w-full overflow-x-auto no-scrollbar pb-4 -mb-4">
              <TabsList className="bg-white p-1 h-14 rounded-full shadow-lg border border-border/50 min-w-max flex">
                <TabsTrigger value="calendar" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <CalendarIcon className="w-5 h-5" /> Calendar
                </TabsTrigger>
                <TabsTrigger value="bookings" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <CalendarDays className="w-5 h-5" /> Bookings
                </TabsTrigger>
                <TabsTrigger value="proposals" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <ClipboardList className="w-5 h-5" /> Requests
                </TabsTrigger>
                <TabsTrigger value="facilitators" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <UserCheck className="w-5 h-5" /> Facilitators
                </TabsTrigger>
                <TabsTrigger value="users" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Users className="w-5 h-5" /> Users
                </TabsTrigger>
                <TabsTrigger value="admin" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Settings className="w-5 h-5" /> Experiences
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="calendar" className="m-0 focus-visible:ring-0">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-white border-b px-8 py-6 flex flex-row items-center justify-between">
                <CardTitle className="font-headline text-2xl text-primary">Campus Activity Calendar</CardTitle>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" className="rounded-full" onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}><ChevronLeft className="w-4 h-4" /></Button>
                  <span className="font-headline font-bold text-xl min-w-[140px] text-center">{format(calendarMonth, 'MMMM yyyy')}</span>
                  <Button variant="outline" size="icon" className="rounded-full" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-slate-50 py-3 text-center text-[10px] font-bold uppercase text-slate-500">{day}</div>
                  ))}
                  {Array.from({ length: getDay(startOfMonth(calendarMonth)) }).map((_, i) => (<div key={`empty-${i}`} className="bg-white/50 h-32" />))}
                  {daysInMonth.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const events = calendarEvents.filter(e => e.date === dayStr);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div key={dayStr} className={cn("bg-white p-3 h-32 border-t border-slate-100 flex flex-col gap-1 transition-colors hover:bg-slate-50", isToday && "bg-accent/5")}>
                        <span className={cn("text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1", isToday ? "bg-accent text-white" : "text-slate-400")}>{format(day, 'd')}</span>
                        <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
                          {events.map((e, idx) => (
                            <div 
                              key={`${e.id}-${idx}`} 
                              className={cn(
                                "text-[9px] font-bold px-2 py-1 rounded-lg border truncate uppercase tracking-tighter cursor-pointer hover:shadow-md transition-all flex flex-col gap-0.5",
                                e.type === 'workshop' ? "bg-blue-600 text-white border-blue-700" :
                                e.type === 'school' ? "bg-purple-600 text-white border-purple-700" :
                                e.type === 'corporate' ? "bg-emerald-600 text-white border-emerald-700" :
                                "bg-slate-100 text-slate-500 border-dashed"
                              )}
                              onClick={() => handleCalendarEventClick(e)}
                            >
                              <div className="flex justify-between items-center gap-1">
                                <span className="truncate">{e.title}</span>
                                <span className="shrink-0 opacity-80">({e.count})</span>
                              </div>
                              {e.facilitatorEmail && (
                                <button 
                                  onClick={(ev) => { ev.stopPropagation(); handleNotifyFacilitator(e.facilitatorEmail!, e); }}
                                  className="mt-1 bg-white/20 hover:bg-white/40 text-white rounded px-1 py-0.5 flex items-center gap-1 text-[7px]"
                                >
                                  <Bell className="w-2 h-2" /> Send Reminder
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facilitators" className="m-0 focus-visible:ring-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <Card id="facilitator-onboarding-card" className="rounded-3xl border-none shadow-xl bg-white sticky top-24">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-headline text-2xl text-primary">
                      {editingFacilitatorId ? "Edit Facilitator" : "Onboard Facilitator"}
                    </CardTitle>
                    {editingFacilitatorId && (
                      <Button variant="ghost" size="icon" onClick={cancelFacilitatorEdit} className="rounded-full">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="e.g. John Doe" 
                            value={inviteName} 
                            onChange={e => setInviteName(e.target.value)} 
                            className="pl-10 rounded-xl h-12" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="facilitator@maroma.com" 
                            value={inviteEmail} 
                            onChange={e => setInviteEmail(e.target.value)} 
                            className="pl-10 rounded-xl h-12" 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        className="w-full rounded-full h-12 font-bold bg-accent hover:bg-accent/90 gap-2"
                        onClick={handleSaveFacilitator}
                        disabled={!inviteEmail || !inviteName}
                      >
                        {editingFacilitatorId ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {editingFacilitatorId ? "Update Facilitator" : "Grant Facilitator Access"}
                      </Button>
                      {editingFacilitatorId && (
                        <Button variant="outline" className="w-full rounded-full h-12 font-bold" onClick={cancelFacilitatorEdit}>
                          Cancel Edit
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center font-bold uppercase">This member will appear in Experience assignments.</p>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
                  <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
                    <CardTitle className="font-headline text-2xl text-primary">Facilitator Directory</CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">{facilitators?.length || 0} Members</Badge>
                  </CardHeader>
                  <Table>
                    <TableHeader><TableRow className="bg-muted/30">
                      <TableHead>Facilitator</TableHead>
                      <TableHead>Added On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {facilitators?.map(f => (
                        <TableRow key={f.id} className="group hover:bg-muted/5">
                          <TableCell className="font-bold text-primary">
                            <div className="flex flex-col">
                              <span>{f.name || 'Anonymous'}</span>
                              <span className="text-[10px] text-muted-foreground font-normal">{f.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {f.activatedAt ? format(f.activatedAt.toDate(), 'MMM d, yyyy') : 'Recently'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="rounded-full text-muted-foreground hover:text-accent"
                                onClick={() => handleEditFacilitator(f)}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="rounded-full text-muted-foreground hover:text-destructive"
                                onClick={(e) => { 
                                  e.preventDefault();
                                  e.stopPropagation(); 
                                  openDeleteFacilitator(f); 
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!facilitators || facilitators.length === 0) && (
                        <TableRow><TableCell colSpan={3} className="text-center py-12 text-muted-foreground">No facilitators registered yet.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="m-0 focus-visible:ring-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <Card id="tour-editor-card" className="rounded-3xl border-none shadow-xl bg-white sticky top-24">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-headline text-2xl text-primary">{editingId ? "Edit Experience" : "New Experience"}</CardTitle>
                    {editingId && <Button variant="ghost" size="icon" onClick={resetTourForm} className="rounded-full"><X className="w-4 h-4" /></Button>}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">{newTour.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} Visibility</Label>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{newTour.isActive ? "Live on website" : "Hidden"}</p>
                      </div>
                      <Switch checked={newTour.isActive} onCheckedChange={v => setNewTour({...newTour, isActive: v})} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Experience Name</Label>
                      <Input placeholder="e.g., The Maroma Tour" value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} className="rounded-xl h-11" required />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <UserCheck className="w-3 h-3" /> Assigned Facilitator
                      </Label>
                      <Select 
                        value={newTour.facilitatorEmail} 
                        onValueChange={v => setNewTour({...newTour, facilitatorEmail: v})}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                          <SelectValue placeholder="Select Facilitator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {facilitators?.map(f => (
                            <SelectItem key={f.id} value={f.email}>{f.name || f.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Price (₹)</Label><Input type="number" value={newTour.price} onChange={e => setNewTour({...newTour, price: parseInt(e.target.value) || 0})} className="rounded-xl" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Child Price</Label><Input type="number" value={newTour.childPrice} onChange={e => setNewTour({...newTour, childPrice: parseInt(e.target.value) || 0})} className="rounded-xl" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Capacity</Label><Input type="number" value={newTour.capacity} onChange={e => setNewTour({...newTour, capacity: parseInt(e.target.value) || 0})} className="rounded-xl" /></div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2"><CalendarIcon className="w-3.5 h-3.5" /> Frequency Engine</Label>
                      <div className="p-5 bg-muted/20 rounded-2xl border border-border/50 space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                          <Select value={recurrence.day} onValueChange={v => setRecurrence({...recurrence, day: v})}><SelectTrigger className="h-10 text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (<SelectItem key={i} value={i.toString()}>{d}</SelectItem>))}</SelectContent></Select>
                          <Select value={recurrence.interval} onValueChange={v => setRecurrence({...recurrence, interval: v})}><SelectTrigger className="h-10 text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1 Week</SelectItem><SelectItem value="2">2 Weeks</SelectItem></SelectContent></Select>
                        </div>
                        <Button className="w-full bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-bold text-[10px] uppercase gap-2" onClick={handleGenerateRecurring}><Repeat className="w-3.5 h-3.5" /> Generate Slots</Button>
                      </div>
                    </div>

                    <Button id="save-publish-button" className={cn("w-full rounded-full h-12 font-bold shadow-lg transition-all", isSuccess ? "bg-green-600" : "bg-primary")} onClick={handleSaveTour} disabled={isProcessing || isSuccess}>
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
                      <TableHead>Facilitator</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {tours?.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="font-bold">{t.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {facilitators?.find(f => f.email === t.facilitatorEmail)?.name || t.facilitatorEmail || 'Unassigned'}
                          </TableCell>
                          <TableCell>{t.isActive ? <Badge className="bg-green-100 text-green-700">Active</Badge> : <Badge variant="outline">Hidden</Badge>}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleEditTour(t)}><Edit className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => setDeleteConfirm({ isOpen: true, type: 'tour', id: t.id, title: t.name })}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="m-0 focus-visible:ring-0">
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b px-8 py-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-2xl text-primary">Individual Bookings</CardTitle>
                  <p className="text-sm text-muted-foreground">Standard workshop reservations.</p>
                </div>
                {selectedBookingIds.size > 0 && (
                  <Button variant="destructive" size="sm" className="rounded-full px-6 gap-2 font-bold" onClick={() => setDeleteConfirm({ isOpen: true, type: 'bulk-booking', id: null, title: `${selectedBookingIds.size} bookings` })}>
                    <Trash2 className="w-4 h-4" /> Delete Selected ({selectedBookingIds.size})
                  </Button>
                )}
              </CardHeader>
              <Table>
                <TableHeader><TableRow className="bg-muted/30">
                  <TableHead className="w-12"><Checkbox checked={bookings && bookings.length > 0 && selectedBookingIds.size === bookings.length} onCheckedChange={() => {
                    if(selectedBookingIds.size === bookings?.length) setSelectedBookingIds(new Set());
                    else setSelectedBookingIds(new Set(bookings?.map(b => b.id)));
                  }} /></TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {bookings?.map(b => (
                    <TableRow key={b.id}>
                      <TableCell><Checkbox checked={selectedBookingIds.has(b.id)} onCheckedChange={() => {
                        const next = new Set(selectedBookingIds);
                        if(next.has(b.id)) next.delete(b.id); else next.add(b.id);
                        setSelectedBookingIds(next);
                      }} /></TableCell>
                      <TableCell className="font-bold">{b.tourName}</TableCell>
                      <TableCell>{b.numberOfAttendees}</TableCell>
                      <TableCell><Badge className="bg-green-100 text-green-700">{b.bookingStatus}</Badge></TableCell>
                      <TableCell className="text-xs">{b.tourDate}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => setDeleteConfirm({ isOpen: true, type: 'booking', id: b.id, title: `booking for ${b.tourName}` })}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="proposals" className="m-0 focus-visible:ring-0">
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b px-8 py-6"><CardTitle className="font-headline text-2xl text-primary">Group & Corporate Requests</CardTitle></CardHeader>
              <Table>
                <TableHeader><TableRow className="bg-muted/30"><TableHead>Organization</TableHead><TableHead>Contact</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {proposals?.map(p => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/10" onClick={() => handleOpenProposal(p)}>
                      <TableCell className="font-bold">{p.schoolName || p.companyName}</TableCell>
                      <TableCell className="text-xs">{p.contactName}</TableCell>
                      <TableCell className="text-xs font-medium">{p.selectedDate || "Flexible"}</TableCell>
                      <TableCell><Badge className={p.status === 'approved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{p.status}</Badge></TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" onClick={() => handleOpenProposal(p)}><ExternalLink className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="m-0 focus-visible:ring-0">
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b flex flex-row items-center justify-between p-6">
                <CardTitle className="font-headline text-2xl">User Directory</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader><TableRow className="bg-muted/5"><TableHead className="pl-6">Profile</TableHead><TableHead>Permissions</TableHead><TableHead className="text-right pr-8">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users?.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="pl-6"><div className="flex flex-col"><span className="font-bold">{u.firstName} {u.lastName}</span><span className="text-xs text-muted-foreground">{u.email}</span></div></TableCell>
                      <TableCell>{adminIds.has(u.id) ? <Badge className="bg-primary text-white">Admin</Badge> : <Badge variant="outline">Guest</Badge>}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button size="sm" variant="outline" onClick={() => {
                          const ref = doc(firestore, "roles_admin", u.id);
                          if (adminIds.has(u.id)) {
                            deleteDocumentNonBlocking(ref);
                            toast({ title: "Admin Rights Revoked", description: `${u.email} is no longer an administrator.` });
                          } else {
                            setDocumentNonBlocking(ref, { email: u.email, role: 'admin', activatedAt: serverTimestamp() }, { merge: true });
                            toast({ title: "Admin Assigned", description: `${u.email} now has full dashboard access.` });
                          }
                        }}>
                          <Shield className="w-3.5 h-3.5 mr-2" /> {adminIds.has(u.id) ? "Revoke Admin" : "Make Admin"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      {/* Confirmation Dialogs */}
      <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(open) => !open && setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-headline text-primary">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. You are about to permanently remove <strong>{deleteConfirm.title}</strong> from the campus records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeDelete} 
              className="bg-destructive hover:bg-destructive/90 text-white rounded-full font-bold"
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedProposal} onOpenChange={open => !open && setSelectedProposal(null)}>
        <DialogContent className="w-[95vw] sm:max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          {selectedProposal && (
            <div className="flex flex-col h-[85vh]">
              <div className="bg-primary p-10 text-white shrink-0">
                <h2 className="text-3xl font-headline font-bold mb-4">{selectedProposal.schoolName || selectedProposal.companyName}</h2>
                <div className="flex gap-8 text-sm opacity-80">
                  <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {selectedProposal.contactName}</span>
                  <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {selectedProposal.email}</span>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto p-10 bg-slate-50 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Requested Date</Label>
                    <p className="text-lg font-bold text-primary">{selectedProposal.selectedDate || 'Flexible'}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Group Size</Label>
                    <p className="text-lg font-bold text-primary">{selectedProposal.participants || selectedProposal.studentCount} Pax</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-bold uppercase text-slate-500">Draft Confirmation Email</Label>
                  <Input value={emailDraft.subject} onChange={e => setEmailDraft({...emailDraft, subject: e.target.value})} className="rounded-xl font-bold" />
                  <Textarea value={emailDraft.body} onChange={e => setEmailDraft({...emailDraft, body: e.target.value})} className="min-h-[200px] rounded-2xl" />
                </div>
              </div>
              <div className="p-8 border-t bg-white flex justify-between">
                <Button variant="ghost" onClick={() => setSelectedProposal(null)}>Cancel</Button>
                <Button className="bg-accent rounded-full px-10 h-14 font-bold gap-3" onClick={handleSendConfirmation} disabled={isEmailing}>
                  {isEmailing ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />} Send Confirmation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}