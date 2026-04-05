
"use client";

import { useState } from "react";
import { Tour } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Calendar, Send, Loader2 } from "lucide-react";
import { sendEmailNotification } from "@/app/actions/notifications";

interface SchoolBookingFormProps {
  tour: Tour;
}

export default function SchoolBookingForm({ tour }: SchoolBookingFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: "",
    contactPerson: "",
    email: "",
    studentCount: "20",
    educationLevel: "secondary",
    objectives: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Send notification to the school contact
      const emailResult = await sendEmailNotification({
        to: formData.email,
        subject: `School Inquiry Received: ${tour.name}`,
        textBody: `Hello ${formData.contactPerson},\n\nThank you for inquiring about educational experiences at Maroma. We have received your request for "${tour.name}" for ${formData.schoolName}.\n\nOur educational team is reviewing your requirements for ${formData.studentCount} students (${formData.educationLevel}). We will contact you within 24 hours with a custom quote and educational plan.\n\nBest regards,\nThe Maroma Education Team\nhttps://maromaexperience.com`
      });

      if (!emailResult.success) {
        console.error("Email Delivery Error:", emailResult.error);
        toast({
          variant: "destructive",
          title: "Inquiry Logged",
          description: "Inquiry received, but email confirmation failed. Our educational team will still review your request.",
        });
      } else {
        toast({
          title: "Inquiry Sent",
          description: "Our educational team will contact you within 24 hours. A receipt has been sent to your email.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not submit inquiry. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="schoolName">School Name</Label>
          <Input 
            id="schoolName" 
            placeholder="Greenwood High" 
            required 
            value={formData.schoolName}
            onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPerson">Lead Teacher / Contact</Label>
          <Input 
            id="contactPerson" 
            placeholder="Mr. Smith" 
            required 
            value={formData.contactPerson}
            onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="school-email">Email Address</Label>
          <Input 
            id="school-email" 
            type="email" 
            placeholder="smith@school.edu" 
            required 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentCount">Number of Students</Label>
          <Input 
            id="studentCount" 
            type="number" 
            min="10" 
            placeholder="Min 10 students" 
            required 
            value={formData.studentCount}
            onChange={(e) => setFormData({...formData, studentCount: e.target.value})}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="educationLevel">Educational Level</Label>
          <Select 
            value={formData.educationLevel} 
            onValueChange={(v) => setFormData({...formData, educationLevel: v})}
          >
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
        <Textarea 
          id="objectives" 
          placeholder="Tell us what you'd like your students to gain from this experience..." 
          value={formData.objectives}
          onChange={(e) => setFormData({...formData, objectives: e.target.value})}
        />
      </div>
      <Button className="w-full bg-primary hover:bg-primary/90 rounded-full h-12 flex items-center gap-2" disabled={loading}>
        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
        {loading ? "Sending Inquiry..." : "Submit School Inquiry"}
      </Button>
    </form>
  );
}
