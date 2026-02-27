"use client";

import { useState, useEffect } from "react";
import { Tour } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { 
  Building2, 
  UtensilsCrossed, 
  Coffee, 
  Camera, 
  Hotel, 
  ChevronDown,
  Info,
  ExternalLink,
  Loader2
} from "lucide-react";
import { sendEmailNotification } from "@/app/actions/notifications";

interface CorporateBookingFormProps {
  tour: Tour;
}

const ADD_ONS = [
  { id: "catering", label: "Gourmet Catering", icon: UtensilsCrossed, price: 45 },
  { id: "coffee", label: "Premium Coffee Service", icon: Coffee, price: 15 },
  { id: "accommodation", label: "Accommodation", icon: Hotel, price: 250 },
  { id: "photo", label: "Event Photographer", icon: Camera, price: 200 },
];

export default function CorporateBookingForm({ tour }: CorporateBookingFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    participants: "10",
    packageTier: "standard"
  });

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Auth Required", description: "Sign in to request a proposal." });
      return;
    }

    setLoading(true);
    
    try {
      addDocumentNonBlocking(collection(firestore, "proposals"), {
        userId: user.uid,
        ...formData,
        tourId: tour.id,
        packageName: tour.name,
        itinerary: [{ id: tour.id, name: tour.name, type: 'Experience' }],
        catering: selectedAddons.includes('catering') ? "Gourmet Catering" : "Standard",
        addons: selectedAddons,
        hotel: selectedAddons.includes('accommodation') ? "To be confirmed" : "Not selected",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send Customer Notification
      await sendEmailNotification({
        to: formData.email,
        subject: `Proposal Received: ${tour.name}`,
        textBody: `Hello ${formData.contactName},\n\nThank you for choosing Maroma Experiences for your corporate retreat. We have received your request for "${tour.name}" for ${formData.participants} participants.\n\nOur event design team is currently reviewing your custom itinerary and add-ons. We will contact you within 24 hours with a formal proposal and quote.\n\nWarm regards,\nThe Maroma Team`
      });

      toast({
        title: "Proposal Requested",
        description: "Your request has been sent. Check your email for a confirmation receipt.",
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not submit proposal request." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company Name</Label>
          <Input 
            id="companyName" 
            placeholder="Acme Corp" 
            required 
            className="rounded-xl h-12"
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Booking Manager</Label>
          <Input 
            id="contactName" 
            placeholder="Jane Doe" 
            required 
            className="rounded-xl h-12" 
            value={formData.contactName}
            onChange={(e) => setFormData({...formData, contactName: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="jane@company.com" 
            required 
            className="rounded-xl h-12" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="participants" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Participants</Label>
          <Input 
            id="participants" 
            type="number" 
            min="5" 
            placeholder="Min 5 Person(s)" 
            required 
            className="rounded-xl h-12" 
            value={formData.participants}
            onChange={(e) => setFormData({...formData, participants: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <Label className="text-primary font-bold font-headline text-lg">Experience Add-ons</Label>
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Optional</span>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {ADD_ONS.map((addon) => (
            <div 
              key={addon.id} 
              className={`flex items-center gap-5 p-5 rounded-[2rem] border transition-all cursor-pointer bg-white group ${
                selectedAddons.includes(addon.id) ? "border-accent shadow-md ring-1 ring-accent/20" : "border-border hover:border-accent/30 hover:shadow-sm"
              }`}
              onClick={() => toggleAddon(addon.id)}
            >
              <div className="flex-shrink-0">
                <Checkbox 
                  checked={selectedAddons.includes(addon.id)} 
                  className="w-6 h-6 rounded-full border-muted-foreground data-[state=checked]:bg-accent data-[state=checked]:border-accent transition-colors"
                  onCheckedChange={() => toggleAddon(addon.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              <div className="flex-grow flex items-start gap-3">
                <div className="mt-1 p-1 bg-accent/5 rounded-lg group-hover:bg-accent/10 transition-colors">
                  <addon.icon className="w-5 h-5 text-accent" />
                </div>
                
                <div className="flex flex-col">
                  <span className="text-lg font-headline font-bold text-primary leading-tight">{addon.label}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-muted-foreground font-medium">₹{addon.price}{addon.id !== "photo" ? "/pp" : ""}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-14 font-bold text-lg shadow-xl shadow-primary/10 transition-all active:scale-[0.98] gap-3" disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </div>
          ) : (
            <>
              <Building2 className="w-5 h-5" /> Request Corporate Proposal
            </>
          )}
        </Button>
        <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-[0.2em] font-medium">
          Subject to Admin Approval
        </p>
      </div>
    </form>
  );
}
