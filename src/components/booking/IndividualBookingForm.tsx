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
  const [emailStatus, setEmailStatus] = useState<'idle' | 'failed' | 'sent'>('idle');
  
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
      toast({ variant: "destructive", title: "Wait for Session", description: "Initializing your secure booking session..." });
      return;
    }

    setLoading(true);
    setError(null);
    setEmailStatus('idle');

    if (!firestore) return;

    try {
      // 1. Update Tour Capacity
      const tourRef = doc(firestore, "tours", tour.id);
      updateDocumentNonBlocking(tourRef, {
        bookedSpaces: increment(totalGuests)
      });

      // 2. Create Booking Record
      const bookingsRef = collection(firestore, "bookings");
      const bookingId = Math.random().toString(36).substring(7).toUpperCase();
      
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
        customerName: formData.name,
        customerEmail: formData.email
      });

      // 3. Prepare Notification
      let emailBody = `Hello ${formData.name},\n\nYour booking for "${tour.name}" has been confirmed for ${totalGuests} Person(s) on ${selectedDate || "TBA"}.\n\nReference: ${bookingId}\n\nWe look forward to seeing you at Maroma!\n\nWarm regards,\nThe Maroma Team`;

      try {
        const isMinGroupReached = ((tour.bookedSpaces || 0) + totalGuests) >= (tour.minGroupSize || 1);
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
            bookerEmail: formData.email
          },
          currentBookedSpaces: (tour.bookedSpaces || 0) + totalGuests,
          minGroupSize: tour.minGroupSize,
          bookingDetailsBaseUrl: "https://maromaexperience.com/bookings",
          supportEmailAddress: "booking@maromaexperience.com"
        });
        if (notification?.message) emailBody = notification.message;
      } catch (aiErr) {
        console.warn("AI notification fallback triggered.");
      }

      setAiResponse(emailBody);

      // 4. Send Postmark Notification
      const emailResult = await sendEmailNotification({
        to: formData.email,
        subject: `Booking Confirmed: ${tour.name}`,
        textBody: emailBody
      });

      if (!emailResult.success) {
        setEmailStatus('failed');
        toast({
          variant: "destructive",
          title: "Registration Saved (Email Failed)",
          description: "Booking confirmed in system, but email notification failed. Please check Postmark configuration.",
        });
      } else {
        setEmailStatus('sent');
        toast({
          title: "Booking Successful!",
          description: `Confirmed for ${totalGuests} person(s). A receipt has been sent to your email.`,
        });
      }

    } catch (err: any) {
      setError(err.message || "Submission failed.");
      toast({ variant: "destructive", title: "Error", description: "Could not process booking." });
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
            <AlertTitle>System Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Select Workshop Date</Label>
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="h-14 rounded-2xl border-accent/20 bg-accent/5">
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
                <SelectItem value="tba" disabled>No dates scheduled</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="John Doe" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="john@example.com" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Select value={formData.countryCode} onValueChange={v => setFormData({...formData, countryCode: v})}>
                <SelectTrigger className="w-24 h-12 rounded-xl"><SelectValue placeholder="+91" /></SelectTrigger>
                <SelectContent><SelectItem value="+91">IN (+91)</SelectItem><SelectItem value="+1">US (+1)</SelectItem></SelectContent>
              </Select>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="phone" placeholder="Phone" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="pl-10 rounded-xl h-12" />
              </div>
            </div>
          </div>
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-4">
              <Label className="w-32">Adults (₹{tour.price})</Label>
              <Input type="number" min="0" value={adults} onChange={e => setAdults(Math.max(0, parseInt(e.target.value) || 0))} className="rounded-xl h-12" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32">Children (₹{childPrice})</Label>
              <Input type="number" min="0" value={children} onChange={e => setChildren(Math.max(0, parseInt(e.target.value) || 0))} className="rounded-xl h-12" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-accent" />
            <div className="text-2xl font-bold font-headline text-primary">₹{totalPrice}</div>
          </div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Total to pay</span>
        </div>

        <Button type="submit" disabled={loading || totalGuests === 0 || !selectedDate || isUserLoading} className="w-full bg-accent hover:bg-accent/90 text-white rounded-full h-12 gap-2 shadow-lg font-bold">
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Complete Booking"}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </form>

      <Dialog open={!!aiResponse} onOpenChange={() => setAiResponse(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary font-headline text-2xl"><MessageSquare className="w-6 h-6 text-accent" /> Booking Successful!</DialogTitle>
            <DialogDescription>Your experience at Maroma is confirmed.</DialogDescription>
          </DialogHeader>
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 mt-4 whitespace-pre-wrap font-body text-primary leading-relaxed text-sm">
            {aiResponse}
          </div>
          {emailStatus === 'failed' && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-bold text-rose-900">Email Notification Failed</p>
                <p className="text-[10px] text-rose-800 leading-tight">We were unable to send an automated receipt. Please take a screenshot of this confirmation for your records.</p>
              </div>
            </div>
          )}
          <Button onClick={() => setAiResponse(null)} className="w-full mt-6 bg-primary rounded-full font-bold">Done</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
