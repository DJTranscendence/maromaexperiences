"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Menu, X, Settings, Image as ImageIcon, LogOut, LogIn, UserCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { initiateSignOut } from "@/firebase/non-blocking-login";
import { Separator } from "@/components/ui/separator";
import { doc } from "firebase/firestore";
import Image from "next/image";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/LOGO%20only%20NEW%20TRANS%202025.png?alt=media&token=916bf295-69a1-4640-9f92-d8d2560ee0c2";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  // Check if user is an admin by looking for a document in the roles_admin collection
  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user || user.isAnonymous) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);

  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const handleSignOut = () => {
    initiateSignOut(auth);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image 
                src={LOGO_URL}
                alt="Maroma Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-headline font-bold text-primary tracking-tight leading-none">MAROMA</span>
              <span className="text-[8px] font-body font-medium text-accent uppercase tracking-[0.55em] hidden sm:block mr-[-0.55em]">Experiences</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium hover:text-accent transition-colors">Tours & Workshops</Link>
            <Link href="/account" className="text-sm font-medium hover:text-accent transition-colors">My Bookings</Link>
            
            {isAdmin && (
              <div className="flex items-center gap-4 pl-4 border-l border-border animate-in fade-in duration-500">
                <Link href="/admin/media" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" /> Media
                </Link>
                <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Settings className="w-4 h-4" /> Admin
                </Link>
              </div>
            )}

            <Button variant="default" size="sm" asChild className="bg-primary text-white hover:bg-primary/90 rounded-full px-6">
              <Link href="/">Book Now</Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                  {user?.isAnonymous === false ? (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs">
                      {user.email?.[0].toUpperCase()}
                    </div>
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl border-none p-2">
                <DropdownMenuLabel className="font-headline text-lg">
                  {user?.isAnonymous === false ? "My Account" : "Guest Mode"}
                </DropdownMenuLabel>
                {user?.email && (
                  <div className="px-2 pb-2 text-xs text-muted-foreground truncate">{user.email}</div>
                )}
                <DropdownMenuSeparator />
                {user?.isAnonymous === false ? (
                  <>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                      <Link href="/account" className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4" /> Profile
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                          <Link href="/admin" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Admin Panel
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                          <Link href="/admin/media" className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Media Library
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="rounded-xl cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer bg-accent/10 text-accent font-bold">
                      <Link href="/login" className="flex items-center gap-2">
                        <LogIn className="w-4 h-4" /> Sign In
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                      <Link href="/login" className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> Create Account
                      </Link>
                    </DropdownMenuItem>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-primary hover:text-accent transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className={cn("md:hidden bg-white border-b border-border overflow-hidden transition-all duration-300", isOpen ? "max-h-screen" : "max-h-0")}>
        <div className="px-4 pt-2 pb-6 space-y-4">
          <Link href="/" className="block text-lg font-medium" onClick={() => setIsOpen(false)}>Tours & Workshops</Link>
          <Link href="/account" className="block text-lg font-medium" onClick={() => setIsOpen(false)}>My Bookings</Link>
          
          {isAdmin && (
            <>
              <Separator />
              <Link href="/admin/media" className="block text-lg font-medium text-muted-foreground flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <ImageIcon className="w-5 h-5" /> Media Library
              </Link>
              <Link href="/admin" className="block text-lg font-medium text-muted-foreground flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <Settings className="w-5 h-5" /> Admin Panel
              </Link>
            </>
          )}

          <Separator />
          
          {user?.isAnonymous === false ? (
            <Button onClick={handleSignOut} variant="destructive" className="w-full rounded-full">Sign Out</Button>
          ) : (
            <div className="space-y-2">
              <Button asChild className="w-full bg-primary text-white rounded-full">
                <Link href="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full border-accent text-accent">
                <Link href="/login" onClick={() => setIsOpen(false)}>Create Account</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
