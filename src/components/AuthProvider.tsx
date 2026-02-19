"use client";

import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";

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
  const { isUserLoading, userError } = useUser();

  // Show a branded loading screen while the system initializes
  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-primary">
        <div className="flex flex-col items-center mb-10">
          <span className="text-4xl font-headline font-bold text-primary tracking-tight leading-none">MAROMA</span>
          <span className="text-[10px] font-body font-medium text-accent uppercase tracking-[0.68em] mt-1 mr-[-0.68em]">Experiences</span>
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
