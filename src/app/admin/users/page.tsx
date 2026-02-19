"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { Loader2, Shield, User, UserCheck, Search, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: ""
  });

  // Create memoized queries that wait for both firestore and an active user session
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

  const handleEditUser = (userItem: UserProfile) => {
    setEditingUser(userItem);
    setEditForm({
      firstName: userItem.firstName || "",
      lastName: userItem.lastName || ""
    });
  };

  const saveUserChanges = () => {
    if (!firestore || !editingUser) return;
    
    const userRef = doc(firestore, "users", editingUser.id);
    updateDocumentNonBlocking(userRef, {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      updatedAt: serverTimestamp()
    });

    toast({ title: "Profile Updated", description: "User details have been successfully changed." });
    setEditingUser(null);
  };

  const isSyncing = isAuthLoading || isUsersLoading || isAdminsLoading || isFacilitatorsLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">System Users</h1>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full bg-muted/40 border-none h-11"
            />
          </div>
        </div>

        <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
          <CardContent className="p-0">
            {isSyncing ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-accent" />
                <p className="text-sm text-muted-foreground">Syncing user directory...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/5 border-b border-muted">
                    <TableHead className="font-bold text-primary h-14">User</TableHead>
                    <TableHead className="font-bold text-primary h-14">Current Roles</TableHead>
                    <TableHead className="text-right font-bold text-primary h-14 pr-8">Role Management</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((userItem) => {
                    const isAdmin = adminIds.has(userItem.id);
                    const isFacilitator = facilitatorIds.has(userItem.id);

                    return (
                      <TableRow key={userItem.id} className="hover:bg-muted/5 transition-colors border-b border-muted/50 last:border-0 h-20">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-primary text-base">
                                {userItem.firstName} {userItem.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">{userItem.email}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleEditUser(userItem)} className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {isAdmin && <Badge className="bg-primary text-white rounded-full px-4">Admin</Badge>}
                            {isFacilitator && <Badge className="bg-accent text-white rounded-full px-4">Facilitator</Badge>}
                            {!isAdmin && !isFacilitator && <Badge variant="outline" className="rounded-full px-4 border-muted text-primary font-medium">Guest / User</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-3">
                            <Button 
                              size="sm" 
                              variant={isAdmin ? "destructive" : "outline"}
                              className="rounded-full gap-2 h-10 px-6 font-medium"
                              onClick={() => toggleAdmin(userItem.id, userItem.email, isAdmin)}
                            >
                              <Shield className="w-4 h-4" />
                              {isAdmin ? "Revoke Admin" : "Make Admin"}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="rounded-full gap-2 h-10 px-6 font-medium text-primary hover:bg-muted/30"
                              onClick={() => toggleFacilitator(userItem.id, userItem.email, isFacilitator)}
                            >
                              <UserCheck className="w-4 h-4" />
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
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-primary">Edit Account</DialogTitle>
              <DialogDescription>Update the profile details for {editingUser?.email}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="col-span-3 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="col-span-3 rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEditingUser(null)} className="rounded-full">Cancel</Button>
              <Button onClick={saveUserChanges} className="bg-primary rounded-full px-8">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      
      <Footer />
    </div>
  );
}
