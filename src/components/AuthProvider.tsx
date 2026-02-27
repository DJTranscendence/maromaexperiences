
"use client";

import { useUser, useFirestore, setDocumentNonBlocking, useMemoFirebase, useDoc } from "@/firebase";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { doc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/LOGO%20only%20NEW%20TRANS%202025.png?alt=media&token=916bf295-69a1-4640-9f92-d8d2560ee0c2";

/**
 * AuthProvider component that manages the initial loading state of the application.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, userError } = useUser();
  const firestore = useFirestore();

  // Load Brand Identity Settings
  const brandSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "brand_layout");
  }, [firestore]);
  const { data: brandSettings } = useDoc(brandSettingsRef);

  const loadingKerning = brandSettings?.loadingKerning ?? 1.05;
  const loadingOffset = brandSettings?.loadingOffset ?? 0;

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

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-primary">
        <div className="flex items-center space-x-1 mb-10">
          <div className="relative w-16 h-16 flex-shrink-0 -translate-y-[6px]">
            <Image 
              src={LOGO_URL} 
              alt="Maroma Logo" 
              fill 
              className="object-contain" 
              priority
            />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-5xl font-headline font-bold text-primary tracking-tight leading-none uppercase">MAROMA</span>
            <span 
              className="text-[12px] font-body font-medium text-accent uppercase leading-none mt-1 transition-all block relative"
              style={{ 
                letterSpacing: `${loadingKerning}em`,
                left: `${loadingOffset}em`
              }}
            >
              Experiences
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
          <div className="text-xs font-medium text-accent uppercase tracking-widest">Initializing System</div>
        </div>

        {userError && (
          <p className="mt-6 text-[10px] text-destructive opacity-70 max-w-xs text-center">
            Network error detected. The system is attempting to bypass...
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
