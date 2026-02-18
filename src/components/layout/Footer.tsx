
import Link from "next/link";
import { Mail, Phone, Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex flex-col">
              <span className="text-2xl font-headline font-bold text-primary tracking-tight">MAROMA</span>
              <span className="text-xs font-body font-medium text-accent uppercase tracking-widest">Experiences</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Curating unforgettable moments through connection, history, and craft. Join us in our next group tour or artisan workshop.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Explore</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-accent">Group Tours</Link></li>
              <li><Link href="#" className="hover:text-accent">Artisan Workshops</Link></li>
              <li><Link href="#" className="hover:text-accent">School Bookings</Link></li>
              <li><Link href="#" className="hover:text-accent">Corporate Packages</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> hello@maroma.com</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +1 (555) 123-4567</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-accent"><Instagram className="w-5 h-5" /></Link>
              <Link href="#" className="text-muted-foreground hover:text-accent"><Facebook className="w-5 h-5" /></Link>
              <Link href="#" className="text-muted-foreground hover:text-accent"><Twitter className="w-5 h-5" /></Link>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground">&copy; 2024 Maroma Experiences. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
