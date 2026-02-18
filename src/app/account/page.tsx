
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
import { User, Mail, Phone, Calendar, History, Settings, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function AccountPage() {
  const [user, setUser] = useState({
    name: "Alex Maroma",
    email: "alex@example.com",
    phone: "+1 (555) 123-4567"
  });

  const mockBookings = [
    { id: "BK-8821", tour: "Coastal Sunset Expedition", date: "June 25, 2024", status: "confirmed", price: 85 },
    { id: "BK-9012", tour: "Artisanal Pottery Workshop", date: "July 12, 2024", status: "pending", price: 120 },
  ];

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
              <TabsContent value="profile" className="m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Profile Form */}
                  <Card className="rounded-2xl border-none shadow-xl md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-2xl font-headline">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input className="pl-10" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input className="pl-10" type="email" value={user.email} onChange={e => setUser({...user, email: e.target.value})} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input className="pl-10" value={user.phone} onChange={e => setUser({...user, phone: e.target.value})} />
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex justify-end gap-4">
                        <Button variant="outline" className="rounded-full px-8">Cancel</Button>
                        <Button className="bg-primary rounded-full px-8">Save Changes</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="rounded-2xl border-none shadow-xl md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-2xl font-headline">Upcoming Bookings</CardTitle>
                      <Button variant="ghost" size="sm" className="text-accent gap-1">
                        View History <History className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockBookings.map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white rounded-lg shadow-sm">
                                <Calendar className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-bold text-primary">{booking.tour}</h4>
                                <div className="text-sm text-muted-foreground">{booking.date} • ID: {booking.id}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <Badge className={booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                                {booking.status}
                              </Badge>
                              <Button size="icon" variant="ghost" className="rounded-full hover:bg-white hover:text-accent">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
