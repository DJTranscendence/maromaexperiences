
"use client";

import { useUser } from "@/firebase";

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
  const { isUserLoading } = useUser();

  // Show a branded loading screen while the system initializes
  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-primary">
        <div className="text-2xl font-headline font-bold mb-2 tracking-tight">MAROMA</div>
        <div className="text-xs font-medium text-accent uppercase tracking-widest animate-pulse">Initializing System</div>
      </div>
    );
  }

  return <>{children}</>;
}
