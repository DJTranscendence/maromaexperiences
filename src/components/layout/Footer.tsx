
"use client";

import Link from "next/link";
import { Mail, Phone, Smartphone, Download, Info } from "lucide-react";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/LOGO%20only%20NEW%20TRANS%202025.png?alt=media&token=916bf295-69a1-4640-9f92-d8d2560ee0c2";

export default function Footer() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Load Brand Identity Settings
  const brandSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "brand_layout");
  }, [firestore]);
  const { data: brandSettings } = useDoc(brandSettingsRef);

  const kerning = brandSettings?.navbarKerning ?? 0.7;
  const offset = brandSettings?.navbarOffset ?? 0;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      // Show the native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Manual instructions for all platforms
      toast({
        title: "How to Install Maroma App",
        description: "iPhone: Tap 'Share' then 'Add to Home Screen'. Android/Desktop: Look for 'Install App' in your browser menu.",
      });
    }
  };

  return (
    <footer className="bg-white border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="col-span-1">
            <Link href="/" className="flex items-center space-x-1 mb-4 group">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image 
                  src={LOGO_URL}
                  alt="Maroma Logo"
                  width={40}
                  height={40}
                  className="object-contain transition-transform group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-headline font-bold text-primary tracking-tight leading-none uppercase">MAROMA</span>
                <span 
                  className="text-[8px] font-body font-medium text-accent uppercase leading-none mt-0.5 transition-all block relative"
                  style={{ 
                    letterSpacing: `${kerning}em`,
                    left: `${offset}em`
                  }}
                >
                  Experiences
                </span>
              </div>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Curating unforgettable moments through connection, history, and craft. Join us in our next group tour or artisan workshop.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> booking@maromaexperience.com</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +919486623749</li>
            </ul>
          </div>

          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Get the App</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Install the Maroma app to access your bookings and explore experiences instantly from your home screen.
            </p>
            
            <button 
              onClick={handleInstallApp}
              className="flex items-center gap-2 text-sm font-bold text-accent hover:text-primary transition-colors group"
            >
              <div className="p-2 bg-accent/5 rounded-lg group-hover:bg-accent/10 transition-colors">
                <Download className="w-4 h-4" />
              </div>
              Install Maroma App
            </button>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1.5 opacity-60">
              <Info className="w-3 h-3" /> Pin to home screen for offline access.
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground">&copy; 2026 Maroma Experiences. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
