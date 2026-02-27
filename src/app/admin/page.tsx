
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
import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Trash2, Edit, Save, Loader2, Check, X, Users, Info, 
  Settings, Image as ImageIcon, Search, Shield, UserCheck, 
  User, Edit2, Upload, Grid, FileText, CheckCircle, Clock,
  Trophy, Activity, AlertCircle, LogIn, Palette, Type, CalendarDays,
  CreditCard, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, useDoc } from "@/firebase";
import { collection, serverTimestamp, doc, query, orderBy } from "firebase/firestore";
import { Tour } from "@/lib/types";
import { ImageLibrary } from "@/components/admin/ImageLibrary";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

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
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  altText?: string;
  uploadedAt: any;
}

interface CorporateProposal {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  packageName: string;
  itinerary: any[];
  catering: string;
  addons: string[];
  hotel: string;
  status: 'pending' | 'reviewed' | 'approved' | 'sent';
  adminNotes?: string;
  createdAt: any;
}

const HIGHLIGHT_OPTIONS = [
  "Tour",
  "Workshop",
  "Q&A",
  "Refreshments",
  "Take-home gift",
  "Certificate"
];

const resizeImage = (file: File, maxWidth = 1200, maxHeight = 1200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error("No canvas context")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AUTH GUARD ---
  // Allow indispirit@gmail.com override just like in security rules
  const isWorkshopOwner = user?.email === "indispirit@gmail.com";
  
  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);
  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminRef);
  const isAdmin = isWorkshopOwner || !!adminDoc;

  // --- BRAND SETTINGS ---
  const brandSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "brand_layout");
  }, [firestore]);
  const { data: brandSettings } = useDoc(brandSettingsRef);

  const [localBrandSettings, setLocalBrandSettings] = useState({
    navbarKerning: 0.7,
    navbarOffset: -0.7,
    loadingKerning: 1.05,
    loadingOffset: -1.05
  });

  useEffect(() => {
    if (brandSettings) {
      setLocalBrandSettings({
        navbarKerning: brandSettings.navbarKerning ?? 0.7,
        navbarOffset: brandSettings.navbarOffset ?? -0.7,
        loadingKerning: brandSettings.loadingKerning ?? 1.05,
        loadingOffset: brandSettings.loadingOffset ?? -1.05
      });
    }
  }, [brandSettings]);

  const handleSaveBrandSettings = () => {
    if (!brandSettingsRef) return;
    setDocumentNonBlocking(brandSettingsRef, {
      ...localBrandSettings,
      updatedAt: serverTimestamp()
    }, { merge: true });
    toast({ title: "Brand Settings Saved", description: "Logo kerning updated across all platforms." });
  };

  // --- TOUR STATE & QUERIES ---
  const toursQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, "tours");
  }, [firestore, isAdmin]);
  const { data: tours, isLoading: isToursLoading } = useCollection<Tour>(toursQuery);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [priceMode, setPriceMode] = useState<"preset" | "custom">("preset");
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
    imageUrls: [] as string[]
  });

  // --- BOOKINGS QUERIES ---
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "bookings"), orderBy("bookedAt", "desc"));
  }, [firestore, isAdmin]);
  const { data: bookings, isLoading: isBookingsLoading } = useCollection<BookingRecord>(bookingsQuery);

  // --- PROPOSAL STATE & QUERIES ---
  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "proposals"), orderBy("createdAt", "desc"));
  }, [firestore, isAdmin]);
  const { data: proposals, isLoading: isProposalsLoading } = useCollection<CorporateProposal>(proposalsQuery);
  const [viewingProposal, setViewingProposal] = useState<CorporateProposal | null>(null);

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

  // --- HANDLERS ---

  const resetTourForm = () => {
    setEditingId(null);
    setPriceMode("preset");
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
      imageUrls: []
    });
  };

  const handleEditTour = (tour: Tour) => {
    setEditingId(tour.id);
    const presets = [500, 1000, 1500, 2000];
    setPriceMode(presets.includes(tour.price) ? "preset" : "custom");
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
      imageUrls: tour.imageUrls || (tour.imageUrl ? [tour.imageUrl] : [])
    });
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

  const handleUpdateProposalStatus = (proposalId: string, status: CorporateProposal['status']) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, "proposals", proposalId), {
      status,
      updatedAt: serverTimestamp()
    });
    toast({ title: `Proposal marked as ${status}` });
    setViewingProposal(null);
  };

  const handleToggleAdmin = (userId: string, email: string, current: boolean) => {
    if (!firestore) return;
    const ref = doc(firestore, "roles_admin", userId);
    if (current) deleteDocumentNonBlocking(ref);
    else setDocumentNonBlocking(ref, { email, activatedAt: serverTimestamp(), role: "admin" }, { merge: true });
    toast({ title: current ? "Admin Removed" : "Admin Added" });
  };

  const handleToggleFacilitator = (userId: string, email: string, current: boolean) => {
    if (!firestore) return;
    const ref = doc(firestore, "roles_facilitator", userId);
    if (current) deleteDocumentNonBlocking(ref);
    else setDocumentNonBlocking(ref, { email, activatedAt: serverTimestamp(), role: "facilitator" }, { merge: true });
    toast({ title: current ? "Facilitator Removed" : "Facilitator Added" });
  };

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0 || !firestore || !user) return;
    setIsMediaUploading(true);
    let successCount = 0;
    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        const compressed = await resizeImage(selectedFiles[i]);
        addDocumentNonBlocking(collection(firestore, 'media'), { url: compressed, type: 'image', altText: selectedFiles[i].name, uploadedAt: serverTimestamp() });
        successCount++;
      } catch (e) {}
      setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
    }
    toast({ title: "Images Prepared", description: `${successCount} images added to gallery.` });
    setSelectedFiles([]);
    setIsUploadDialogOpen(false);
    setIsMediaUploading(false);
  };

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
            <p className="text-muted-foreground leading-relaxed">
              This area is reserved for administrators only. Please sign in with an authorized account to continue.
            </p>
            <div className="mt-8 space-y-3">
              <Button asChild className="w-full bg-primary rounded-full h-12 font-bold shadow-lg">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full rounded-full h-12">
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/LOGO%20only%20NEW%20TRANS%202025.png?alt=media&token=916bf295-69a1-4640-9f92-d8d2560ee0c2";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        
        <Tabs defaultValue="admin" className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage Maroma Experiences, Proposals, and Users.</p>
            </div>
            
            <TabsList className="bg-white p-1 h-14 rounded-full shadow-lg border border-border/50">
              <TabsTrigger value="bookings" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <CalendarDays className="w-5 h-5" /> Bookings
              </TabsTrigger>
              <TabsTrigger value="proposals" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <FileText className="w-5 h-5" /> Proposals
              </TabsTrigger>
              <TabsTrigger value="brand" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Palette className="w-5 h-5" /> Brand
              </TabsTrigger>
              <TabsTrigger value="media" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <ImageIcon className="w-5 h-5" /> Media
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Users className="w-5 h-5" /> Users
              </TabsTrigger>
              <TabsTrigger value="admin" className="rounded-full h-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Settings className="w-5 h-5" /> Experiences
              </TabsTrigger>
            </TabsList>
          </div>

          {/* BOOKINGS TAB */}
          <TabsContent value="bookings" className="m-0 focus-visible:ring-0">
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b px-8 py-6">
                <CardTitle className="font-headline text-2xl text-primary">Customer Bookings</CardTitle>
                <p className="text-sm text-muted-foreground">Real-time view of individual workshop and tour reservations.</p>
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
                        <Button size="icon" variant="ghost" className="rounded-full hover:text-destructive" onClick={() => deleteDocumentNonBlocking(doc(firestore!, "bookings", b.id))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!bookings || bookings.length === 0) && !isBookingsLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                        <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        No customer bookings found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* BRAND TAB */}
          <TabsContent value="brand" className="m-0 focus-visible:ring-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                  <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <Type className="w-6 h-6 text-accent" /> Kerning Adjustments
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Fine-tune the "EXPERIENCES" typography spacing.</p>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                  {/* Navbar Control */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold uppercase tracking-widest text-primary">Header / Footer Layout</Label>
                      <Badge variant="outline" className="text-[10px] font-bold">{localBrandSettings.navbarKerning}em</Badge>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Letter Spacing (Kerning)</span>
                        <Slider 
                          value={[localBrandSettings.navbarKerning]} 
                          onValueChange={([v]) => setLocalBrandSettings({...localBrandSettings, navbarKerning: v})}
                          max={2} 
                          step={0.01}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Centering Offset (Negative Margin)</span>
                        <Slider 
                          value={[Math.abs(localBrandSettings.navbarOffset)]} 
                          onValueChange={([v]) => setLocalBrandSettings({...localBrandSettings, navbarOffset: -v})}
                          max={2} 
                          step={0.01}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Loading Screen Control */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold uppercase tracking-widest text-primary">Loading Screen Layout</Label>
                      <Badge variant="outline" className="text-[10px] font-bold">{localBrandSettings.loadingKerning}em</Badge>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Letter Spacing (Kerning)</span>
                        <Slider 
                          value={[localBrandSettings.loadingKerning]} 
                          onValueChange={([v]) => setLocalBrandSettings({...localBrandSettings, loadingKerning: v})}
                          max={2} 
                          step={0.01}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Centering Offset (Negative Margin)</span>
                        <Slider 
                          value={[Math.abs(localBrandSettings.loadingOffset)]} 
                          onValueChange={([v]) => setLocalBrandSettings({...localBrandSettings, loadingOffset: -v})}
                          max={2} 
                          step={0.01}
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveBrandSettings} className="w-full bg-primary rounded-full h-12 font-bold shadow-lg gap-2">
                    <Save className="w-4 h-4" /> Save Brand Layout
                  </Button>
                </CardContent>
              </Card>

              {/* Preview Card */}
              <div className="space-y-8">
                <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden p-12 flex flex-col items-center justify-center min-h-[300px]">
                  <div className="flex flex-col items-center mb-10 text-center">
                    <div className="flex items-center space-x-3 mb-4">
                      <img src={LOGO_URL} alt="Maroma" className="w-12 h-12 object-contain" />
                      <span className="text-4xl font-headline font-bold text-primary tracking-tight leading-none uppercase">MAROMA</span>
                    </div>
                    <span 
                      className="text-[10px] font-body font-medium text-accent uppercase leading-none transition-all"
                      style={{ 
                        letterSpacing: `${localBrandSettings.navbarKerning}em`,
                        marginRight: `${localBrandSettings.navbarOffset}em`,
                        marginTop: '4px'
                      }}
                    >
                      Experiences
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-50">Header Preview</p>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-xl bg-primary overflow-hidden p-12 flex flex-col items-center justify-center min-h-[300px]">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-5xl font-headline font-bold text-white tracking-tight leading-none uppercase">MAROMA</span>
                    <span 
                      className="text-[12px] font-body font-medium text-accent uppercase leading-none transition-all"
                      style={{ 
                        letterSpacing: `${localBrandSettings.loadingKerning}em`,
                        marginRight: `${localBrandSettings.loadingOffset}em`,
                        marginTop: '8px'
                      }}
                    >
                      Experiences
                    </span>
                  </div>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-[0.2em] mt-8">Loading Screen Preview</p>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* PROPOSALS TAB */}
          <TabsContent value="proposals" className="m-0 focus-visible:ring-0">
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b px-8 py-6">
                <CardTitle className="font-headline text-2xl text-primary">Corporate Proposals</CardTitle>
                <p className="text-sm text-muted-foreground">Review and approve custom itinerary requests.</p>
              </CardHeader>
              <Table>
                <TableHeader><TableRow className="bg-muted/30">
                  <TableHead>Company</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {proposals?.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{p.companyName}</TableCell>
                      <TableCell>{p.packageName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "capitalize",
                          p.status === 'pending' ? "bg-amber-100 text-amber-700" :
                          p.status === 'reviewed' ? "bg-blue-100 text-blue-700" :
                          "bg-green-100 text-green-700"
                        )}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.createdAt?.toDate?.()?.toLocaleDateString() || "Recent"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setViewingProposal(p)} className="gap-2">
                          <Search className="w-4 h-4" /> Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!proposals || proposals.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No pending proposals found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            {/* Proposal Detail Dialog */}
            <Dialog open={!!viewingProposal} onOpenChange={() => setViewingProposal(null)}>
              <DialogContent className="max-w-2xl rounded-3xl">
                {viewingProposal && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-headline">{viewingProposal.companyName}</DialogTitle>
                      <DialogDescription>Reviewing custom itinerary request</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-muted/20 rounded-xl">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Contact</Label>
                          <p className="font-medium">{viewingProposal.contactName}</p>
                          <p className="text-xs text-muted-foreground">{viewingProposal.email}</p>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-xl">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Package</Label>
                          <p className="font-medium">{viewingProposal.packageName}</p>
                          <p className="text-xs text-muted-foreground">{viewingProposal.hotel}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">Itinerary Items</Label>
                        <div className="space-y-2">
                          {viewingProposal.itinerary?.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-muted/10 rounded-lg text-sm">
                              <CheckCircle className="w-3 h-3 text-green-600" /> {item.name}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Catering</Label>
                          <p className="text-sm">{viewingProposal.catering}</p>
                        </div>
                        <div className="flex-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Add-ons</Label>
                          <div className="flex flex-wrap gap-1">
                            {viewingProposal.addons?.map((a, i) => <Badge key={i} variant="secondary" className="text-[9px]">{a}</Badge>)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => handleUpdateProposalStatus(viewingProposal.id, 'reviewed')} className="rounded-full">Mark as Reviewed</Button>
                      <Button onClick={() => handleUpdateProposalStatus(viewingProposal.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white rounded-full">Approve & Send</Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* EXPERIENCES TAB */}
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
                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm font-bold text-primary">Status</Label>
                        <span className="text-xs text-muted-foreground">Live or Coming Soon</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={cn("rounded-full px-3 py-0.5 uppercase text-[10px] tracking-widest border-none", newTour.status === 'live' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                          {newTour.status}
                        </Badge>
                        <Switch 
                          checked={newTour.status === 'live'}
                          onCheckedChange={(checked) => setNewTour({...newTour, status: checked ? 'live' : 'coming-soon'})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</Label>
                      <Input placeholder="Experience Name" value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} className="rounded-xl h-11" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Location</Label>
                        <Select value={newTour.location} onValueChange={v => setNewTour({...newTour, location: v})}>
                          <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Maroma Campus">Maroma Campus</SelectItem>
                            <SelectItem value="Maroma Spa">Maroma Spa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Duration</Label>
                        <Select value={newTour.duration} onValueChange={v => setNewTour({...newTour, duration: v})}>
                          <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30 minutes">30m</SelectItem>
                            <SelectItem value="60 minutes">1h</SelectItem>
                            <SelectItem value="90 minutes">1h 30m</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                      <Textarea className="min-h-[100px] rounded-2xl" value={newTour.description} onChange={e => setNewTour({...newTour, description: e.target.value})} />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Highlights</Label>
                      <div className="grid grid-cols-2 gap-2 p-4 bg-muted/20 rounded-2xl border border-border/50">
                        {HIGHLIGHT_OPTIONS.map((h) => (
                          <div key={h} className="flex items-center space-x-2">
                            <Checkbox id={`h-${h}`} checked={newTour.highlights.includes(h)} onCheckedChange={() => {
                              const curr = newTour.highlights;
                              setNewTour({...newTour, highlights: curr.includes(h) ? curr.filter(x => x !== h) : [...curr, h]});
                            }} />
                            <Label htmlFor={`h-${h}`} className="text-xs font-medium truncate">{h}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      className={cn("w-full rounded-full h-12 font-bold shadow-lg transition-all duration-500", isSuccess ? "bg-green-600" : "bg-primary")}
                      onClick={handleSaveTour}
                      disabled={isProcessing || isSuccess}
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : isSuccess ? <Check /> : <Save className="mr-2 h-4 w-4" />}
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
                  <CardHeader className="bg-white border-b"><CardTitle className="font-headline text-2xl text-primary">Catalog</CardTitle></CardHeader>
                  <Table>
                    <TableHeader><TableRow className="bg-muted/30">
                      <TableHead>Experience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {tours?.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="font-bold">{t.name}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{t.status}</Badge></TableCell>
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

          {/* USERS TAB */}
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
                            <Button size="sm" variant={isAdm ? "destructive" : "outline"} className="rounded-full h-9 px-4" onClick={() => handleToggleAdmin(u.id, u.email, isAdm)}>
                              <Shield className="w-3.5 h-3.5 mr-2" /> {isAdm ? "Revoke" : "Make Admin"}
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-full h-9 px-4" onClick={() => handleToggleFacilitator(u.id, u.email, isFac)}>
                              <UserCheck className="w-3.5 h-3.5 mr-2" /> {isFac ? "Revoke" : "Make Facilitator"}
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

          {/* MEDIA TAB */}
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
                      <div className="max-h-40 overflow-auto space-y-1">
                        {selectedFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-xs">
                            <span className="truncate">{f.name}</span>
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleBatchUpload} disabled={isMediaUploading || selectedFiles.length === 0} className="bg-primary rounded-full px-8">
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
