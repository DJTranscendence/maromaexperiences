"use client";

import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { doc, serverTimestamp } from "firebase/firestore";

/**
 * AuthProvider component that manages the initial loading state of the application.
 * It waits for the Firebase Auth state to resolve before rendering any children.
 * This prevents "flicker" and ensures that all child components have access to 
 * the authenticated user session immediately.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, userError } = useUser();
  const firestore = useFirestore();

  // Automatically ensure a user profile exists in Firestore when they are authenticated.
  // This ensures the current user always appears in management lists.
  useEffect(() => {
    if (user && firestore) {
      const userRef = doc(firestore, "users", user.uid);
      
      // Prepare profile data. We use merge: true to avoid deleting existing fields.
      const profileData: any = {
        id: user.uid,
        email: user.email || `guest-${user.uid.substring(0, 5)}@maroma.local`,
        accountType: user.isAnonymous ? "Anonymous" : "Individual",
        updatedAt: serverTimestamp()
      };

      // Only sync names from the Auth provider if they exist there.
      // We avoid setting hardcoded defaults like "Member" or "User" here 
      // because that would overwrite custom names saved by the user in the Account page.
      if (user.displayName) {
        const parts = user.displayName.split(' ');
        profileData.firstName = parts[0];
        profileData.lastName = parts.slice(1).join(' ') || "";
      }

      setDocumentNonBlocking(userRef, profileData, { merge: true });
    }
  }, [user, firestore]);

  // Show a branded loading screen while the system initializes
  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-primary">
        <div className="flex flex-col items-center mb-10 text-center">
          <span className="text-4xl font-headline font-bold text-primary tracking-tight leading-none">MAROMA</span>
          <span className="text-[10px] font-body font-medium text-accent uppercase tracking-[1.05em] mt-1 mr-[-1.05em]">Experiences</span>
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
