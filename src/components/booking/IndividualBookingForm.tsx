"use client";

import { useState, useEffect, useRef } from "react";
import { Tour } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Users, ChevronRight, MessageSquare, AlertCircle, Phone, Loader2, Baby, Calendar } from "lucide-react";
import { useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, increment, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Wait for Session", description: "Initializing your secure booking session..." });
      return;
    }

    setLoading(true);
    setError(null);

    if (!firestore) return;

    try {
      // 1. Update Tour Capacity (Non-blocking as per guidelines)
      const tourDocRef = doc(firestore, "tours", tour.id);
      updateDocumentNonBlocking(tourDocRef, {
        bookedSpaces: increment(totalGuests)
      });

      // 2. Create Booking Record
      const bookingsRef = collection(firestore, "bookings");
      
      const newBooking = {
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
        confirmationStatus: 'pending_min_required',
        bookedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        customerName: formData.name,
        customerEmail: formData.email
      };

      // We await this one because we NEED the resulting ID for the threshold check if we hit 8
      const bookingDoc = await addDocumentNonBlocking(bookingsRef, newBooking);
      const bookingId = bookingDoc?.id;

      // 3. Logic: Check total bookings for this tour/date
      const q = query(collection(firestore, "bookings"), where("tourId", "==", tour.id), where("tourDate", "==", selectedDate));
      const querySnap = await getDocs(q);
      
      let runningTotal = 0;
      const allGuests: any[] = [];
      querySnap.forEach(doc => {
        const data = doc.data();
        if (data.confirmationStatus !== 'cancelled') {
          runningTotal += (data.numberOfAttendees || 0);
          allGuests.push({ id: doc.id, ...data });
        }
      });

      const firstName = formData.name.split(' ')[0] || "there";
      let finalEmailBody = "";
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://maromaexperience.com';

      if (runningTotal < 8) {
        // Minimum not reached
        finalEmailBody = `Hello ${firstName},

We have received your booking for the "${tour.name}"!

This tour has not yet reached the minimum required number of bookings (eight). Once this tour has reached eight bookings (including yours) we will notify you by email.

If you have other people who you think might also enjoy the Tour, you could create a group (of eight minimum) and we'll setup the tour for you on the next available date.

If you have any questions or queries, please feel free email me at bookings@maromaexperience.com or WhatsApp to +91 948 6623 749.

We look forward to seeing you at Maroma!

Warm regards,

Jesse Fox-Allen
Maroma Experiences`;

        await sendEmailNotification({
          to: formData.email,
          subject: `Booking Received: ${tour.name} (Pending Min. Group)`,
          textBody: finalEmailBody
        });
      } else {
        // Threshold reached or exceeded - send interactive confirmation to ALL
        for (const guest of allGuests) {
          const guestFirstName = guest.customerName?.split(' ')[0] || "there";
          const confirmUrl = `${currentOrigin}/confirm-booking?id=${guest.id}&action=yes`;
          const cancelUrl = `${currentOrigin}/confirm-booking?id=${guest.id}&action=no`;

          await sendEmailNotification({
            to: guest.customerEmail,
            subject: `CONFIRMATION REQUIRED: ${tour.name} on ${selectedDate}`,
            textBody: `Hello ${guestFirstName},\n\nThe ${tour.name} on ${selectedDate} has reached the minimum required number of bookings!\n\nPlease confirm that you will be attending this Tour by clicking one of the options below:\n\n[YES] I'll be there: ${confirmUrl}\n[NO] I cannot make it: ${cancelUrl}\n\nWe look forward to seeing you at Maroma!`,
            htmlBody: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4b828b;">Minimum Group Size Reached!</h2>
                <p>Hello ${guestFirstName},</p>
                <p>The <strong>${tour.name}</strong> on <strong>${selectedDate}</strong> has reached the minimum required number of bookings!</p>
                <p>Please confirm your attendance below:</p>
                <div style="margin: 30px 0;">
                  <a href="${confirmUrl}" style="background-color: #4b828b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; margin-right: 15px; display: inline-block;">I'll be there!</a>
                  <a href="${cancelUrl}" style="background-color: #f1f5f9; color: #64748b; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">I cannot make it</a>
                </div>
                <p style="font-size: 12px; color: #94a3b8;">Warm regards,<br>The Maroma Team</p>
              </div>
            `
          });
        }

        // Alert Admin
        await sendEmailNotification({
          to: "indispirit@gmail.com",
          subject: `[THRESHOLD REACHED] ${tour.name} on ${selectedDate}`,
          textBody: `Good news! The tour for ${tour.name} on ${selectedDate} has reached ${runningTotal} bookings.\n\nConfirmation requests have been dispatched to all guests.`
        });

        finalEmailBody = `The group size for "${tour.name}" has reached the minimum threshold! We have sent a confirmation request to your email. Please check and click "I'll be there!" to finalize your spot.`;
      }

      setAiResponse(finalEmailBody);
      toast({ title: "Booking Successful!" });

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
            <DialogTitle className="flex items-center gap-2 text-primary font-headline text-2xl"><MessageSquare className="w-6 h-6 text-accent" /> Booking Received!</DialogTitle>
            <DialogDescription>Your experience at Maroma is being processed.</DialogDescription>
          </DialogHeader>
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 mt-4 whitespace-pre-wrap font-body text-primary leading-relaxed text-sm">
            {aiResponse}
          </div>
          <Button onClick={() => setAiResponse(null)} className="w-full mt-6 bg-primary rounded-full font-bold">Done</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}