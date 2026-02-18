"use client";

import { useState } from "react";
import { Tour } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, CreditCard, ChevronRight, MessageSquare, AlertCircle } from "lucide-react";
import { generateBookingNotification } from "@/ai/flows/generate-booking-notification";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface IndividualBookingFormProps {
  tour: Tour;
}

export default function IndividualBookingForm({ tour }: IndividualBookingFormProps) {
  const { toast } = useToast();
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate booking process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const isMinGroupReached = (tour.bookedSpaces + guests) >= tour.minGroupSize;
      
      try {
        // Call GenAI notification flow
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
            bookerPhone: formData.phone
          },
          currentBookedSpaces: tour.bookedSpaces + guests,
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              placeholder="+1 (555) 000-0000" 
              required 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <div className="flex items-center gap-4">
              <Input 
                id="guests" 
                type="number" 
                min="1" 
                max={tour.capacity - tour.bookedSpaces} 
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                required 
              />
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                ${tour.price} / each
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Total to pay</div>
              <div className="text-2xl font-bold font-headline text-primary">${total}</div>
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-white rounded-full px-8 h-12 flex items-center gap-2"
          >
            {loading ? "Processing..." : "Complete Booking"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <CreditCard className="w-3 h-3" /> Secure checkout powered by Stripe
        </p>
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
          <Button onClick={() => setAiResponse(null)} className="w-full mt-6 bg-primary rounded-full">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
