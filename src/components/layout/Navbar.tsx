"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Menu, X, Settings, LogOut, LogIn, UserCircle, UserPlus, ShieldCheck, Sprout } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { initiateSignOut } from "@/firebase/non-blocking-login";
import { Separator } from "@/components/ui/separator";
import { doc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/LOGO%20only%20NEW%20TRANS%202025.png?alt=media&token=916bf295-69a1-4640-9f92-d8d2560ee0c2";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();

  const isHomePage = pathname === "/";

  const handleScrollToWorkshops = (e: React.MouseEvent) => {
    if (isHomePage) {
      e.preventDefault();
      const element = document.getElementById('workshops');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsOpen(false);
      }
    }
  };

  const handleBookNowClick = (e: React.MouseEvent) => {
    if (isHomePage) {
      e.preventDefault();
      const element = document.getElementById('workshops');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsOpen(false);
      }
    } else {
      router.push("/#workshops");
      setIsOpen(false);
    }
  };

  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user || user.isAnonymous) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);

  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const handleSignOut = () => {
    initiateSignOut(auth);
  };

  const handleBecomeAdmin = () => {
    if (!firestore || !user || user.isAnonymous) return;
    
    setDocumentNonBlocking(doc(firestore, "users", user.uid), {
      email: user.email,
      firstName: user.displayName?.split(' ')[0] || "Admin",
      lastName: user.displayName?.split(' ')[1] || "User",
      id: user.uid,
      accountType: "Admin",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    setDocumentNonBlocking(doc(firestore, "roles_admin", user.uid), {
      email: user.email,
      activatedAt: serverTimestamp(),
      role: "admin"
    }, { merge: true });

    toast({
      title: "Admin Privileges Granted",
      description: "You now have access to administrative features.",
    });
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-8 h-8 flex-shrink-0 -translate-y-[4px]">
              <Image 
                src={LOGO_URL}
                alt="Maroma Logo"
                width={32}
                height={32}
                className="object-contain transition-transform group-hover:scale-110"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-headline font-bold text-primary tracking-tight leading-none">MAROMA</span>
              <span className="text-[8px] font-body font-medium text-accent uppercase tracking-[0.42em] mr-[-0.42em] mt-0.5 hidden sm:block">Experiences</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={cn("text-sm font-medium hover:text-accent transition-colors", pathname === "/" && "text-accent")}>Home</Link>
            <Link 
              href="/#workshops" 
              onClick={handleScrollToWorkshops}
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              Tours & Workshops
            </Link>
            <Link href="/corporate" className={cn("text-sm font-medium hover:text-accent transition-colors", pathname === "/corporate" && "text-accent")}>Corporate</Link>
            <Link href="/simulator" className={cn("text-sm font-bold text-accent hover:text-primary transition-colors flex items-center gap-1", pathname === "/simulator" && "text-primary")}>
              <Sprout className="w-4 h-4" /> Product Game
            </Link>
            
            {isAdmin && (
              <div className="flex items-center gap-4 pl-4 border-l border-border animate-in fade-in duration-500">
                <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Settings className="w-4 h-4" /> Admin
                </Link>
              </div>
            )}

            <Button 
              variant="default" 
              size="sm" 
              onClick={handleBookNowClick}
              className="bg-primary text-white hover:bg-primary/90 rounded-full px-6 ml-4"
            >
              Book Now
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted ml-2">
                  {user?.isAnonymous === false ? (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs">
                      {user.email?.[0].toUpperCase() || "M"}
                    </div>
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl border-none p-2">
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
                    {isAdmin ? (
                      <>
                        <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                          <Link href="/admin" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={handleBecomeAdmin} className="rounded-xl cursor-pointer text-accent font-bold bg-accent/5">
                        <ShieldCheck className="w-4 h-4 mr-2" /> Enable Admin Mode
                      </DropdownMenuItem>
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

      <div className={cn("md:hidden bg-white border-b border-border overflow-hidden transition-all duration-300", isOpen ? "max-h-screen" : "max-h-0")}>
        <div className="px-4 pt-2 pb-6 space-y-4">
          <Link href="/" className="block text-lg font-medium" onClick={() => setIsOpen(false)}>Home</Link>
          <Link 
            href="/#workshops" 
            className="block text-lg font-medium" 
            onClick={handleScrollToWorkshops}
          >
            Tours & Workshops
          </Link>
          <Link href="/corporate" className="block text-lg font-medium" onClick={() => setIsOpen(false)}>Corporate Events</Link>
          <Link href="/simulator" className="block text-lg font-bold text-accent" onClick={() => setIsOpen(false)}>Product Game</Link>
          <Link href="/account" className="block text-lg font-medium" onClick={() => setIsOpen(false)}>My Bookings</Link>
          
          {isAdmin && (
            <>
              <Separator />
              <Link href="/admin" className="block text-lg font-medium text-muted-foreground flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <Settings className="w-5 h-5" /> Admin Dashboard
              </Link>
            </>
          )}

          <Separator />
          
          <Button 
            onClick={handleBookNowClick}
            className="w-full bg-primary text-white rounded-full"
          >
            Book Now
          </Button>
          
          {user?.isAnonymous === false ? (
            <div className="space-y-2 pt-2">
              {!isAdmin && (
                <Button onClick={handleBecomeAdmin} variant="outline" className="w-full rounded-full border-accent text-accent">
                  Enable Admin Mode
                </Button>
              )}
              <Button onClick={handleSignOut} variant="destructive" className="w-full rounded-full">Sign Out</Button>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <Button asChild variant="outline" className="w-full rounded-full border-accent text-accent">
                <Link href="/login" onClick={() => setIsOpen(false)}>Sign In / Create Account</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}