"use client";

import { useState } from "react";
import { Tour } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  UtensilsCrossed, 
  Coffee, 
  Camera, 
  Hotel, 
  ChevronDown,
  Info,
  ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CorporateBookingFormProps {
  tour: Tour;
}

const ADD_ONS = [
  { id: "catering", label: "Gourmet Catering", icon: UtensilsCrossed, price: 45 },
  { id: "coffee", label: "Premium Coffee Service", icon: Coffee, price: 15 },
  { id: "accommodation", label: "Accommodation", icon: Hotel, price: 250 },
  { id: "photo", label: "Event Photographer", icon: Camera, price: 200 },
];

const LOCAL_HOTELS = [
  { name: "Maroma Resort & Spa", url: "https://www.belmond.com/hotels/north-america/mexico/riviera-maya/belmond-maroma-resort-and-spa/" },
  { name: "Secrets Maroma Beach", url: "https://www.amrcollection.com/en/resorts-hotels/secrets/mexico/maroma-beach-riviera-cancun/" },
  { name: "Catalonia Playa Maroma", url: "https://www.cataloniahotels.com/en/hotel/catalonia-playa-maroma" },
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company Name</Label>
          <Input id="companyName" placeholder="Acme Corp" required className="rounded-xl h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bookingPerson" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Booking Manager</Label>
          <Input id="bookingPerson" placeholder="Jane Doe" required className="rounded-xl h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="groupSize" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Participants</Label>
          <Input id="groupSize" type="number" min="5" placeholder="Min 5 Person(s)" required className="rounded-xl h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packageType" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Package Tier</Label>
          <Select defaultValue="standard">
            <SelectTrigger className="rounded-xl h-12">
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
                    
                    {addon.id === 'catering' && (
                      <>
                        <span className="text-muted-foreground/30">•</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="link" size="sm" className="h-auto p-0 text-accent font-bold text-[10px] uppercase tracking-widest hover:text-accent/80 transition-colors gap-1">
                              View Menu <ChevronDown className="w-2.5 h-2.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-2xl w-64 shadow-2xl border-none p-2" align="start">
                            <DropdownMenuLabel className="font-headline text-sm flex items-center gap-2">
                              <UtensilsCrossed className="w-4 h-4 text-accent" /> Catering Options
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem className="rounded-xl py-2 cursor-pointer" checked>
                              Standard Continental (included)
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem className="rounded-xl py-2 cursor-pointer">
                              Vegetarian Fusion (+₹10/pp)
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem className="rounded-xl py-2 cursor-pointer">
                              Organic Farm-to-Table (+₹25/pp)
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            <div className="p-3 bg-muted/20 rounded-xl text-[10px] text-muted-foreground leading-relaxed flex items-start gap-2">
                              <Info className="w-3.5 h-3.5 shrink-0 text-accent" />
                              Selecting a menu will update your formal proposal details.
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}

                    {addon.id === 'accommodation' && (
                      <>
                        <span className="text-muted-foreground/30">•</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="link" size="sm" className="h-auto p-0 text-accent font-bold text-[10px] uppercase tracking-widest hover:text-accent/80 transition-colors gap-1">
                              View Hotels <ChevronDown className="w-2.5 h-2.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-2xl w-64 shadow-2xl border-none p-2" align="start">
                            <DropdownMenuLabel className="font-headline text-sm flex items-center gap-2">
                              <Hotel className="w-4 h-4 text-accent" /> Local Hotels
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {LOCAL_HOTELS.map((hotel) => (
                              <a 
                                key={hotel.name}
                                href={hotel.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between rounded-xl py-2 px-3 text-sm hover:bg-accent/5 transition-colors group/link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="truncate">{hotel.name}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover/link:text-accent transition-colors" />
                              </a>
                            ))}
                            <DropdownMenuSeparator />
                            <div className="p-3 bg-muted/20 rounded-xl text-[10px] text-muted-foreground leading-relaxed flex items-start gap-2">
                              <Info className="w-3.5 h-3.5 shrink-0 text-accent" />
                              We can coordinate direct group booking rates for these locations.
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
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
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Proposal...
            </div>
          ) : (
            <>
              <Building2 className="w-5 h-5" /> Request Corporate Proposal
            </>
          )}
        </Button>
        <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-[0.2em] font-medium">
          No credit card required for proposals
        </p>
      </div>
    </form>
  );
}
