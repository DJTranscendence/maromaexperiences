"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Menu, X, Compass, Calendar, Settings, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-headline font-bold text-primary tracking-tight">MAROMA</span>
            <span className="text-sm font-body font-medium text-accent uppercase tracking-widest hidden sm:block">Experiences</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium hover:text-accent transition-colors">Tours</Link>
            <Link href="/account" className="text-sm font-medium hover:text-accent transition-colors">My Bookings</Link>
            
            <div className="flex items-center gap-4 pl-4 border-l border-border">
              <Link href="/admin/media" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <ImageIcon className="w-4 h-4" /> Media
              </Link>
              <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <Settings className="w-4 h-4" /> Admin
              </Link>
            </div>

            <Button variant="default" size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-full px-6">
              Book Now
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-primary hover:text-accent transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className={cn("md:hidden bg-white border-b border-border overflow-hidden transition-all duration-300", isOpen ? "max-h-80" : "max-h-0")}>
        <div className="px-4 pt-2 pb-6 space-y-4">
          <Link href="/" className="block text-lg font-medium" onClick={() => setIsOpen(false)}>Tours</Link>
          <Link href="/account" className="block text-lg font-medium" onClick={() => setIsOpen(false)}>My Bookings</Link>
          <Separator />
          <Link href="/admin/media" className="block text-lg font-medium text-muted-foreground flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <ImageIcon className="w-5 h-5" /> Media Library
          </Link>
          <Link href="/admin" className="block text-lg font-medium text-muted-foreground flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <Settings className="w-5 h-5" /> Admin Panel
          </Link>
          <Button className="w-full bg-primary text-white">Sign In</Button>
        </div>
      </div>
    </nav>
  );
}

import { Separator } from "@/components/ui/separator";
