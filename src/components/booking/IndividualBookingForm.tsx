"use client";

import { useState, useEffect } from "react";
import { Tour } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ChevronRight, MessageSquare, AlertCircle, Phone } from "lucide-react";
import { generateBookingNotification } from "@/ai/flows/generate-booking-notification";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, increment, collection, serverTimestamp } from "firebase/firestore";

interface IndividualBookingFormProps {
  tour: Tour;
}

export default function IndividualBookingForm({ tour }: IndividualBookingFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "+91"
  });

  // Fetch user profile data for auto-fill
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  // Populate form when user profile is loaded
  useEffect(() => {
    if (userData) {
      setFormData({
        name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
        email: userData.email || "",
        phone: userData.phoneNumber || "",
        countryCode: userData.countryCode || "+91"
      });
    } else if (user && !userData) {
      // Fallback to auth provider info if Firestore profile isn't fully loaded yet
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        name: user.displayName || prev.name
      }));
    }
  }, [userData, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!firestore) return;

    try {
      // 1. Update the booked spaces in Firestore (Non-blocking)
      const tourRef = doc(firestore, "tours", tour.id);
      updateDocumentNonBlocking(tourRef, {
        bookedSpaces: increment(guests)
      });

      // 2. Create a real booking record in the bookings collection
      const bookingsRef = collection(firestore, "bookings");
      addDocumentNonBlocking(bookingsRef, {
        userId: user?.uid || "guest",
        tourId: tour.id,
        tourName: tour.name,
        tourDate: tour.scheduledDates?.[0] || "TBA",
        location: tour.location || "Maroma Campus",
        bookingType: 'Individual',
        numberOfAttendees: guests,
        totalPrice: guests * tour.price,
        bookingStatus: 'confirmed',
        bookedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        specialInstructions: ""
      });

      // 3. Simulate short processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isMinGroupReached = (tour.bookedSpaces + guests) >= tour.minGroupSize;
      
      const fullPhone = `${formData.countryCode} ${formData.phone}`;

      try {
        // 4. Call GenAI notification flow
        const notification = await generateBookingNotification({
          eventType: isMinGroupReached ? 'minimum_group_size_reached' : 'booking_confirmation',
          recipientType: 'booker',
          bookingDetails: {
            bookingId: Math.random().toString(36).substring(7).toUpperCase(),
            tourName: tour.name,
            tourDate: tour.scheduledDates?.[0] || "TBA",
            tourTime: "10:00 AM",
            numberOfGuests: guests,
            bookedBy: formData.name,
            bookerEmail: formData.email,
            bookerPhone: fullPhone
          },
          currentBookedSpaces: (tour.bookedSpaces || 0) + guests,
          minGroupSize: tour.minGroupSize,
          bookingDetailsBaseUrl: "https://maroma.com/bookings",
          supportEmailAddress: "support@maroma.com"
        });

        setAiResponse(notification.message);
      } catch (aiErr: any) {
        console.warn("AI Notification failed:", aiErr);
        // Fallback message if AI fails
        setAiResponse(`Hello ${formData.name}, your booking for ${tour.name} is confirmed for ${guests} guests. Thank you!`);
      }

      toast({
        title: "Booking Successful!",
        description: isMinGroupReached 
          ? `Min group of ${tour.minGroupSize} reached! This experience is guaranteed to run.` 
          : `Your reservation for ${guests} guests has been confirmed.`,
      });

    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again later.");
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "Could not complete your booking.",
      });
    } finally {
      setLoading(false);
    }
  };

  const total = guests * tour.price;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="John Doe" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="rounded-xl h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="john@example.com" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="rounded-xl h-12"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Select 
                value={formData.countryCode} 
                onValueChange={(v) => setFormData({...formData, countryCode: v})}
              >
                <SelectTrigger className="w-24 h-12 rounded-xl">
                  <SelectValue placeholder="+91" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+91">IN (+91)</SelectItem>
                  <SelectItem value="+1">US (+1)</SelectItem>
                  <SelectItem value="+44">UK (+44)</SelectItem>
                  <SelectItem value="+971">UAE (+971)</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="phone" 
                  placeholder="09486623749" 
                  required 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="pl-10 rounded-xl h-12"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <div className="flex items-center gap-4">
              <Input 
                id="guests" 
                type="number" 
                min="1" 
                max={tour.capacity - (tour.bookedSpaces || 0)} 
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                className="rounded-xl h-12"
                required 
              />
              <div className="text-sm text-muted-foreground whitespace-nowrap font-medium">
                ₹{tour.price} / guest
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Users className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Total to pay</div>
            <div className="text-2xl font-bold font-headline text-primary">₹{total}</div>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-accent hover:bg-accent/90 text-white rounded-full h-12 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-95 font-bold"
        >
          {loading ? "Processing..." : "Complete Booking"}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </form>

      <Dialog open={!!aiResponse} onOpenChange={() => setAiResponse(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary font-headline text-2xl">
              <MessageSquare className="w-6 h-6 text-accent" /> Booking Confirmed!
            </DialogTitle>
            <DialogDescription>
              Your booking for {tour.name} has been processed. Here is your confirmation message.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 mt-4 whitespace-pre-wrap font-body text-primary leading-relaxed">
            {aiResponse}
          </div>
          <Button onClick={() => setAiResponse(null)} className="w-full mt-6 bg-primary rounded-full font-bold">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
