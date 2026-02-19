
"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users2, 
  Target, 
  Utensils, 
  Hotel, 
  Camera, 
  Sparkles, 
  ChevronRight,
  Coffee,
  CheckCircle2,
  Presentation,
  ShieldCheck,
  Quote
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function CorporatePage() {
  const corporateHero = PlaceHolderImages.find(p => p.id === 'corporate-retreat')?.imageUrl || "";
  const cateringImg = PlaceHolderImages.find(p => p.id === 'corp-catering')?.imageUrl || "";
  const meetingImg = PlaceHolderImages.find(p => p.id === 'corp-meeting')?.imageUrl || "";
  const stayImg = PlaceHolderImages.find(p => p.id === 'corp-stay')?.imageUrl || "";

  const PACKAGES = [
    {
      name: "Essential Connection",
      tier: "Day Retreat",
      description: "A focused single-day experience designed to break the routine and spark new ideas.",
      features: ["Private Meeting Space", "Signature Workshop Choice", "Artisan Lunch & Coffee", "Facilitated Q&A"],
      price: "₹1,500 / guest",
      icon: Users2
    },
    {
      name: "Premium Synergy",
      tier: "Multi-Day Journey",
      description: "Our most popular choice, balancing intensive strategy with immersive craft workshops.",
      features: ["2 Days / 1 Night", "Premium Catering Package", "Two Signature Workshops", "Outdoor Team Challenges", "Evening Social Event"],
      price: "₹4,500 / guest",
      icon: Target,
      popular: true
    },
    {
      name: "Executive Summit",
      tier: "Bespoke Luxury",
      description: "A high-level retreat focused on deep strategy, leadership, and absolute privacy.",
      features: ["3 Days / 2 Nights", "Private Chef Experience", "Exclusive Venue Access", "Leadership Coaching Integration", "Full Concierge Support"],
      price: "On Request",
      icon: ShieldCheck
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
          <Image
            src={corporateHero}
            alt="Corporate Retreat"
            fill
            className="object-cover brightness-[0.5]"
            priority
          />
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <Badge className="mb-6 bg-accent text-white border-none px-6 py-2 rounded-full uppercase tracking-[0.3em] font-bold text-xs animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Corporate Excellence
            </Badge>
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-white mb-8 drop-shadow-2xl leading-tight">
              Elevate Your Team's Connection.
            </h1>
            <p className="text-xl text-white/90 mb-12 font-body max-w-2xl mx-auto drop-shadow-md leading-relaxed">
              Maroma provides the perfect canvas for corporate groups to reconnect, strategize, and grow through curated artisan workshops and high-end logistics.
            </p>
            <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-full px-12 h-14 font-bold shadow-2xl transition-all hover:scale-105">
              <Link href="/#workshops">Start Planning Your Event</Link>
            </Button>
          </div>
        </section>

        {/* Advantage Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">Why Maroma for Business?</h2>
              <div className="h-1.5 w-24 bg-accent mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { title: "Inspired Surroundings", desc: "Our campus offers a unique blend of nature and modern facilities that break down traditional silos.", icon: Sparkles },
                { title: "Artisan Workshops", desc: "Engage in hands-on pottery, perfumery, or textiles to foster creativity and collaborative problem solving.", icon: Building2 },
                { title: "Tailored Logistics", desc: "From gourmet catering to luxury transportation, we handle every detail so you can focus on your team.", icon: Presentation }
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="w-20 h-20 bg-muted/30 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/10 transition-colors duration-500">
                    <item.icon className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-headline font-bold text-primary mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-body">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Signature Packages */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">Signature Packages</h2>
              <p className="text-muted-foreground font-body">Choose a foundation and customize it to your specific goals. Click any package to view options.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {PACKAGES.map((pkg, i) => (
                <Link key={i} href="/#workshops" className="flex">
                  <Card className={`rounded-[2.5rem] border-none shadow-xl relative overflow-hidden flex flex-col w-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group/card ${pkg.popular ? 'ring-2 ring-accent z-10' : ''}`}>
                    {pkg.popular && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-accent text-white text-[10px] font-bold px-8 py-1.5 rotate-45 translate-x-10 translate-y-4 uppercase tracking-widest shadow-md">
                          Most Popular
                        </div>
                      </div>
                    )}
                    <CardHeader className="p-8 pb-4">
                      <div className="w-12 h-12 bg-muted/50 rounded-2xl flex items-center justify-center mb-6 group-hover/card:bg-accent/10 transition-colors">
                        <pkg.icon className="w-6 h-6 text-primary group-hover/card:text-accent transition-colors" />
                      </div>
                      <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-2">{pkg.tier}</div>
                      <CardTitle className="text-2xl font-headline font-bold text-primary">{pkg.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 flex-grow">
                      <p className="text-sm text-muted-foreground mb-8 font-body leading-relaxed">{pkg.description}</p>
                      <div className="space-y-4 mb-8">
                        {pkg.features.map((feat, fi) => (
                          <div key={fi} className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                            <span className="text-sm font-medium text-primary/80">{feat}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-auto pt-6 border-t border-border flex items-baseline justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Base Rate</span>
                          <span className="text-2xl font-headline font-bold text-primary">{pkg.price}</span>
                        </div>
                        <div className="bg-primary text-white p-2 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">Evocative Spaces</h2>
                <p className="text-muted-foreground font-body leading-relaxed">
                  Our venues are designed to inspire quiet focus and loud collaboration in equal measure.
                </p>
              </div>
              <Button variant="outline" className="rounded-full px-8 h-12 border-accent text-accent hover:bg-accent/5" asChild>
                <Link href="/#workshops">View All Venues</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[meetingImg, cateringImg, stayImg, corporateHero, meetingImg, cateringImg].map((img, i) => (
                <div key={i} className={`relative overflow-hidden rounded-[2rem] shadow-lg group ${i === 0 || i === 4 ? 'md:col-span-2' : ''} h-72`}>
                  <Image
                    src={img}
                    alt={`Gallery ${i}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services & Enhancements */}
        <section className="py-24 bg-primary text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <Badge className="bg-white/10 text-white border-none rounded-full px-4 py-1.5 mb-6 uppercase tracking-widest text-[10px] font-bold">
                  Bespoke Services
                </Badge>
                <h2 className="text-4xl font-headline font-bold mb-8">Every detail, curated for your team.</h2>
                
                <div className="space-y-10">
                  {[
                    { title: "Gourmet Gastronomy", icon: Utensils, desc: "From energy-boosting working breakfasts to multi-course celebration dinners under the stars." },
                    { title: "Luxury Stay", icon: Hotel, desc: "Bespoke accommodation on campus or prioritized rates with our handpicked local five-star hotel partners." },
                    { title: "Event Photography", icon: Camera, desc: "Professional visual storytellers to document your team's growth and capture the spirit of the retreat." }
                  ].map((service, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-all duration-300">
                        <service.icon className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2">{service.title}</h4>
                        <p className="text-white/70 text-sm leading-relaxed font-body">{service.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="aspect-square relative rounded-[3rem] overflow-hidden rotate-3 shadow-2xl border-8 border-white/5">
                  <Image
                    src={stayImg}
                    alt="Luxury Service"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-10 -left-10 bg-accent p-8 rounded-[2rem] shadow-2xl max-w-xs -rotate-3 hidden md:block">
                  <Quote className="w-8 h-8 text-white/40 mb-4" />
                  <p className="text-white text-sm font-body italic leading-relaxed">
                    "Maroma transformed our annual planning session into a journey of discovery. The pottery workshop was the breakthrough we didn't know we needed."
                  </p>
                  <div className="mt-4 font-bold text-xs uppercase tracking-widest">VP Engineering, Tech Global</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-white text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-8">Ready to transform your corporate culture?</h2>
            <p className="text-lg text-muted-foreground mb-12 font-body leading-relaxed">
              Our event designers are ready to help you craft an experience that matches your team's unique vision and goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90 rounded-full px-12 h-14 font-bold shadow-xl">
                <Link href="/#workshops">Book an Experience</Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-12 h-14 font-bold border-primary text-primary hover:bg-primary/5">
                Contact Sales Team
              </Button>
            </div>
            <p className="mt-10 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
              Response time usually under 12 hours
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
