"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirects to the master admin page which now handles media via tabs.
 */
export default function MediaLibraryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?tab=media");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Redirecting to consolidated dashboard...</p>
    </div>
  );
}
