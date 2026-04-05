"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo } from "react";
import { 
  Trash2, Edit, Save, Loader2, Check, X, Users, 
  Settings, AlertCircle, CalendarDays,
  Mail, ClipboardList, Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCcw, Plus, 
  UserCheck, Edit3, CheckCircle2, Sparkles, Lock,
  CheckSquare, Database, Shield, Zap, RotateCcw, XCircle, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, useDoc } from "@/firebase";
import { collection, serverTimestamp, doc, query, orderBy } from "firebase/firestore";
import { Tour, TourType } from "@/lib/types";
import { ImageLibrary } from "@/components/admin/ImageLibrary";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from "date-fns";

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
  adultCount?: number;
  childCount?: number;
  totalPrice: number;
  bookingStatus: string;
  confirmationStatus?: 'pending_min_required' | 'attending' | 'cancelled';
  bookedAt: any;
  tourId: string;
  customerName?: string;
  customerEmail?: string;
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
  itinerary: any[];
  status: string;
  createdAt: any;
  studentCount?: string;
  adultCount?: string;
  participants?: string;
}

interface FacilitatorRole {
  id: string;
  email: string;
  name?: string;
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      toast({ title: "Facilitator Updated" });
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
        textBody: `Hello ${cleanName},\n\nYou have been onboarded as a facilitator for Maroma Experiences.\n\nBest regards,\nMaroma Administration`
      });

      toast({ title: "Facilitator Added" });
    }
    
    setInviteEmail("");
    setInviteName("");
    setEditingFacilitatorId(null);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: "Dashboard Refreshed" });
    }, 800);
  };

  const executeDelete = () => {
    if (!firestore || !deleteConfirm.type) return;

    switch (deleteConfirm.type) {
      case 'facilitator':
        if (deleteConfirm.id) deleteDocumentNonBlocking(doc(firestore, "roles_facilitator", deleteConfirm.id));
        break;
      case 'tour':
        if (deleteConfirm.id) deleteDocumentNonBlocking(doc(firestore, "tours", deleteConfirm.id));
        break;
      case 'booking':
        if (deleteConfirm.id) deleteDocumentNonBlocking(doc(firestore, "bookings", deleteConfirm.id));
        break;
      case 'bulk-booking':
        selectedBookingIds.forEach(id => deleteDocumentNonBlocking(doc(firestore, "bookings", id)));
        setSelectedBookingIds(new Set());
        break;
      case 'proposal':
        if (deleteConfirm.id) deleteDocumentNonBlocking(doc(firestore, "proposals", deleteConfirm.id));
        break;
      case 'bulk-proposal':
        selectedProposalIds.forEach(id => deleteDocumentNonBlocking(doc(firestore, "proposals", id)));
        setSelectedProposalIds(new Set());
        break;
      case 'bulk-user':
        const facilitatorEmailsSet = new Set(facilitators?.map(f => f.email.toLowerCase()) || []);
        selectedUserIds.forEach(id => {
          const profile = users?.find(u => u.id === id);
          const isProtected = profile?.email === "indispirit@gmail.com" || adminIds.has(id) || (profile && facilitatorEmailsSet.has(profile.email.toLowerCase()));
          if (!isProtected) {
            deleteDocumentNonBlocking(doc(firestore, "users", id));
          }
        });
        setSelectedUserIds(new Set());
        break;
    }

    setDeleteConfirm({ isOpen: false, type: null, id: null, title: null });
    toast({ title: "Deletion Complete" });
  };

  // Data Queries
  const toursQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, "tours");
  }, [firestore, isAdmin]);
  const { data: tours, isLoading: isToursLoading } = useCollection<Tour>(toursQuery);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "bookings"), orderBy("bookedAt", "desc"));
  }, [firestore, isAdmin]);
  const { data: bookings, isLoading: isBookingsLoading } = useCollection<BookingRecord>(bookingsQuery);

  // Group threshold calculation for dynamic labels
  const groupTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    if (!bookings) return totals;
    bookings.forEach(b => {
      if (b.confirmationStatus === 'cancelled') return;
      const key = `${b.tourId}_${b.tourDate}`;
      totals[key] = (totals[key] || 0) + (b.numberOfAttendees || 0);
    });
    return totals;
  }, [bookings]);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "proposals"), orderBy("createdAt", "desc"));
  }, [firestore, isAdmin]);
  const { data: proposals, isLoading: isProposalsLoading } = useCollection<ProposalRecord>(proposalsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, "users");
  }, [firestore, isAdmin]);
  const adminsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, "roles_admin");
  }, [firestore, isAdmin]);
  const { data: users, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: admins } = useCollection(adminsQuery);
  const adminIds = new Set(admins?.map(a => a.id) || []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTour, setNewTour] = useState({
    name: "",
    highlights: [] as string[],
    location: "Maroma Campus",
    duration: "60 minutes",
    audience: "",
    description: "",
    price: 500,
    childPrice: 300,
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

  const combinedUsers = useMemo(() => {
    if (!users) return [];
    const list = [...users].map(u => ({ ...u, isSignedUp: true }));
    facilitators?.forEach(f => {
      const exists = list.some(u => u.email.toLowerCase() === f.email.toLowerCase());
      if (!exists) {
        list.push({ id: f.id, firstName: f.name || "Facilitator", lastName: "(Pending Signup)", email: f.email, isSignedUp: false } as any);
      }
    });
    return list;
  }, [users, facilitators]);

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
      childPrice: tour.childPrice ?? 300,
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
    document.getElementById('tour-editor-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveTour = () => {
    if (!newTour.name) {
      toast({ variant: "destructive", title: "Name Required" });
      return;
    }
    if (!firestore || !user) return;
    const tourData: Partial<Tour> = { ...newTour, updatedAt: serverTimestamp(), imageUrl: newTour.imageUrls[0] || `https://picsum.photos/seed/${Math.random()}/1200/800` };
    if (editingId) updateDocumentNonBlocking(doc(firestore, "tours", editingId), tourData);
    else addDocumentNonBlocking(collection(firestore, "tours"), { ...tourData, tourOwnerId: user.uid, createdAt: serverTimestamp() });
    toast({ title: "Experience Saved" });
  };

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const calendarEvents = useMemo(() => {
    const events: { date: string, title: string, type: string, id: string, count: number }[] = [];
    tours?.forEach(t => t.scheduledDates?.forEach(d => {
      const count = bookings?.filter(b => b.tourId === t.id && b.tourDate === d && b.bookingStatus === 'confirmed').reduce((acc, b) => acc + (b.numberOfAttendees || 0), 0) || 0;
      events.push({ date: d, title: t.name, type: 'workshop', id: t.id, count });
    }));
    proposals?.forEach(p => {
      if (p.selectedDate) {
        let count = parseInt(p.participants || p.studentCount || "0");
        events.push({ date: p.selectedDate, title: p.schoolName || p.companyName || "Group", type: p.type === 'School' ? 'school' : 'corporate', id: p.id, count });
      }
    });
    return events;
  }, [tours, proposals, bookings]);

  if (isUserLoading || isAdminDocLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
        <p className="mt-4 text-muted-foreground uppercase tracking-widest text-xs">Syncing Console...</p>
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
            <Button asChild className="w-full mt-8 bg-primary rounded-full h-12"><Link href="/">Return Home</Link></Button>
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
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Dashboard</h1>
                <Button variant="ghost" size="icon" onClick={handleManualRefresh} className={cn("rounded-full h-8 w-8 text-muted-foreground hover:text-primary", isRefreshing && "animate-spin")}>
                  <RefreshCcw className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mt-1">Campus Management Center</p>
            </div>
            <div className="w-full overflow-x-auto no-scrollbar pb-4 -mb-4">
              <TabsList className="bg-white p-1 h-14 rounded-full shadow-lg border border-border/50 min-w-max flex">
                <TabsTrigger value="calendar" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><CalendarIcon className="w-5 h-5" /> Calendar</TabsTrigger>
                <TabsTrigger value="bookings" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><CalendarDays className="w-5 h-5" /> Bookings</TabsTrigger>
                <TabsTrigger value="proposals" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><ClipboardList className="w-5 h-5" /> Requests</TabsTrigger>
                <TabsTrigger value="facilitators" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><UserCheck className="w-5 h-5" /> Facilitators</TabsTrigger>
                <TabsTrigger value="users" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Users className="w-5 h-5" /> Users</TabsTrigger>
                <TabsTrigger value="admin" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Settings className="w-5 h-5" /> Experiences</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="calendar" className="m-0">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-white border-b px-8 py-6 flex flex-row items-center justify-between">
                <CardTitle className="font-headline text-2xl text-primary">Activity Calendar</CardTitle>
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
                  {eachDayOfInterval({ start: startOfMonth(calendarMonth), end: endOfMonth(calendarMonth) }).map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const events = calendarEvents.filter(e => e.date === dayStr);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div key={dayStr} className={cn("bg-white p-3 h-32 border-t border-slate-100 flex flex-col gap-1 transition-colors hover:bg-slate-50", isToday && "bg-accent/5")}>
                        <span className={cn("text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1", isToday ? "bg-accent text-white" : "text-slate-400")}>{format(day, 'd')}</span>
                        <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
                          {events.map((e, idx) => (
                            <div key={`${e.id}-${idx}`} className={cn("text-[9px] font-bold px-2 py-1 rounded-lg border truncate uppercase tracking-tighter", e.type === 'workshop' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white")}>
                              {e.title} ({e.count})
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

          <TabsContent value="bookings" className="m-0">
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b flex flex-col md:flex-row md:items-center justify-between p-8 gap-4">
                <CardTitle className="font-headline text-2xl flex items-center gap-3">
                  Campus Bookings
                  {bookings && <Badge variant="secondary" className="rounded-full">{bookings.length} Records</Badge>}
                </CardTitle>
                {selectedBookingIds.size > 0 && (
                  <Button variant="destructive" size="sm" className="rounded-full px-6 gap-2" onClick={() => setDeleteConfirm({ isOpen: true, type: 'bulk-booking', id: null, title: `${selectedBookingIds.size} bookings` })}>
                    <Trash2 className="w-4 h-4" /> Delete Selected ({selectedBookingIds.size})
                  </Button>
                )}
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/5">
                    <TableHead className="w-12 pl-8">
                      <Checkbox checked={bookings && bookings.length > 0 && selectedBookingIds.size === bookings.length} onCheckedChange={() => { if (selectedBookingIds.size === (bookings?.length || 0)) setSelectedBookingIds(new Set()); else setSelectedBookingIds(new Set(bookings?.map(b => b.id) || [])); }} />
                    </TableHead>
                    <TableHead>Experience</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Attendees</TableHead><TableHead>Total (₹)</TableHead><TableHead>Status</TableHead><TableHead className="text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isBookingsLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-accent" /></TableCell></TableRow>
                  ) : bookings && bookings.length > 0 ? (
                    bookings.map(b => {
                      const totalForThisTourDate = groupTotals[`${b.tourId}_${b.tourDate}`] || 0;
                      const isThresholdMet = totalForThisTourDate >= 8;
                      
                      return (
                        <TableRow key={b.id} className="group hover:bg-muted/5">
                          <TableCell className="pl-8"><Checkbox checked={selectedBookingIds.has(b.id)} onCheckedChange={() => { const next = new Set(selectedBookingIds); if(next.has(b.id)) next.delete(b.id); else next.add(b.id); setSelectedBookingIds(next); }} /></TableCell>
                          <TableCell className="font-bold">{b.tourName}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{b.customerName || "Anonymous"}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">{b.customerEmail || "No Email"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{b.tourDate}</TableCell>
                          <TableCell className="text-sm font-medium">{b.numberOfAttendees} Person(s)</TableCell>
                          <TableCell className="text-sm font-bold">₹{b.totalPrice}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className={cn("text-[10px] uppercase", b.bookingStatus === 'confirmed' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>{b.bookingStatus}</Badge>
                              {b.confirmationStatus === 'attending' && (
                                <Badge className="bg-emerald-600 text-white text-[8px] uppercase font-black tracking-widest gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Attending</Badge>
                              )}
                              {b.confirmationStatus === 'cancelled' && (
                                <Badge className="bg-rose-600 text-white text-[8px] uppercase font-black tracking-widest gap-1"><XCircle className="w-2.5 h-2.5" /> Not Coming</Badge>
                              )}
                              {b.confirmationStatus === 'pending_min_required' && (
                                <Badge variant="outline" className={cn("text-[8px] uppercase tracking-widest gap-1", isThresholdMet && "border-amber-500 text-amber-600")}>
                                  <Clock className="w-2.5 h-2.5" /> {isThresholdMet ? "Pending Confirmation" : "Awaiting Min."}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <Button size="icon" variant="ghost" className="text-destructive rounded-full" onClick={() => setDeleteConfirm({ isOpen: true, type: 'booking', id: b.id, title: `Booking for ${b.tourName}` })}><Trash2 className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow><TableCell colSpan={8} className="text-center py-20 text-muted-foreground">No bookings found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="m-0">
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                <CardTitle className="font-headline text-2xl">User Directory</CardTitle>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="rounded-full px-6 gap-2" onClick={() => {
                    const nonProtected = combinedUsers.filter(u => u.email !== "indispirit@gmail.com" && !adminIds.has(u.id)).map(u => u.id);
                    setSelectedUserIds(new Set(nonProtected));
                  }}><CheckSquare className="w-4 h-4" /> Select All Guests</Button>
                  {selectedUserIds.size > 0 && (
                    <Button variant="destructive" size="sm" className="rounded-full px-6 gap-2" onClick={() => setDeleteConfirm({ isOpen: true, type: 'bulk-user', id: null, title: `${selectedUserIds.size} guest profiles` })}><Trash2 className="w-4 h-4" /> Delete Selected ({selectedUserIds.size})</Button>
                  )}
                </div>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/5">
                    <TableHead className="w-12 pl-6">Selection</TableHead>
                    <TableHead>Profile</TableHead><TableHead>Permissions</TableHead><TableHead className="text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combinedUsers.map(u => {
                    const isProtected = u.email === "indispirit@gmail.com" || adminIds.has(u.id);
                    return (
                      <TableRow key={u.id} className={cn(isProtected && "bg-slate-50/50")}>
                        <TableCell className="pl-6">
                          {isProtected ? <Lock className="w-3 h-3 text-slate-300" /> : <Checkbox checked={selectedUserIds.has(u.id)} onCheckedChange={() => { const next = new Set(selectedUserIds); if(next.has(u.id)) next.delete(u.id); else next.add(u.id); setSelectedUserIds(next); }} />}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold flex items-center gap-2">{u.firstName} {u.lastName} {isProtected && <Lock className="w-3 h-3 text-accent" />}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            {adminIds.has(u.id) && <Badge className="bg-primary text-white">Admin</Badge>}
                            {!isProtected && <Badge variant="outline">Guest</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {u.isSignedUp && (
                            <Button size="sm" variant="outline" disabled={u.email === "indispirit@gmail.com"} onClick={() => {
                              const ref = doc(firestore, "roles_admin", u.id);
                              if (adminIds.has(u.id)) deleteDocumentNonBlocking(ref);
                              else setDocumentNonBlocking(ref, { email: u.email, role: 'admin', activatedAt: serverTimestamp() }, { merge: true });
                              toast({ title: adminIds.has(u.id) ? "Admin Rights Revoked" : "Admin Assigned" });
                            }}><Shield className="w-3.5 h-3.5 mr-2" /> {adminIds.has(u.id) ? "Revoke" : "Make Admin"}</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="m-0 space-y-12">
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b"><CardTitle className="font-headline text-2xl text-primary">Experience Catalog</CardTitle></CardHeader>
              <Table>
                <TableHeader><TableRow className="bg-muted/30"><TableHead>Experience</TableHead><TableHead>Badge Count</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {tours?.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-bold">{t.name}</TableCell>
                      <TableCell className="text-xs font-bold text-primary">{t.bookedSpaces || 0} / {t.capacity}</TableCell>
                      <TableCell>{t.isActive ? <Badge className="bg-green-100 text-green-700">Visible</Badge> : <Badge variant="outline">Hidden</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="text-orange-500" onClick={() => { updateDocumentNonBlocking(doc(firestore, "tours", t.id), { bookedSpaces: 0 }); toast({ title: "Counter Reset" }); }}><RotateCcw className="w-4 h-4" /></Button>
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
                  <CardHeader><CardTitle className="font-headline text-2xl text-primary">{editingId ? "Edit Experience" : "New Experience"}</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <Input placeholder="Experience Name" value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} className="rounded-xl h-11" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Adult Rate (₹)</Label><Input type="number" value={newTour.price} onChange={e => setNewTour({...newTour, price: parseInt(e.target.value) || 0})} className="rounded-xl h-12" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Child Rate (₹)</Label><Input type="number" value={newTour.childPrice} onChange={e => setNewTour({...newTour, childPrice: parseInt(e.target.value) || 0})} className="rounded-xl h-12" /></div>
                    </div>
                    
                    <div className="space-y-3 p-4 bg-muted/10 rounded-2xl border border-border/50">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Public Booking Badge</Label>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] text-accent" onClick={() => {
                          const liveCount = (bookings || []).filter(b => b.tourId === editingId && b.bookingStatus === 'confirmed' && b.confirmationStatus !== 'cancelled').reduce((acc, b) => acc + (b.numberOfAttendees || 0), 0);
                          setNewTour({...newTour, bookedSpaces: liveCount});
                          toast({ title: "Badge Synchronized" });
                        }}><Zap className="w-2.5 h-2.5 mr-1" /> Sync to DB</Button>
                      </div>
                      <Input type="number" value={newTour.bookedSpaces} onChange={e => setNewTour({...newTour, bookedSpaces: parseInt(e.target.value) || 0})} className="rounded-xl h-12 text-lg font-bold bg-white" />
                    </div>
                    
                    <Button className="w-full rounded-full h-12 font-bold shadow-lg" onClick={handleSaveTour}><Save className="mr-2 h-4 w-4" /> {editingId ? "Save Changes" : "Publish"}</Button>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2 space-y-12">
                <ImageLibrary selectedUrls={newTour.imageUrls} onSelect={(urls) => setNewTour(prev => ({ ...prev, imageUrls: urls }))} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(open) => !open && setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl bg-white p-10">
          <AlertDialogHeader>
            <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center mb-6"><AlertCircle className="w-8 h-8 text-rose-600" /></div>
            <AlertDialogTitle className="text-3xl font-headline font-bold text-primary">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-lg">Are you sure you want to delete <strong>{deleteConfirm.title}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 mt-10">
            <AlertDialogCancel className="rounded-full h-12 px-8">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-white rounded-full h-12 px-10 font-bold">Permanently Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </div>
  );
}
