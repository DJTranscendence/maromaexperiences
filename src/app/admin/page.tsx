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
  UserCheck, UserPlus, Bell, User, Edit3, CheckCircle2, Sparkles, UserX, Trash, Lock,
  CheckSquare, Filter, RefreshCcw
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
  isSignedUp?: boolean;
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
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedProposalIds, setSelectedProposalIds] = useState<Set<string>>(new Set());

  // Confirmation States
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'facilitator' | 'tour' | 'booking' | 'bulk-booking' | 'bulk-user' | 'proposal' | 'bulk-proposal' | null;
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

  // Facilitators
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
    if (!firestore || !deleteConfirm.type) return;

    switch (deleteConfirm.type) {
      case 'facilitator':
        if (deleteConfirm.id) {
          deleteDocumentNonBlocking(doc(firestore, "roles_facilitator", deleteConfirm.id));
          toast({ title: "Facilitator Removed", description: `${deleteConfirm.title} has been removed from the directory.` });
        }
        break;
      case 'tour':
        if (deleteConfirm.id) {
          deleteDocumentNonBlocking(doc(firestore, "tours", deleteConfirm.id));
          toast({ title: "Experience Deleted", description: `${deleteConfirm.title} removed from catalog.` });
        }
        break;
      case 'booking':
        if (deleteConfirm.id) {
          deleteDocumentNonBlocking(doc(firestore, "bookings", deleteConfirm.id));
          toast({ title: "Booking Removed" });
        }
        break;
      case 'bulk-booking':
        selectedBookingIds.forEach(id => deleteDocumentNonBlocking(doc(firestore, "bookings", id)));
        setSelectedBookingIds(new Set());
        toast({ title: "Bulk Delete Complete", description: "Selected bookings have been removed." });
        break;
      case 'proposal':
        if (deleteConfirm.id) {
          deleteDocumentNonBlocking(doc(firestore, "proposals", deleteConfirm.id));
          toast({ title: "Proposal Purged" });
        }
        break;
      case 'bulk-proposal':
        selectedProposalIds.forEach(id => deleteDocumentNonBlocking(doc(firestore, "proposals", id)));
        setSelectedProposalIds(new Set());
        toast({ title: "Proposals Purged" });
        break;
      case 'bulk-user':
        const facilitatorEmailsSet = new Set(facilitators?.map(f => f.email.toLowerCase()) || []);
        selectedUserIds.forEach(id => {
          const profile = users?.find(u => u.id === id);
          const isProtected = profile?.email === "indispirit@gmail.com" || adminIds.has(id) || (profile && facilitatorEmailsSet.has(profile.email.toLowerCase()));
          
          if (!isProtected) {
            deleteDocumentNonBlocking(doc(firestore, "users", id));
            if (adminIds.has(id)) {
              deleteDocumentNonBlocking(doc(firestore, "roles_admin", id));
            }
          }
        });
        setSelectedUserIds(new Set());
        toast({ title: "Bulk Delete Complete", description: "Targeted guest profiles have been removed. Team members were preserved." });
        break;
    }

    setDeleteConfirm({ isOpen: false, type: null, id: null, title: null });
  };

  // Tours
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
    bookedSpaces: 0,
    type: "workshop" as TourType,
    status: "live" as 'live' | 'coming-soon',
    isActive: true,
    imageUrls: [] as string[],
    scheduledDates: [] as string[],
    facilitatorEmail: "",
    facilitatorAssignments: {} as Record<string, string>
  });

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
    
    const newAssignments = { ...newTour.facilitatorAssignments };
    dates.forEach(d => {
      if (!newAssignments[d] && newTour.facilitatorEmail) {
        newAssignments[d] = newTour.facilitatorEmail;
      }
    });

    setNewTour(prev => ({
      ...prev,
      scheduledDates: Array.from(new Set([...prev.scheduledDates, ...dates])).sort(),
      facilitatorAssignments: newAssignments
    }));
    toast({ title: "Recurrence Set", description: `Generated ${dates.length} occurrences.` });
  };

  const handleRemoveDate = (date: string) => {
    const nextDates = newTour.scheduledDates.filter(d => d !== date);
    const nextAssignments = { ...newTour.facilitatorAssignments };
    delete nextAssignments[date];
    setNewTour({ ...newTour, scheduledDates: nextDates, facilitatorAssignments: nextAssignments });
  };

  const handleUpdateDateFacilitator = (date: string, email: string) => {
    setNewTour({
      ...newTour,
      facilitatorAssignments: {
        ...newTour.facilitatorAssignments,
        [date]: email
      }
    });
  };

  // Bookings
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

  // Proposals
  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "proposals"), orderBy("createdAt", "desc"));
  }, [firestore, isAdmin]);
  const { data: proposals, isLoading: isProposalsLoading } = useCollection<ProposalRecord>(proposalsQuery);

  // Calendar
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const calendarEvents = useMemo(() => {
    const events: { date: string, title: string, type: 'workshop' | 'school' | 'corporate' | 'draft', id: string, count: number, facilitatorEmail?: string }[] = [];
    tours?.forEach(t => {
      t.scheduledDates?.forEach(d => {
        const key = `${t.id}_${d}`;
        const count = bookingsByDate[key] || 0;
        const facilitator = t.facilitatorAssignments?.[d] || t.facilitatorEmail;
        events.push({ date: d, title: t.name, type: 'workshop', id: t.id, count, facilitatorEmail: facilitator });
      });
    });
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
  }, [tours, proposals, bookingsByDate]);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(calendarMonth), end: endOfMonth(calendarMonth) });
  }, [calendarMonth]);

  // Users
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

  const combinedUsers = useMemo(() => {
    if (!users) return [];
    const list = [...users].map(u => ({ ...u, isSignedUp: true }));
    
    facilitators?.forEach(f => {
      const exists = list.some(u => u.email.toLowerCase() === f.email.toLowerCase());
      if (!exists) {
        list.push({
          id: f.id,
          firstName: f.name || "Facilitator",
          lastName: "(Pending Signup)",
          email: f.email,
          isSignedUp: false
        } as any);
      }
    });
    
    return list;
  }, [users, facilitators]);

  const handleSelectAllGuests = () => {
    const facilitatorEmailsSet = new Set(facilitators?.map(f => f.email.toLowerCase()) || []);
    const guestIds = combinedUsers
      ?.filter(u => u.email !== "indispirit@gmail.com" && !adminIds.has(u.id) && !facilitatorEmailsSet.has(u.email.toLowerCase()))
      .map(u => u.id) || [];
    setSelectedUserIds(new Set(guestIds));
    toast({ title: "Guests Selected", description: `${guestIds.length} guest profiles have been marked for action.` });
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
      bookedSpaces: tour.bookedSpaces || 0,
      type: tour.type || "workshop",
      status: tour.status || "live",
      isActive: tour.isActive ?? true,
      imageUrls: tour.imageUrls || (tour.imageUrl ? [tour.imageUrl] : []),
      scheduledDates: tour.scheduledDates || [],
      facilitatorEmail: tour.facilitatorEmail || "",
      facilitatorAssignments: tour.facilitatorAssignments || {}
    });
    const editor = document.getElementById('tour-editor-card');
    if (editor) editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        createdAt: serverTimestamp()
      });
      toast({ title: "Experience Published" });
    }
    setIsSuccess(true);
    setTimeout(() => { setIsSuccess(false); setIsProcessing(false); }, 2000);
  };

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
                            >
                              <div className="flex justify-between items-center gap-1">
                                <span className="truncate">{e.title}</span>
                                <span className="shrink-0 opacity-80">({e.count})</span>
                              </div>
                              {e.facilitatorEmail && e.facilitatorEmail !== 'none' && (
                                <div className="flex items-center justify-between gap-1 mt-1">
                                  <span className="text-[7px] opacity-70 truncate">By {facilitators?.find(f => f.email === e.facilitatorEmail)?.name || e.facilitatorEmail}</span>
                                </div>
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

          <TabsContent value="bookings" className="m-0 focus-visible:ring-0">
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b flex flex-col md:flex-row md:items-center justify-between p-8 gap-4">
                <div>
                  <CardTitle className="font-headline text-2xl">Campus Bookings</CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">Manage individual and group workshop registrations.</p>
                </div>
                {selectedBookingIds.size > 0 && (
                  <Button variant="destructive" size="sm" className="rounded-full px-6 gap-2 font-bold" onClick={() => setDeleteConfirm({ isOpen: true, type: 'bulk-booking', id: null, title: `${selectedBookingIds.size} bookings` })}>
                    <Trash2 className="w-4 h-4" /> Delete Selected ({selectedBookingIds.size})
                  </Button>
                )}
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/5">
                    <TableHead className="w-12 pl-8">
                      <Checkbox 
                        checked={bookings && bookings.length > 0 && selectedBookingIds.size === bookings.length} 
                        onCheckedChange={() => {
                          if (selectedBookingIds.size === bookings?.length) setSelectedBookingIds(new Set());
                          else setSelectedBookingIds(new Set(bookings?.map(b => b.id)));
                        }} 
                      />
                    </TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead>Total (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isBookingsLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-accent" /></TableCell></TableRow>
                  ) : bookings && bookings.length > 0 ? (
                    bookings.map(b => (
                      <TableRow key={b.id} className="group hover:bg-muted/5">
                        <TableCell className="pl-8">
                          <Checkbox checked={selectedBookingIds.has(b.id)} onCheckedChange={() => {
                            const next = new Set(selectedBookingIds);
                            if(next.has(b.id)) next.delete(b.id); else next.add(b.id);
                            setSelectedBookingIds(next);
                          }} />
                        </TableCell>
                        <TableCell className="font-bold text-primary">{b.tourName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{b.tourDate}</TableCell>
                        <TableCell className="text-sm font-medium">{b.numberOfAttendees} Person(s)</TableCell>
                        <TableCell className="text-sm font-bold">₹{b.totalPrice}</TableCell>
                        <TableCell>
                          <Select 
                            value={b.bookingStatus} 
                            onValueChange={(v) => {
                              if(firestore) updateDocumentNonBlocking(doc(firestore, "bookings", b.id), { bookingStatus: v });
                              toast({ title: "Status Updated", description: `Booking for ${b.tourName} is now ${v}.` });
                            }}
                          >
                            <SelectTrigger className={cn("h-8 text-[10px] uppercase font-bold px-3 rounded-full border-none w-28", b.bookingStatus === 'confirmed' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button size="icon" variant="ghost" className="text-destructive rounded-full" onClick={() => setDeleteConfirm({ isOpen: true, type: 'booking', id: b.id, title: `Booking for ${b.tourName}` })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground">No bookings found in the database.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="proposals" className="m-0 focus-visible:ring-0">
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b flex flex-col md:flex-row md:items-center justify-between p-8 gap-4">
                <div>
                  <CardTitle className="font-headline text-2xl">Experience Inquiries</CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">Review and manage corporate and school workshop requests.</p>
                </div>
                {selectedProposalIds.size > 0 && (
                  <Button variant="destructive" size="sm" className="rounded-full px-6 gap-2 font-bold" onClick={() => setDeleteConfirm({ isOpen: true, type: 'bulk-proposal', id: null, title: `${selectedProposalIds.size} inquiries` })}>
                    <Trash2 className="w-4 h-4" /> Delete Selected ({selectedProposalIds.size})
                  </Button>
                )}
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/5">
                    <TableHead className="w-12 pl-8">
                      <Checkbox 
                        checked={proposals && proposals.length > 0 && selectedProposalIds.size === proposals.length} 
                        onCheckedChange={() => {
                          if (selectedProposalIds.size === proposals?.length) setSelectedProposalIds(new Set());
                          else setSelectedProposalIds(new Set(proposals?.map(p => p.id)));
                        }} 
                      />
                    </TableHead>
                    <TableHead>Organization / Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Proposed Date</TableHead>
                    <TableHead>Itinerary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isProposalsLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-accent" /></TableCell></TableRow>
                  ) : proposals && proposals.length > 0 ? (
                    proposals.map(p => (
                      <TableRow key={p.id} className="group hover:bg-muted/5">
                        <TableCell className="pl-8">
                          <Checkbox checked={selectedProposalIds.has(p.id)} onCheckedChange={() => {
                            const next = new Set(selectedProposalIds);
                            if(next.has(p.id)) next.delete(p.id); else next.add(p.id);
                            setSelectedProposalIds(next);
                          }} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-primary">{p.companyName || p.schoolName || 'Individual Group'}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{p.contactName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-3">
                            {p.type || 'Corporate'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-600">{p.selectedDate || 'Flexible'}</TableCell>
                        <TableCell>
                          <div className="text-[10px] text-muted-foreground max-w-[150px] truncate">
                            {p.itinerary?.map(i => i.name).join(', ') || 'Custom'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={p.status} 
                            onValueChange={(v) => {
                              if(firestore) updateDocumentNonBlocking(doc(firestore, "proposals", p.id), { status: v });
                              toast({ title: "Inquiry Updated", description: `Status set to ${v}.` });
                            }}
                          >
                            <SelectTrigger className={cn("h-8 text-[10px] uppercase font-bold px-3 rounded-full border-none w-28", p.status === 'sent' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Reviewing</SelectItem>
                              <SelectItem value="sent">Proposal Sent</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="cancelled">Declined</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button size="icon" variant="ghost" className="text-destructive rounded-full" onClick={() => setDeleteConfirm({ isOpen: true, type: 'proposal', id: p.id, title: `Inquiry from ${p.contactName}` })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground">No active inquiries found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
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
                              <Button size="icon" variant="ghost" className="rounded-full" onClick={() => handleEditFacilitator(f)}><Edit3 className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost" className="rounded-full text-destructive" onClick={() => openDeleteFacilitator(f)}><Trash2 className="w-4 h-4" /></Button>
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

          <TabsContent value="users" className="m-0 focus-visible:ring-0">
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                <div className="flex items-center gap-4">
                  <CardTitle className="font-headline text-2xl">User Directory</CardTitle>
                  <Badge variant="outline" className="font-mono text-xs">{combinedUsers.length} Profiles</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" size="sm" className="rounded-full px-6 gap-2 font-bold border-accent text-accent" onClick={handleSelectAllGuests}><CheckSquare className="w-4 h-4" /> Select All Guests</Button>
                  {selectedUserIds.size > 0 && (
                    <Button variant="destructive" size="sm" className="rounded-full px-6 gap-2 font-bold" onClick={() => setDeleteConfirm({ isOpen: true, type: 'bulk-user', id: null, title: `${selectedUserIds.size} guest profiles` })}><Trash2 className="w-4 h-4" /> Delete Selected ({selectedUserIds.size})</Button>
                  )}
                </div>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/5">
                    <TableHead className="w-12 pl-6">
                      <Checkbox 
                        checked={combinedUsers.length > 0 && selectedUserIds.size === combinedUsers.filter(u => {
                          const isFacilitator = facilitators?.some(f => f.email.toLowerCase() === u.email.toLowerCase());
                          return u.email !== "indispirit@gmail.com" && !adminIds.has(u.id) && !isFacilitator;
                        }).length} 
                        onCheckedChange={() => {
                          const facilitatorEmailsSet = new Set(facilitators?.map(f => f.email.toLowerCase()) || []);
                          const allNonProtectedIds = combinedUsers?.filter(u => 
                            u.email !== "indispirit@gmail.com" && 
                            !adminIds.has(u.id) && 
                            !facilitatorEmailsSet.has(u.email.toLowerCase())
                          ).map(u => u.id) || [];
                          if(selectedUserIds.size === allNonProtectedIds.length) setSelectedUserIds(new Set());
                          else setSelectedUserIds(new Set(allNonProtectedIds));
                        }} 
                      />
                    </TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combinedUsers.map(u => {
                    const isFacilitator = facilitators?.some(f => f.email.toLowerCase() === u.email.toLowerCase());
                    const isProtected = u.email === "indispirit@gmail.com" || adminIds.has(u.id) || isFacilitator;
                    return (
                      <TableRow key={u.id} className={cn(isProtected && "bg-slate-50/50")}>
                        <TableCell className="pl-6">
                          {isProtected ? (
                            <div className="w-4 h-4 flex items-center justify-center text-muted-foreground/40"><Lock className="w-3 h-3" /></div>
                          ) : (
                            <Checkbox checked={selectedUserIds.has(u.id)} onCheckedChange={() => {
                              const next = new Set(selectedUserIds);
                              if(next.has(u.id)) next.delete(u.id); else next.add(u.id);
                              setSelectedUserIds(next);
                            }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold flex items-center gap-2">
                              {u.firstName} {u.lastName}
                              {isProtected && <Lock className="w-3 h-3 text-accent" />}
                            </span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5 flex-wrap">
                            {adminIds.has(u.id) && <Badge className="bg-primary text-white">Admin</Badge>}
                            {isFacilitator && <Badge className="bg-accent text-white">Facilitator</Badge>}
                            {!isProtected && <Badge variant="outline">Guest</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {u.isSignedUp ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              disabled={u.email === "indispirit@gmail.com"}
                              onClick={() => {
                                const ref = doc(firestore, "roles_admin", u.id);
                                if (adminIds.has(u.id)) {
                                  deleteDocumentNonBlocking(ref);
                                  toast({ title: "Admin Rights Revoked" });
                                } else {
                                  setDocumentNonBlocking(ref, { email: u.email, role: 'admin', activatedAt: serverTimestamp() }, { merge: true });
                                  toast({ title: "Admin Assigned" });
                                }
                              }}
                            >
                              <Shield className="w-3.5 h-3.5 mr-2" /> {adminIds.has(u.id) ? "Revoke Admin" : "Make Admin"}
                            </Button>
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3">Team Access Active</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="m-0 focus-visible:ring-0 space-y-12">
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b"><CardTitle className="font-headline text-2xl text-primary">Experience Catalog</CardTitle></CardHeader>
              <Table>
                <TableHeader><TableRow className="bg-muted/30">
                  <TableHead>Experience</TableHead>
                  <TableHead>Primary Lead</TableHead>
                  <TableHead>Booked</TableHead>
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
                      <TableCell className="text-xs font-bold text-primary">
                        {t.bookedSpaces || 0} / {t.capacity}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5 flex-wrap">
                          {t.isActive ? <Badge className="bg-green-100 text-green-700">Visible</Badge> : <Badge variant="outline">Hidden</Badge>}
                          {t.status === 'live' ? <Badge className="bg-blue-100 text-blue-700">Live</Badge> : <Badge className="bg-orange-100 text-orange-700">Soon</Badge>}
                        </div>
                      </TableCell>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <Card id="tour-editor-card" className="rounded-3xl border-none shadow-xl bg-white sticky top-24">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-headline text-2xl text-primary">{editingId ? "Edit Experience" : "New Experience"}</CardTitle>
                    {editingId && <Button variant="ghost" size="icon" onClick={() => setEditingId(null)} className="rounded-full"><X className="w-4 h-4" /></Button>}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">{newTour.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} Visibility</Label>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">{newTour.isActive ? "Live on website" : "Hidden"}</p>
                        </div>
                        <Switch checked={newTour.isActive} onCheckedChange={v => setNewTour({...newTour, isActive: v})} className="data-[state=checked]:bg-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">{newTour.status === 'live' ? <CheckCircle2 className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />} Launch Status</Label>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">{newTour.status === 'live' ? "Live" : "Coming Soon"}</p>
                        </div>
                        <Switch checked={newTour.status === 'live'} onCheckedChange={v => setNewTour({...newTour, status: v ? 'live' : 'coming-soon'})} className="data-[state=checked]:bg-green-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Experience Name</Label>
                      <Input placeholder="e.g., The Maroma Tour" value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} className="rounded-xl h-11" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2"><UserCheck className="w-3 h-3" /> Default Facilitator</Label>
                      <Select value={newTour.facilitatorEmail} onValueChange={v => setNewTour({...newTour, facilitatorEmail: v})}>
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50"><SelectValue placeholder="Select Facilitator" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {facilitators?.map(f => <SelectItem key={f.id} value={f.email}>{f.name || f.email}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Price (₹)</Label><Input type="number" value={newTour.price} onChange={e => setNewTour({...newTour, price: parseInt(e.target.value) || 0})} className="rounded-xl" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Capacity</Label><Input type="number" value={newTour.capacity} onChange={e => setNewTour({...newTour, capacity: parseInt(e.target.value) || 0})} className="rounded-xl" /></div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Booked</Label>
                        <div className="flex gap-1">
                          <Input type="number" value={newTour.bookedSpaces} onChange={e => setNewTour({...newTour, bookedSpaces: parseInt(e.target.value) || 0})} className="rounded-xl" />
                          <Button variant="outline" size="icon" className="rounded-xl shrink-0 h-10 w-10" onClick={() => setNewTour({...newTour, bookedSpaces: 0})} title="Reset counter to 0">
                            <RefreshCcw className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
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
                    <Button className={cn("w-full rounded-full h-12 font-bold shadow-lg", isSuccess ? "bg-green-600" : "bg-primary")} onClick={handleSaveTour} disabled={isProcessing || isSuccess}>
                      {isProcessing ? <Loader2 className="animate-spin" /> : isSuccess ? <Check className="w-4 h-4" /> : <Save className="mr-2 h-4 w-4" />}
                      {editingId ? "Save Changes" : "Publish Experience"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-12">
                <section>
                  <Label className="text-xl font-headline font-bold text-primary mb-6 block">Schedule & Staffing</Label>
                  <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/30"><TableHead>Event Date</TableHead><TableHead>Assigned Facilitator</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {newTour.scheduledDates.length > 0 ? (
                          newTour.scheduledDates.map(date => (
                            <TableRow key={date}>
                              <TableCell className="font-bold">{format(parseISO(date), 'EEEE, MMM d, yyyy')}</TableCell>
                              <TableCell>
                                <Select value={newTour.facilitatorAssignments[date] || 'none'} onValueChange={(v) => handleUpdateDateFacilitator(date, v)}>
                                  <SelectTrigger className="h-9 text-xs rounded-lg w-48"><SelectValue placeholder="Choose facilitator" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No Assignment</SelectItem>
                                    {facilitators?.map(f => <SelectItem key={f.id} value={f.email}>{f.name || f.email}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => handleRemoveDate(date)}><Trash className="w-4 h-4" /></Button></TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={3} className="text-center py-12 text-muted-foreground">Use the Frequency Engine to generate event slots.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </section>
                <section>
                  <Label className="text-xl font-headline font-bold text-primary mb-4 block">Visual Assets</Label>
                  <ImageLibrary selectedUrls={newTour.imageUrls} onSelect={(urls) => setNewTour(prev => ({ ...prev, imageUrls: urls }))} />
                </section>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Confirmation Dialogs */}
      <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(open) => !open && setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl bg-white p-10">
          <AlertDialogHeader>
            <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center mb-6"><AlertCircle className="w-8 h-8 text-rose-600" /></div>
            <AlertDialogTitle className="text-3xl font-headline font-bold text-primary">Confirm Targeted Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-lg">
              This action is irreversible. You are about to permanently purge <strong>{deleteConfirm.title}</strong> from the campus database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 mt-10">
            <AlertDialogCancel className="rounded-full h-12 px-8 border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90 text-white rounded-full h-12 px-10 font-bold">Permanently Purge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
