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
import { useState } from "react";
import { Trash2, Edit, Save, Loader2, Sparkles, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { Tour } from "@/lib/types";
import { ImageLibrary } from "@/components/admin/ImageLibrary";
import NextImage from "next/image";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const toursQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "tours");
  }, [firestore]);

  const { data: tours, isLoading } = useCollection<Tour>(toursQuery);

  const [isPublished, setIsPublished] = useState(false);
  const [priceMode, setPriceMode] = useState<"preset" | "custom">("preset");
  const [newTour, setNewTour] = useState({
    name: "",
    highlights: "",
    location: "",
    duration: "",
    audience: "",
    description: "",
    price: 500,
    capacity: 20,
    minGroupSize: 8,
    type: "group" as const,
    imageUrls: [] as string[]
  });

  const handleSaveTour = () => {
    if (!newTour.name || !firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: !user ? "You must be signed in to save tours." : "Please provide at least a tour name."
      });
      return;
    }
    
    const tourData = {
      name: newTour.name,
      description: newTour.description,
      shortDescription: newTour.description.substring(0, 100),
      pricePerPerson: newTour.price,
      durationHours: parseInt(newTour.duration) || 1,
      minimumGroupSize: newTour.minGroupSize,
      locationId: "default_location",
      location: newTour.location || "Maroma Campus",
      duration: newTour.duration,
      capacity: newTour.capacity,
      type: newTour.type,
      highlights: newTour.highlights.split(", ").filter(h => h.length > 0),
      isActive: true,
      tourOwnerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      bookedSpaces: 0,
      imageUrl: newTour.imageUrls[0] || `https://picsum.photos/seed/${Math.random()}/1200/800`, 
      imageUrls: newTour.imageUrls,
      scheduledDates: ["2024-08-15"]
    };

    addDocumentNonBlocking(collection(firestore, "tours"), tourData);
    
    setIsPublished(true);
    setTimeout(() => setIsPublished(false), 3000);

    toast({
      title: "Experience Saved",
      description: "The new experience has been added to the system.",
    });

    setPriceMode("preset");
    setNewTour({
      name: "",
      highlights: "",
      location: "",
      duration: "",
      audience: "",
      description: "",
      price: 500,
      capacity: 20,
      minGroupSize: 8,
      type: "group",
      imageUrls: []
    });
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "tours", id));
    toast({
      title: "Tour Deleted",
      description: "The experience has been removed."
    });
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
          <Button variant="outline" className="rounded-full gap-2 border-accent text-accent hover:bg-accent/5">
            <Sparkles className="w-4 h-4" /> AI Description Generator
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-1">
            <Card className="rounded-3xl border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary">New Experience</CardTitle>
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
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price ($)</Label>
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
                        value={newTour.price}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setNewTour({...newTour, price: val === "" ? 0 : parseInt(val)});
                        }}
                        className="rounded-xl h-11 mt-2 animate-in slide-in-from-top-1 duration-200"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capacity</Label>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      value={newTour.capacity}
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

                <Button 
                  className={cn(
                    "w-full rounded-full mt-6 h-12 gap-2 shadow-lg transition-all duration-500",
                    isPublished 
                      ? "bg-green-600 hover:bg-green-600 shadow-green-600/20" 
                      : "bg-primary hover:bg-primary/90 shadow-primary/20"
                  )}
                  onClick={handleSaveTour}
                  disabled={isPublished}
                >
                  {isPublished ? (
                    <>
                      <Check className="w-4 h-4" /> Published!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Publish Experience
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-12">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Label className="text-xl font-headline font-bold text-primary">Experience Visuals</Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Browser Window</span>
              </div>
              <ImageLibrary 
                selectedUrls={newTour.imageUrls}
                onSelect={(urls) => setNewTour(prev => ({ ...prev, imageUrls: urls }))} 
              />
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
                      <TableRow key={tour.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted shadow-sm">
                              <NextImage src={tour.imageUrl} alt={tour.name} fill className="object-cover" unoptimized />
                            </div>
                            <span className="font-bold text-primary">{tour.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">{tour.type}</TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{tour.bookedSpaces || 0} / {tour.capacity}</span>
                        </TableCell>
                        <TableCell className="font-bold text-primary">${tour.price}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="hover:text-accent rounded-full"><Edit className="w-4 h-4" /></Button>
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
