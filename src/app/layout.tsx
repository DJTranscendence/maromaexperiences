import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: {
    default: "Maroma Experiences | Auroville Artisan Workshops & Campus Tours",
    template: "%s | Maroma Experiences"
  },
  description:
    "Discover the heart of Auroville through Maroma Experiences. Premium curated tours and artisan-led workshops for individuals, schools, and corporate retreats. Focused on sustainability, ethical production, and timeless craft.",
  keywords: [
    "Auroville tours",
    "artisan workshops India",
    "sustainable production tour",
    "educational school trips Auroville",
    "corporate team building Auroville",
    "handcrafted incense workshop",
    "ethical enterprise tours",
    "Puducherry activities",
    "cultural experiences South India"
  ],
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
    description: "Immersive educational and corporate experiences at the Maroma Campus in Auroville.",
    images: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Clay%20Perfume%20Hero.png?alt=media&token=29a10f37-f9c6-4ec5-98b0-6cf2ce53d8e2",
        width: 1200,
        height: 630,
        alt: "Maroma Experiences - Curated Tours",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maroma Experiences | Artisan Workshops & Tours",
    description: "Immersive educational and corporate experiences at the Maroma Campus.",
    images: ["https://firebasestorage.googleapis.com/v0/b/studio-139117361-c9162.firebasestorage.app/o/Clay%20Perfume%20Hero.png?alt=media&token=29a10f37-f9c6-4ec5-98b0-6cf2ce53d8e2"],
  },
  manifest: "/manifest.json",
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
