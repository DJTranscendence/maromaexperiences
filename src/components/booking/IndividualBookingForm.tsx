
"use client";

import { useState, useEffect, useRef } from "react";
import { Tour } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ChevronRight, MessageSquare, AlertCircle, Phone, Loader2, Baby, Calendar } from "lucide-react";
import { generateBookingNotification } from "@/ai/flows/generate-booking-notification";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, increment, collection, serverTimestamp } from "firebase/firestore";
import { sendEmailNotification } from "@/app/actions/notifications";
import { format, parseISO } from "date-fns";

interface IndividualBookingFormProps {
  tour: Tour;
}

export default function IndividualBookingForm({ tour }: IndividualBookingFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [selectedDate, setSelectedDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "+91"
  });

  const isInitialized = useRef(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  useEffect(() => {
    if (tour?.scheduledDates?.length > 0 && !selectedDate) {
      setSelectedDate(tour.scheduledDates[0]);
    }
  }, [tour, selectedDate]);

  useEffect(() => {
    if (userData && !isInitialized.current) {
      setFormData({
        name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
        email: userData.email || "",
        phone: userData.phoneNumber || "",
        countryCode: userData.countryCode || "+91"
      });
      isInitialized.current = true;
    } else if (user && !userData && !isInitialized.current) {
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email || "",
        name: user.displayName || prev.name || ""
      }));
    }
  }, [userData, user]);

  const totalGuests = adults + children;
  const childPrice = tour.childPrice ?? 300;
  const totalPrice = (adults * (tour.price || 0)) + (children * childPrice);
  const remainingCapacity = (tour.capacity || 0) - (tour.bookedSpaces || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Session Initializing", description: "Please wait a moment for your session to start." });
      return;
    }

    setLoading(true);
    setError(null);

    if (!firestore) return;

    try {
      const tourRef = doc(firestore, "tours", tour.id);
      updateDocumentNonBlocking(tourRef, {
        bookedSpaces: increment(totalGuests)
      });

      const bookingsRef = collection(firestore, "bookings");
      addDocumentNonBlocking(bookingsRef, {
        userId: user.uid,
        tourId: tour.id,
        tourName: tour.name,
        tourDate: selectedDate || "TBA",
        location: tour.location || "Maroma Campus",
        bookingType: 'Individual',
        numberOfAttendees: totalGuests,
        adultCount: adults,
        childCount: children,
        totalPrice: totalPrice,
        bookingStatus: 'confirmed',
        bookedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        specialInstructions: ""
      });

      const isMinGroupReached = ((tour.bookedSpaces || 0) + totalGuests) >= (tour.minGroupSize || 1);
      const fullPhone = `${formData.countryCode} ${formData.phone}`;
      const bookingId = Math.random().toString(36).substring(7).toUpperCase();

      let emailBody = `Hello ${formData.name},\n\nYour booking for "${tour.name}" has been confirmed for ${totalGuests} Person(s) (${adults} Adult, ${children} Child) on ${selectedDate || "TBA"}.\n\nLocation: ${tour.location || "Maroma Campus"}\nBooking Reference: ${bookingId}\n\nWe look forward to seeing you there!\n\nWarm regards,\nThe Maroma Team`;

      try {
        const notification = await generateBookingNotification({
          eventType: isMinGroupReached ? 'minimum_group_size_reached' : 'booking_confirmation',
          recipientType: 'booker',
          bookingDetails: {
            bookingId: bookingId,
            tourName: tour.name,
            tourDate: selectedDate || "TBA",
            tourTime: "10:00 AM",
            numberOfGuests: totalGuests,
            bookedBy: formData.name,
            bookerEmail: formData.email,
            bookerPhone: fullPhone
          },
          currentBookedSpaces: (tour.bookedSpaces || 0) + totalGuests,
          minGroupSize: tour.minGroupSize,
          bookingDetailsBaseUrl: "https://maromaexperience.com/bookings",
          supportEmailAddress: "booking@maromaexperience.com"
        });

        if (notification && notification.message) {
          emailBody = notification.message;
        }
      } catch (aiErr) {
        console.warn("AI notification generation failed, falling back to standard template:", aiErr);
      }

      setAiResponse(emailBody);

      const emailResult = await sendEmailNotification({
        to: formData.email,
        subject: `Booking Confirmed: ${tour.name}`,
        textBody: emailBody
      });

      if (!emailResult.success) {
        console.error("Postmark Delivery Error:", emailResult.error);
        toast({
          variant: "destructive",
          title: "Registration Logged",
          description: "Booking confirmed, but we had trouble sending your confirmation email. Please take a screenshot of this screen.",
        });
      } else {
        toast({
          title: "Booking Successful!",
          description: isMinGroupReached 
            ? `Min group reached! This experience is guaranteed to run.` 
            : `Your reservation has been confirmed. A confirmation email has been sent.`,
        });
      }

      if (tour.facilitatorEmail) {
        await sendEmailNotification({
          to: tour.facilitatorEmail,
          subject: `New Booking Update: ${tour.name}`,
          textBody: `Hello,\n\nA new booking has been confirmed for your experience "${tour.name}".\n\nDate: ${selectedDate || "TBA"}\nTotal Guests: ${totalGuests} (${adults} A / ${children} C)\nTotal Booked: ${(tour.bookedSpaces || 0) + totalGuests}\n\nBooked By: ${formData.name}\n\nWarm regards,\nMaroma System`
        });
      }

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

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Select Workshop Date</Label>
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="h-14 rounded-2xl border-accent/20 bg-accent/5 focus:ring-accent">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-accent" />
                <SelectValue placeholder="Choose a date" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {tour.scheduledDates?.length > 0 ? (
                tour.scheduledDates.map((date) => (
                  <SelectItem key={date} value={date} className="rounded-xl">
                    {format(parseISO(date), 'EEEE, MMMM do, yyyy')}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="tba" disabled>No upcoming dates scheduled</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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
          <div className="space-y-4 md:col-span-2">
            <div className="space-y-2">
              <Label htmlFor="adults">Number of Adults</Label>
              <div className="flex items-center gap-4">
                <Input 
                  id="adults" 
                  type="number" 
                  min="0" 
                  max={remainingCapacity > 0 ? remainingCapacity - children : 0} 
                  value={adults}
                  onChange={(e) => setAdults(Math.max(0, parseInt(e.target.value) || 0))}
                  className="rounded-xl h-12"
                  required 
                />
                <div className="text-sm text-muted-foreground whitespace-nowrap font-medium">
                  ₹{tour.price || 0} / Adult
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="children" className="flex items-center gap-1.5"><Baby className="w-3.5 h-3.5 text-accent" /> Number of Children</Label>
                <span className="text-[9px] font-bold uppercase tracking-widest text-accent">Under 14 as of Jan 1 2026</span>
              </div>
              <div className="flex items-center gap-4">
                <Input 
                  id="children" 
                  type="number" 
                  min="0" 
                  max={remainingCapacity > 0 ? remainingCapacity - adults : 0} 
                  value={children}
                  onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  className="rounded-xl h-12"
                  required 
                />
                <div className="text-sm text-muted-foreground whitespace-nowrap font-medium">
                  ₹{childPrice} / Child
                </div>
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
            <div className="text-2xl font-bold font-headline text-primary">₹{totalPrice}</div>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading || totalGuests === 0 || !selectedDate || isUserLoading}
          className="w-full bg-accent hover:bg-accent/90 text-white rounded-full h-12 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-95 font-bold"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Complete Booking"}
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
