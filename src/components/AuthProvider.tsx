"use client";

import { useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/firebase";

/**
 * AuthProvider component that manages the authentication state of the user.
 * It uses the auth instance from the Firebase Provider and ensures the 
 * application wait for the initial auth check before rendering.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) return;

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // Provide a consistent loading state during initial auth verification
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-primary">
        <div className="text-2xl font-headline font-bold mb-2 tracking-tight">MAROMA</div>
        <div className="text-xs font-medium text-accent uppercase tracking-widest animate-pulse">Initializing System</div>
      </div>
    );
  }

  return <>{children}</>;
}
