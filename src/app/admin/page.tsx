
"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, Trash2, Edit, Save, Loader2, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { Tour } from "@/lib/types";
import { ImageLibrary } from "@/components/admin/ImageLibrary";
import NextImage from "next/image";

export default function AdminPage() {
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const { user } = useUser();
  
  const toursQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "tours");
  }, [firestore]);

  const { data: tours, isLoading } = useCollection<Tour>(toursQuery);

  const [newTour, setNewTour] = useState({
    name: "",
    highlights: "",
    location: "",
    duration: "",
    audience: "",
    description: "",
    price: 0,
    capacity: 20,
    minGroupSize: 8,
    type: "group" as const,
    imageUrls: [] as string[]
  });

  const HIGHLIGHT_OPTIONS = [
    "Tour",
    "Q&A",
    "Presentation",
    "Refreshments",
    "Take-home Gift"
  ];

  const handleHighlightChange = (option: string, checked: boolean) => {
    const currentHighlights = newTour.highlights ? newTour.highlights.split(", ").filter(h => h.length > 0) : [];
    let updated;
    if (checked) {
      updated = [...currentHighlights, option];
    } else {
      updated = currentHighlights.filter(h => h !== option);
    }
    setNewTour({ ...newTour, highlights: updated.join(", ") });
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
    
    const tourData = {
      name: newTour.name,
      description: newTour.description,
      shortDescription: newTour.description.substring(0, 100),
      pricePerPerson: newTour.price,
      durationHours: parseInt(newTour.duration) || 1,
      minimumGroupSize: newTour.minGroupSize,
      locationId: "default_location", // Reference to a real location if implemented
      location: newTour.location, // Denormalized for simpler UI
      duration: newTour.duration, // Denormalized for simpler UI
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
    
    toast({
      title: "Experience Saved",
      description: "The new experience has been added to the system.",
    });

    setNewTour({
      name: "",
      highlights: "",
      location: "",
      duration: "",
      audience: "",
      description: "",
      price: 0,
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

  const removeImage = (url: string) => {
    setNewTour(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter(u => u !== url)
    }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Admin Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Create Tour Form */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl border-none shadow-xl sticky top-24">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Create Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Experience Name</Label>
                  <Input 
                    placeholder="e.g. Maroma Perfum Experience" 
                    value={newTour.name}
                    onChange={e => setNewTour({...newTour, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Experience Media</Label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {newTour.imageUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                        <NextImage src={url} alt="Tour image" fill className="object-cover" />
                        <button 
                          onClick={() => removeImage(url)}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <ImageLibrary 
                    selectedUrls={newTour.imageUrls}
                    onSelect={(urls) => setNewTour(prev => ({ ...prev, imageUrls: urls }))} 
                  />
                </div>

                <div className="space-y-3">
                  <Label>Highlights</Label>
                  <div className="grid grid-cols-1 gap-3 p-4 border rounded-xl bg-muted/20">
                    {HIGHLIGHT_OPTIONS.map((option) => (
                      <div key={option} className="flex items-center space-x-3">
                        <Checkbox 
                          id={`highlight-${option}`}
                          checked={newTour.highlights.split(", ").includes(option)}
                          onCheckedChange={(checked) => handleHighlightChange(option, checked === true)}
                        />
                        <Label 
                          htmlFor={`highlight-${option}`} 
                          className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select 
                      value={newTour.location}
                      onValueChange={value => setNewTour({...newTour, location: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="The Maroma Campus">The Maroma Campus</SelectItem>
                        <SelectItem value="The Maroma Spa">The Maroma Spa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select 
                      value={newTour.duration}
                      onValueChange={value => setNewTour({...newTour, duration: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select duration" />
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
                    <Label>Price ($)</Label>
                    <Input 
                      type="number"
                      value={newTour.price}
                      onChange={e => setNewTour({...newTour, price: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input 
                      type="number"
                      value={newTour.capacity}
                      onChange={e => setNewTour({...newTour, capacity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    className="min-h-[150px]" 
                    placeholder="Describe the experience..." 
                    value={newTour.description}
                    onChange={e => setNewTour({...newTour, description: e.target.value})}
                  />
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 rounded-full mt-6 flex items-center gap-2 h-12"
                  onClick={handleSaveTour}
                >
                  <Save className="w-4 h-4" /> Save Experience
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Manage Existing Tours */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-2xl border-none shadow-xl overflow-hidden">
              <CardHeader className="bg-white">
                <CardTitle className="font-headline text-2xl">Manage Tours</CardTitle>
              </CardHeader>
              {isLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Experience</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tours?.map((tour) => (
                      <TableRow key={tour.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                              <NextImage src={tour.imageUrl} alt={tour.name} fill className="object-cover" />
                            </div>
                            <span>{tour.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{tour.type}</TableCell>
                        <TableCell>{tour.bookedSpaces || 0} / {tour.capacity}</TableCell>
                        <TableCell>${tour.price}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="hover:text-accent"><Edit className="w-4 h-4" /></Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="hover:text-destructive"
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
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No experiences found. Create your first one!</TableCell>
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
