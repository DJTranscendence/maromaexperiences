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
import { useState } from "react";
import { Trash2, Edit, Save, Loader2, Check, X, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { Tour } from "@/lib/types";
import { ImageLibrary } from "@/components/admin/ImageLibrary";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";

const HIGHLIGHT_OPTIONS = [
  "Tour",
  "Workshop",
  "Q&A",
  "Refreshments",
  "Take-home gift",
  "Certificate"
];

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const toursQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "tours");
  }, [firestore]);

  const { data: tours, isLoading } = useCollection<Tour>(toursQuery);

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
    type: "group" as const,
    imageUrls: [] as string[]
  });

  const resetForm = () => {
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
      type: "group",
      imageUrls: []
    });
  };

  const handleEdit = (tour: Tour) => {
    setEditingId(tour.id);
    
    const presets = [500, 1000, 1500, 2000];
    if (presets.includes(tour.price)) {
      setPriceMode("preset");
    } else {
      setPriceMode("custom");
    }

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
      type: tour.type || "group",
      imageUrls: tour.imageUrls || (tour.imageUrl ? [tour.imageUrl] : [])
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleHighlight = (highlight: string) => {
    setNewTour(prev => {
      const current = prev.highlights;
      if (current.includes(highlight)) {
        return { ...prev, highlights: current.filter(h => h !== highlight) };
      } else {
        return { ...prev, highlights: [...current, highlight] };
      }
    });
  };

  const handleSaveTour = () => {
    if (!newTour.name || !firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: !user ? "You must be signed in to save tours." : "Please provide at least a tour name."
      });
      return;
    }
    
    setIsProcessing(true);

    const tourData: Partial<Tour> = {
      name: newTour.name,
      description: newTour.description,
      shortDescription: newTour.description.substring(0, 100),
      pricePerPerson: newTour.price,
      price: newTour.price,
      durationHours: parseInt(newTour.duration) || 1,
      minimumGroupSize: newTour.minGroupSize,
      locationId: "default_location",
      location: newTour.location,
      duration: newTour.duration,
      capacity: newTour.capacity,
      type: newTour.type,
      highlights: newTour.highlights,
      isActive: true,
      updatedAt: serverTimestamp(),
      imageUrl: newTour.imageUrls[0] || `https://picsum.photos/seed/${Math.random()}/1200/800`, 
      imageUrls: newTour.imageUrls,
      scheduledDates: ["2024-08-15"]
    };

    if (editingId) {
      updateDocumentNonBlocking(doc(firestore, "tours", editingId), tourData);
      toast({ title: "Changes Saved", description: "The experience has been updated." });
    } else {
      const createData = {
        ...tourData,
        tourOwnerId: user.uid,
        createdAt: serverTimestamp(),
        bookedSpaces: 0,
      };
      addDocumentNonBlocking(collection(firestore, "tours"), createData);
      toast({ title: "Experience Published", description: "The new experience is now live." });
    }
    
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsProcessing(false);
      resetForm();
    }, 2000);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "tours", id));
    toast({
      title: "Tour Deleted",
      description: "The experience has been removed."
    });
    if (editingId === id) resetForm();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Design and manage your Maroma Experiences.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-full gap-2 border-accent text-accent hover:bg-accent/5" asChild>
              <Link href="/admin/users"><Users className="w-4 h-4" /> Manage Users</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-1">
            <Card className="rounded-3xl border-none shadow-xl bg-white sticky top-24">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-headline text-2xl text-primary">
                  {editingId ? "Edit Experience" : "New Experience"}
                </CardTitle>
                {editingId && (
                  <Button variant="ghost" size="icon" onClick={resetForm} className="rounded-full">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Basic Details</Label>
                  <Input 
                    placeholder="Experience Name" 
                    value={newTour.name}
                    onChange={e => setNewTour({...newTour, name: e.target.value})}
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</Label>
                    <Select 
                      value={newTour.location}
                      onValueChange={value => setNewTour({...newTour, location: value})}
                    >
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Maroma Campus">Maroma Campus</SelectItem>
                        <SelectItem value="Maroma Spa">Maroma Spa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration</Label>
                    <Select 
                      value={newTour.duration}
                      onValueChange={value => setNewTour({...newTour, duration: value})}
                    >
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30 minutes">30 minutes</SelectItem>
                        <SelectItem value="60 minutes">60 minutes</SelectItem>
                        <SelectItem value="90 minutes">90 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price (₹)</Label>
                    <Select 
                      value={priceMode === "custom" ? "other" : newTour.price.toString()}
                      onValueChange={(val) => {
                        if (val === "other") {
                          setPriceMode("custom");
                        } else {
                          setPriceMode("preset");
                          setNewTour({...newTour, price: parseInt(val)});
                        }
                      }}
                    >
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue placeholder="Select Price" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="1000">1000</SelectItem>
                        <SelectItem value="1500">1500</SelectItem>
                        <SelectItem value="2000">2000</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {priceMode === "custom" && (
                      <Input 
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter Price"
                        value={newTour.price === 0 ? "" : newTour.price}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setNewTour({...newTour, price: val === "" ? 0 : parseInt(val)});
                        }}
                        className="rounded-xl h-11 mt-2 animate-in slide-in-from-top-1 duration-200"
                        autoFocus
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capacity</Label>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      value={newTour.capacity === 0 ? "" : newTour.capacity}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setNewTour({...newTour, capacity: val === "" ? 0 : parseInt(val)});
                      }}
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                  <Textarea 
                    className="min-h-[120px] rounded-2xl" 
                    placeholder="Describe the experience..." 
                    value={newTour.description}
                    onChange={e => setNewTour({...newTour, description: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Highlights</Label>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-muted/20 rounded-2xl border border-border/50">
                    {HIGHLIGHT_OPTIONS.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`highlight-${option}`} 
                          checked={newTour.highlights.includes(option)}
                          onCheckedChange={() => toggleHighlight(option)}
                        />
                        <Label 
                          htmlFor={`highlight-${option}`} 
                          className="text-xs font-medium leading-none cursor-pointer select-none"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-12">
            <section>
              <div className="mb-4">
                <Label className="text-xl font-headline font-bold text-primary">Choose an image or images for the event</Label>
              </div>
              <ImageLibrary 
                selectedUrls={newTour.imageUrls}
                onSelect={(urls) => setNewTour(prev => ({ ...prev, imageUrls: urls }))} 
              />
              
              <div className="flex gap-4 mt-8">
                {editingId && (
                  <Button 
                    variant="outline"
                    className="rounded-full h-14 px-8 border-muted-foreground text-muted-foreground font-bold"
                    onClick={resetForm}
                    disabled={isProcessing}
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button 
                  className={cn(
                    "flex-1 rounded-full h-14 gap-2 shadow-lg transition-all duration-500 text-lg font-bold",
                    isSuccess 
                      ? "bg-green-600 hover:bg-green-600 shadow-green-600/20" 
                      : "bg-primary hover:bg-primary/90 shadow-primary/20"
                  )}
                  onClick={handleSaveTour}
                  disabled={isProcessing || isSuccess}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> {editingId ? "Saving..." : "Publishing..."}
                    </>
                  ) : isSuccess ? (
                    <>
                      <Check className="w-5 h-5" /> {editingId ? "Changes Saved!" : "Published Successfully!"}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" /> {editingId ? "Save Changes" : "Publish Experience"}
                    </>
                  )}
                </Button>
              </div>
            </section>

            <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b">
                <CardTitle className="font-headline text-2xl text-primary">Live Experiences</CardTitle>
              </CardHeader>
              {isLoading ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-accent" />
                  <p className="text-sm text-muted-foreground">Syncing tour data...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-bold">Experience</TableHead>
                      <TableHead className="font-bold">Type</TableHead>
                      <TableHead className="font-bold">Booking</TableHead>
                      <TableHead className="font-bold">Price</TableHead>
                      <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tours?.map((tour) => (
                      <TableRow key={tour.id} className={cn("hover:bg-muted/20 transition-colors", editingId === tour.id && "bg-accent/5")}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted shadow-sm">
                              <NextImage src={tour.imageUrl || tour.imageUrls?.[0] || ""} alt={tour.name} fill className="object-cover" unoptimized />
                            </div>
                            <span className="font-bold text-primary">{tour.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">{tour.type}</TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{tour.bookedSpaces || 0} / {tour.capacity}</span>
                        </TableCell>
                        <TableCell className="font-bold text-primary">₹{tour.price}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className={cn("hover:text-accent rounded-full", editingId === tour.id && "text-accent bg-accent/10")}
                              onClick={() => handleEdit(tour)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="hover:text-destructive rounded-full"
                              onClick={() => handleDelete(tour.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!tours || tours.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-lg font-bold text-primary">No Live Experiences</p>
                            <p className="text-sm text-muted-foreground">Your published tours will appear here.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
