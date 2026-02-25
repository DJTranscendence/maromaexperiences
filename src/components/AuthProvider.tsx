"use client";

import { useUser, useFirestore, setDocumentNonBlocking, useMemoFirebase, useDoc } from "@/firebase";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { doc, serverTimestamp } from "firebase/firestore";

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
  const loadingOffset = brandSettings?.loadingOffset ?? -1.05;

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
        <div className="flex flex-col items-center mb-10 text-center">
          <span className="text-4xl font-headline font-bold text-primary tracking-tight leading-none uppercase">MAROMA</span>
          <span 
            className="text-[10px] font-body font-medium text-accent uppercase leading-none mt-1 transition-all"
            style={{ 
              letterSpacing: `${loadingKerning}em`,
              marginRight: `${loadingOffset}em`
            }}
          >
            Experiences
          </span>
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
