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
import { MOCK_TOURS } from "@/lib/mock-data";
import { useState } from "react";
import { Plus, Trash2, Edit, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { toast } = useToast();
  const [tours, setTours] = useState(MOCK_TOURS);
  const [newTour, setNewTour] = useState({
    name: "",
    highlights: "",
    location: "",
    duration: "",
    audience: "",
    description: ""
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
    if (!newTour.name) {
      toast({
        variant: "destructive",
        title: "Missing Info",
        description: "Please provide at least a tour name."
      });
      return;
    }
    
    // In a real app, this would save to Firestore
    toast({
      title: "Experience Saved",
      description: "The new experience has been added to the system."
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Admin Dashboard</h1>
          <Button className="bg-accent hover:bg-accent/90 rounded-full flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add New Tour
          </Button>
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
                    placeholder="e.g. Moonlight Kayaking" 
                    value={newTour.name}
                    onChange={e => setNewTour({...newTour, name: e.target.value})}
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
                    <Input 
                      placeholder="3 hours" 
                      value={newTour.duration}
                      onChange={e => setNewTour({...newTour, duration: e.target.value})}
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
                  {tours.map((tour) => (
                    <TableRow key={tour.id}>
                      <TableCell className="font-medium">{tour.name}</TableCell>
                      <TableCell className="capitalize">{tour.type}</TableCell>
                      <TableCell>{tour.bookedSpaces} / {tour.capacity}</TableCell>
                      <TableCell>${tour.price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" className="hover:text-accent"><Edit className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-headline font-bold text-primary">Need specialized help?</h3>
                <p className="text-muted-foreground mt-1">Our customer concierge is available 24/7 for admin support.</p>
              </div>
              <Button variant="default" className="bg-primary rounded-full px-8">Contact Support</Button>
            </div>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
