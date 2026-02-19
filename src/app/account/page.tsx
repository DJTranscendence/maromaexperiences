"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Calendar, History, Settings, ExternalLink, Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, where, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function AccountPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    countryCode: "+91"
  });

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "bookings"), where("userId", "==", user.uid));
  }, [firestore, user]);

  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  useEffect(() => {
    if (userData) {
      setProfileForm({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        countryCode: userData.countryCode || "+91"
      });
    }
  }, [userData]);

  const handleSaveProfile = () => {
    if (!userDocRef || !firestore) return;
    
    updateDocumentNonBlocking(userDocRef, {
      ...profileForm,
      updatedAt: serverTimestamp()
    });

    toast({
      title: "Profile Updated",
      description: "Your personal information has been saved successfully.",
    });
  };

  const isLoading = isUserLoading || isBookingsLoading;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Card className="max-w-md w-full p-8 text-center rounded-3xl border-none shadow-xl">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-headline font-bold">Please Sign In</h2>
            <p className="text-muted-foreground mt-2">You need to be logged in to view your account details.</p>
            <Button asChild className="mt-6 rounded-full px-8">
              <Link href="/login">Sign In</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="mb-10">
          <h1 className="text-4xl font-headline font-bold text-primary">Your Account</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and upcoming experiences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="rounded-2xl border-none shadow-xl">
              <CardContent className="p-4 flex flex-col gap-1">
                <Button variant="ghost" className="justify-start gap-3 bg-primary/5 text-primary font-bold">
                  <User className="w-4 h-4" /> Profile Details
                </Button>
                <Button variant="ghost" className="justify-start gap-3 text-muted-foreground hover:text-primary">
                  <Calendar className="w-4 h-4" /> My Bookings
                </Button>
                <Button variant="ghost" className="justify-start gap-3 text-muted-foreground hover:text-primary">
                  <Settings className="w-4 h-4" /> Preferences
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <Tabs defaultValue="profile" className="w-full">
              <TabsContent value="profile" className="m-0 space-y-8">
                {/* Profile Form */}
                <Card className="rounded-3xl border-none shadow-xl md:col-span-2 overflow-hidden">
                  <CardHeader className="bg-white border-b">
                    <CardTitle className="text-2xl font-headline text-primary">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8 p-8">
                    {isLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" /></div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">First Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              className="pl-10 rounded-xl h-12" 
                              value={profileForm.firstName} 
                              onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              className="pl-10 rounded-xl h-12" 
                              value={profileForm.lastName} 
                              onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              className="pl-10 rounded-xl h-12 bg-muted/30" 
                              type="email" 
                              value={profileForm.email} 
                              disabled 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                          <div className="flex gap-2">
                            <Select 
                              value={profileForm.countryCode} 
                              onValueChange={(v) => setProfileForm({...profileForm, countryCode: v})}
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
                                className="pl-10 rounded-xl h-12" 
                                value={profileForm.phoneNumber} 
                                onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-end gap-4">
                      <Button variant="outline" className="rounded-full px-8 h-12" asChild>
                        <Link href="/">Cancel</Link>
                      </Button>
                      <Button className="bg-primary rounded-full px-8 h-12 gap-2" onClick={handleSaveProfile}>
                        <Save className="w-4 h-4" /> Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="rounded-3xl border-none shadow-xl md:col-span-2 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between bg-white border-b px-8 h-20">
                    <CardTitle className="text-2xl font-headline text-primary">Upcoming Bookings</CardTitle>
                    <Button variant="ghost" size="sm" className="text-accent gap-1 hover:bg-accent/5">
                      View History <History className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      {isBookingsLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" /></div>
                      ) : bookings && bookings.length > 0 ? (
                        bookings.map((booking: any) => (
                          <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-muted/10 rounded-2xl border border-border group hover:bg-white hover:shadow-lg transition-all">
                            <div className="flex items-center gap-5">
                              <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                                <Calendar className="w-7 h-7 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg text-primary">{booking.tourName}</h4>
                                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                  <span>ID: {booking.id.substring(0, 8).toUpperCase()}</span>
                                  <span>•</span>
                                  <span>{booking.numberOfAttendees} Guests</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                              <Badge className={booking.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none px-4 py-1' : 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-4 py-1'}>
                                {booking.bookingStatus}
                              </Badge>
                              <div className="font-bold text-xl text-primary">₹{booking.totalPrice}</div>
                              <Button size="icon" variant="ghost" className="rounded-full hover:bg-white shadow-sm border border-transparent hover:border-border hidden sm:flex">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed flex flex-col items-center">
                          <Calendar className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                          <p className="text-muted-foreground font-medium">No bookings found yet.</p>
                          <Button asChild variant="link" className="text-accent mt-2">
                            <Link href="/#workshops">Explore Experiences</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
