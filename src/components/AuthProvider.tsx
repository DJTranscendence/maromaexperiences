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
        <div className="text-2xl font-headline font-bold mb-2 tracking-tight">MAROMA</div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
          <div className="text-xs font-medium text-accent uppercase tracking-widest">Initializing System</div>
        </div>
        {userError && (
          <p className="mt-4 text-[10px] text-destructive opacity-70 max-w-xs text-center">
            Network error detected. The system is attempting to bypass...
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
