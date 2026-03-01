
"use client";

import { useUser, useFirestore, setDocumentNonBlocking, useMemoFirebase, useDoc } from "@/firebase";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/LOGO%20only%20NEW%20TRANS%202025.png?alt=media&token=916bf295-69a1-4640-9f92-d8d2560ee0c2";

/**
 * AuthProvider component that manages the initial loading state of the application.
 * Features a refined motion-design sequence for the brand identity.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, userError } = useUser();
  const firestore = useFirestore();
  const [isLogoVisible, setIsLogoVisible] = useState(false);

  // Load Brand Identity Settings
  const brandSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "brand_layout");
  }, [firestore]);
  const { data: brandSettings } = useDoc(brandSettingsRef);

  const loadingKerning = brandSettings?.loadingKerning ?? 1.05;
  // Apply a base 1.5mm (approx 0.47em at 12px) nudge to correct for letter-spacing visual weight
  const loadingOffset = (brandSettings?.loadingOffset ?? 0) + 0.47;

  useEffect(() => {
    if (user && firestore) {
      const userRef = doc(firestore, "users", user.uid);
      
      const profileData: any = {
        id: user.uid,
        email: user.email || `guest-${user.uid.substring(0, 5)}@maroma.local`,
        accountType: user.isAnonymous ? "Anonymous" : "Individual",
        updatedAt: serverTimestamp()
      };

      if (user.displayName) {
        const parts = user.displayName.split(' ');
        profileData.firstName = parts[0];
        profileData.lastName = parts.slice(1).join(' ') || "";
      }

      setDocumentNonBlocking(userRef, profileData, { merge: true });
    }
  }, [user, firestore]);

  // Trigger logo reveal after a short delay or on image load
  useEffect(() => {
    if (isUserLoading) {
      const timer = setTimeout(() => setIsLogoVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isUserLoading]);

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-primary overflow-hidden">
        {/* Brand Assembly Container */}
        <div className="relative flex items-center justify-center mb-12">
          {/* 
            Animated Logo Container 
            Starts at 0 width to ensure text is centered, then expands
          */}
          <div 
            className={cn(
              "relative transition-all duration-1000 ease-in-out overflow-hidden flex items-center justify-center shrink-0",
              isLogoVisible ? "w-20 opacity-100 mr-2" : "w-0 opacity-0 mr-0"
            )}
          >
            <div className="relative w-16 h-16 -translate-y-[2mm] -translate-x-[1.5mm]">
              <Image 
                src={LOGO_URL} 
                alt="Maroma Logo" 
                fill 
                className="object-contain" 
                priority
                onLoad={() => setIsLogoVisible(true)}
              />
            </div>
          </div>

          {/* Brand Text Stack */}
          <div className="flex flex-col items-center transition-all duration-1000 ease-in-out shrink-0">
            <span className="text-5xl font-headline font-bold text-primary tracking-tight leading-none uppercase">
              MAROMA
            </span>
            <span 
              className={cn(
                "text-[12px] font-body font-medium text-accent uppercase leading-none mt-1 transition-all duration-1000 block relative",
                isLogoVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
              style={{ 
                letterSpacing: `${loadingKerning}em`,
                left: `${loadingOffset}em`
              }}
            >
              Experiences
            </span>
          </div>
        </div>
        
        {/* Initialization Status */}
        <div className={cn(
          "flex flex-col items-center gap-4 transition-all duration-1000 delay-500",
          isLogoVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <div className="text-xs font-medium text-accent uppercase tracking-widest">Initializing System</div>
          </div>

          {userError && (
            <p className="mt-2 text-[10px] text-destructive opacity-70 max-w-xs text-center">
              Network error detected. The system is attempting to bypass...
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
