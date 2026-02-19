"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { Loader2, Shield, User, UserCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  accountType?: string;
}

/**
 * ManageUsersPage provides an administrative interface for managing system roles.
 * It fetches the list of users and their corresponding roles from Firestore.
 */
export default function ManageUsersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  // Create memoized queries that wait for both firestore and an active user session
  // This prevents 'Missing or insufficient permissions' errors during initial load
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users");
  }, [firestore, user]);

  const adminsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "roles_admin");
  }, [firestore, user]);

  const facilitatorsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "roles_facilitator");
  }, [firestore, user]);

  const { data: users, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: admins, isLoading: isAdminsLoading } = useCollection(adminsQuery);
  const { data: facilitators, isLoading: isFacilitatorsLoading } = useCollection(facilitatorsQuery);

  const adminIds = new Set(admins?.map(a => a.id) || []);
  const facilitatorIds = new Set(facilitators?.map(f => f.id) || []);

  const filteredUsers = users?.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAdmin = (userId: string, email: string, isCurrentlyAdmin: boolean) => {
    if (!firestore) return;
    const adminRef = doc(firestore, "roles_admin", userId);
    
    if (isCurrentlyAdmin) {
      deleteDocumentNonBlocking(adminRef);
      toast({ title: "Admin Role Removed", description: `User ${email} is no longer an admin.` });
    } else {
      setDocumentNonBlocking(adminRef, {
        email,
        activatedAt: serverTimestamp(),
        role: "admin"
      }, { merge: true });
      toast({ title: "Admin Role Granted", description: `User ${email} is now an admin.` });
    }
  };

  const toggleFacilitator = (userId: string, email: string, isCurrentlyFacilitator: boolean) => {
    if (!firestore) return;
    const facilitatorRef = doc(firestore, "roles_facilitator", userId);
    
    if (isCurrentlyFacilitator) {
      deleteDocumentNonBlocking(facilitatorRef);
      toast({ title: "Facilitator Role Removed", description: `User ${email} is no longer a facilitator.` });
    } else {
      setDocumentNonBlocking(facilitatorRef, {
        email,
        activatedAt: serverTimestamp(),
        role: "facilitator"
      }, { merge: true });
      toast({ title: "Facilitator Role Granted", description: `User ${email} is now a facilitator.` });
    }
  };

  const isSyncing = isAuthLoading || isUsersLoading || isAdminsLoading || isFacilitatorsLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="mb-10">
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage system roles and access levels.</p>
        </div>

        <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
          <CardHeader className="bg-white border-b flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="font-headline text-2xl text-primary">System Users</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or email..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full bg-muted/30 border-none"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isSyncing ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-accent" />
                <p className="text-sm text-muted-foreground">Syncing user directory...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-bold">User</TableHead>
                    <TableHead className="font-bold">Current Roles</TableHead>
                    <TableHead className="text-right font-bold">Role Management</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((userItem) => {
                    const isAdmin = adminIds.has(userItem.id);
                    const isFacilitator = facilitatorIds.has(userItem.id);

                    return (
                      <TableRow key={userItem.id} className="hover:bg-muted/10">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-primary">
                              {userItem.firstName} {userItem.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">{userItem.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {isAdmin && <Badge className="bg-primary text-white">Admin</Badge>}
                            {isFacilitator && <Badge className="bg-accent text-white">Facilitator</Badge>}
                            {!isAdmin && !isFacilitator && <Badge variant="outline">Guest / User</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant={isAdmin ? "destructive" : "outline"}
                              className="rounded-full gap-2"
                              onClick={() => toggleAdmin(userItem.id, userItem.email, isAdmin)}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              {isAdmin ? "Revoke Admin" : "Make Admin"}
                            </Button>
                            <Button 
                              size="sm" 
                              variant={isFacilitator ? "destructive" : "outline"}
                              className="rounded-full gap-2"
                              onClick={() => toggleFacilitator(userItem.id, userItem.email, isFacilitator)}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              {isFacilitator ? "Revoke Facilitator" : "Make Facilitator"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!filteredUsers || filteredUsers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-20">
                        <div className="flex flex-col items-center gap-2">
                          <User className="w-10 h-10 text-muted-foreground opacity-20" />
                          <p className="text-lg font-bold text-primary">No Users Found</p>
                          <p className="text-sm text-muted-foreground">No accounts match your search criteria.</p>
                        </div>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
