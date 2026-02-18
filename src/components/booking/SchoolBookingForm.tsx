
"use client";

import { useState } from "react";
import { Tour } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Calendar, Send } from "lucide-react";

interface SchoolBookingFormProps {
  tour: Tour;
}

export default function SchoolBookingForm({ tour }: SchoolBookingFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    toast({
      title: "Inquiry Sent",
      description: "Our educational team will contact you within 24 hours with a custom quote.",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="schoolName">School Name</Label>
          <Input id="schoolName" placeholder="Greenwood High" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPerson">Lead Teacher / Contact</Label>
          <Input id="contactPerson" placeholder="Mr. Smith" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentCount">Number of Students</Label>
          <Input id="studentCount" type="number" min="10" placeholder="Min 10 students" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="educationLevel">Educational Level</Label>
          <Select required>
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary (K-6)</SelectItem>
              <SelectItem value="secondary">Secondary (7-12)</SelectItem>
              <SelectItem value="higher">Higher Education</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="objectives">Learning Objectives (Optional)</Label>
        <Textarea id="objectives" placeholder="Tell us what you'd like your students to gain from this experience..." />
      </div>
      <Button className="w-full bg-primary hover:bg-primary/90 rounded-full h-12 flex items-center gap-2" disabled={loading}>
        <Send className="w-4 h-4" /> {loading ? "Sending Inquiry..." : "Submit School Inquiry"}
      </Button>
    </form>
  );
}
