import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  metadataBase: new URL('https://maromaexperience.com'),
  title: {
    default: "Maroma Experiences | Auroville Artisan Workshops & Campus Tours",
    template: "%s | Maroma Experiences"
  },
  description:
    "Immersive artisan-led workshops and campus tours in Auroville. Discover sustainable production, ethical craft, and educational field trips for schools and corporate team-building retreats.",
  keywords: [
    "Auroville tours",
    "artisan workshops India",
    "sustainable production tour",
    "educational school trips Auroville",
    "corporate team building Auroville",
    "handcrafted incense workshop",
    "ethical enterprise tours",
    "corporate retreats India",
    "educational tours for schools",
    "Puducherry activities",
    "curriculum-aligned field trips",
    "executive strategy sessions"
  ],
  alternates: {
    canonical: '/',
  },
  authors: [{ name: "Maroma Experiences" }],
  creator: "Maroma",
  publisher: "Maroma Experiences",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://maromaexperience.com",
    siteName: "Maroma Experiences",
    title: "Maroma Experiences | Curated Artisan Tours & Workshops",
    description: "Immersive educational and corporate experiences at the Maroma Campus in Auroville focusing on sustainability and timeless craft.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Maroma Experiences - Curated Tours",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maroma Experiences | Artisan Workshops & Tours",
    description: "Immersive educational and corporate experiences at the Maroma Campus in Auroville.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@100..900&family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background">
        <FirebaseClientProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
