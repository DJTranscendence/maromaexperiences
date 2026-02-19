"use client";

import { useState } from "react";
import { Tour } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Utensils, Coffee, Camera } from "lucide-react";

interface CorporateBookingFormProps {
  tour: Tour;
}

const ADD_ONS = [
  { id: "catering", label: "Gourmet Catering", icon: Utensils, price: 45 },
  { id: "coffee", label: "Premium Coffee Service", icon: Coffee, price: 15 },
  { id: "photo", label: "Event Photographer", icon: Camera, price: 200 },
];

export default function CorporateBookingForm({ tour }: CorporateBookingFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    toast({
      title: "Proposal Requested",
      description: "A customized PDF proposal has been sent to your email.",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" placeholder="Acme Corp" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bookingPerson">Booking Manager</Label>
          <Input id="bookingPerson" placeholder="Jane Doe" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="groupSize">Total Participants</Label>
          <Input id="groupSize" type="number" min="5" placeholder="Min 5 guests" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packageType">Package Tier</Label>
          <Select defaultValue="standard">
            <SelectTrigger>
              <SelectValue placeholder="Select Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Essential</SelectItem>
              <SelectItem value="standard">Premium Connection</SelectItem>
              <SelectItem value="luxury">Executive Retreat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-primary font-bold">Optional Experience Add-ons</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ADD_ONS.map((addon) => (
            <div 
              key={addon.id} 
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                selectedAddons.includes(addon.id) ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
              }`}
              onClick={() => toggleAddon(addon.id)}
            >
              <Checkbox checked={selectedAddons.includes(addon.id)} />
              <div className="flex items-center gap-2">
                <addon.icon className="w-4 h-4 text-accent" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{addon.label}</span>
                  <span className="text-xs text-muted-foreground">₹{addon.price}{addon.id !== "photo" ? "/pp" : ""}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full bg-primary hover:bg-primary/90 rounded-full h-12 flex items-center gap-2" disabled={loading}>
        <Building2 className="w-4 h-4" /> {loading ? "Generating Proposal..." : "Request Corporate Proposal"}
      </Button>
    </form>
  );
}
