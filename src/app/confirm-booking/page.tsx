"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Calendar, MapPin, ArrowRight, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { sendEmailNotification } from "@/app/actions/notifications";
import Link from "next/link";

function ConfirmBookingContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'cancelled'>('idle');
  const [bookingData, setBookingData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const bookingId = searchParams.get('id');
  const action = searchParams.get('action'); // 'yes' or 'no'

  // Fetch booking details on mount
  useEffect(() => {
    async function fetchBooking() {
      if (!firestore || !bookingId) {
        setStatus('error');
        return;
      }

      try {
        const bookingRef = doc(firestore, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);

        if (!bookingSnap.exists()) {
          setStatus('error');
          return;
        }

        setBookingData(bookingSnap.data());
      } catch (err) {
        console.error("Fetch Error:", err);
        setStatus('error');
      }
    }

    fetchBooking();
  }, [firestore, bookingId]);

  const handleConfirmStatus = async () => {
    if (!firestore || !bookingId || !action || !bookingData) return;

    setIsProcessing(true);
    setStatus('loading');

    try {
      const isConfirming = action === 'yes';
      const bookingRef = doc(firestore, "bookings", bookingId);
      
      // Update specific booking status using non-blocking pattern
      updateDocumentNonBlocking(bookingRef, {
        confirmationStatus: isConfirming ? 'attending' : 'cancelled',
        updatedAt: serverTimestamp()
      });

      // 1. Notify Admin
      sendEmailNotification({
        to: "indispirit@gmail.com",
        subject: `[ATTENDANCE UPDATE] ${bookingData.tourName} - ${bookingData.customerName}`,
        textBody: `Customer ${bookingData.customerName} has ${isConfirming ? 'CONFIRMED' : 'CANCELLED'} for ${bookingData.tourName} on ${bookingData.tourDate}.\n\nTotal attendees in this group: ${bookingData.numberOfAttendees}\n\nManage Bookings: https://maromaexperience.com/admin`
      });

      // 2. Cancellation Logic: Check if threshold is still met
      if (!isConfirming) {
        const bookingsQuery = query(
          collection(firestore, "bookings"),
          where("tourId", "==", bookingData.tourId),
          where("tourDate", "==", bookingData.tourDate)
        );
        const allSnap = await getDocs(bookingsQuery);
        
        let totalCount = 0;
        const others: any[] = [];
        
        allSnap.forEach(docSnap => {
          const b = docSnap.data();
          // We must treat the current booking as cancelled locally
          const currentStatus = docSnap.id === bookingId ? 'cancelled' : b.confirmationStatus;
          
          if (currentStatus !== 'cancelled') {
            totalCount += (b.numberOfAttendees || 0);
            others.push({ id: docSnap.id, ...b });
          }
        });

        // If dropping below 8, notify everyone else
        if (totalCount < 8) {
          for (const guest of others) {
            const firstName = guest.customerName?.split(' ')[0] || "there";
            sendEmailNotification({
              to: guest.customerEmail,
              subject: `Update: ${bookingData.tourName} Status`,
              textBody: `Dear ${firstName},\n\nSorry! Due to a last-minute cancellation, this Maroma Campus Tour will not be going ahead on this date.\n\nHowever, if we receive more bookings for this date, we will notify you that the tour is going ahead.\n\nWarm regards,\nThe Maroma Team`
            });
          }
          
          sendEmailNotification({
            to: "indispirit@gmail.com",
            subject: `[TOUR CANCELLED] ${bookingData.tourName} dropped below 8`,
            textBody: `The tour on ${bookingData.tourDate} has dropped below the minimum required number of 8 bookings due to a cancellation by ${bookingData.customerName}.\n\nRemaining guests have been notified.`
          });
        }
        
        setStatus('cancelled');
      } else {
        setStatus('success');
      }

    } catch (err) {
      console.error("Process Error:", err);
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold">Updating Campus Records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-20 px-4">
      <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
        <div className={status === 'success' ? "bg-emerald-500 h-3" : status === 'cancelled' ? "bg-orange-500 h-3" : status === 'error' ? "bg-rose-500 h-3" : "bg-primary h-3"} />
        <CardHeader className="text-center pt-10">
          <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg bg-slate-50">
            {status === 'success' ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            ) : status === 'cancelled' ? (
              <XCircle className="w-10 h-10 text-orange-500" />
            ) : status === 'error' ? (
              <AlertCircle className="w-10 h-10 text-rose-500" />
            ) : (
              <Calendar className="w-10 h-10 text-primary" />
            )}
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-primary">
            {status === 'success' ? "Attendance Confirmed!" : 
             status === 'cancelled' ? "Cancellation Received" : 
             status === 'error' ? "Invalid Link" : "Are You Coming?"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-10 pt-0 text-center">
          <p className="text-muted-foreground leading-relaxed">
            {status === 'success' 
              ? "Thank you! Your presence has been recorded. We look forward to seeing you at Maroma."
              : status === 'cancelled'
              ? "We've recorded your cancellation. If your plans change, please feel free to book another session."
              : status === 'error'
              ? "This confirmation link is invalid or has expired. Please contact support if you believe this is an error."
              : "We hope so! Please let us know by clicking the button below to proceed."}
          </p>

          {bookingData && status === 'idle' && (
            <div className="bg-muted/30 rounded-2xl p-6 text-left space-y-3 border border-border/50">
              <div className="flex items-center gap-3 text-primary font-bold">
                <Calendar className="w-4 h-4 text-accent" /> {bookingData.tourDate}
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-accent" /> {bookingData.location || "Maroma Campus"}
              </div>
              <div className="pt-3 border-t border-border/50">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Experience</span>
                <p className="font-bold text-primary">{bookingData.tourName}</p>
              </div>
            </div>
          )}

          <div className="pt-4">
            {status === 'idle' ? (
              <Button onClick={handleConfirmStatus} disabled={isProcessing} className="w-full bg-primary rounded-full h-14 font-bold shadow-xl shadow-primary/10 gap-2">
                {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Let Us Know
              </Button>
            ) : (
              <Button asChild className="w-full bg-slate-900 rounded-full h-12 font-bold shadow-lg">
                <Link href="/">Return to Maroma <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmBookingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<div className="flex justify-center py-32"><Loader2 className="animate-spin text-accent" /></div>}>
          <ConfirmBookingContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
