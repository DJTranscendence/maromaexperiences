"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Calendar, MapPin, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { sendEmailNotification } from "@/app/actions/notifications";
import Link from "next/link";

function ConfirmBookingContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'cancelled'>('loading');
  const [bookingData, setBookingData] = useState<any>(null);

  const bookingId = searchParams.get('id');
  const action = searchParams.get('action'); // 'yes' or 'no'

  useEffect(() => {
    async function processConfirmation() {
      if (!firestore || !bookingId || !action) {
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

        const data = bookingSnap.data();
        setBookingData(data);

        const isConfirming = action === 'yes';
        
        // Update specific booking status
        await updateDoc(bookingRef, {
          confirmationStatus: isConfirming ? 'attending' : 'cancelled',
          updatedAt: serverTimestamp()
        });

        // 1. Notify Admin of this specific action
        await sendEmailNotification({
          to: "indispirit@gmail.com",
          subject: `[ATTENDANCE UPDATE] ${data.tourName} - ${data.customerName}`,
          textBody: `Customer ${data.customerName} has ${isConfirming ? 'CONFIRMED' : 'CANCELLED'} for ${data.tourName} on ${data.tourDate}.\n\nTotal attendees in this group: ${data.numberOfAttendees}\n\nManage Bookings: https://maromaexperience.com/admin`
        });

        // 2. Logic: If someone says NO, check if the group total drops < 8
        if (!isConfirming) {
          const bookingsQuery = query(
            collection(firestore, "bookings"),
            where("tourId", "==", data.tourId),
            where("tourDate", "==", data.tourDate)
          );
          const allSnap = await getDocs(bookingsQuery);
          
          let totalCount = 0;
          const others: any[] = [];
          
          allSnap.forEach(doc => {
            const b = doc.data();
            if (b.confirmationStatus !== 'cancelled') {
              totalCount += (b.numberOfAttendees || 0);
              if (doc.id !== bookingId) {
                others.push({ id: doc.id, ...b });
              }
            }
          });

          // If dropping below 8, notify everyone else
          if (totalCount < 8) {
            for (const guest of others) {
              const firstName = guest.customerName?.split(' ')[0] || "there";
              await sendEmailNotification({
                to: guest.customerEmail,
                subject: `Update: ${data.tourName} Status`,
                textBody: `Dear ${firstName},\n\nSorry! Due to a last-minute cancellation, this Maroma Campus Tour will not be going ahead on this date.\n\nHowever, if we receive more bookings for this date, we will notify you that the tour is going ahead.\n\nWarm regards,\nThe Maroma Team`
              });
            }
            
            // Also notify admin of the cancellation chain
            await sendEmailNotification({
              to: "indispirit@gmail.com",
              subject: `[TOUR CANCELLED] ${data.tourName} dropped below 8`,
              textBody: `The tour on ${data.tourDate} has dropped below the minimum required number of 8 bookings due to a cancellation by ${data.customerName}.\n\nRemaining guests have been notified.`
            });
          }
          
          setStatus('cancelled');
        } else {
          setStatus('success');
        }

      } catch (err) {
        console.error("Confirmation Error:", err);
        setStatus('error');
      }
    }

    processConfirmation();
  }, [firestore, bookingId, action]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold">Synchronizing Attendance...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-20 px-4">
      <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
        <div className={status === 'success' ? "bg-emerald-500 h-3" : status === 'cancelled' ? "bg-orange-500 h-3" : "bg-rose-500 h-3"} />
        <CardHeader className="text-center pt-10">
          <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg bg-slate-50">
            {status === 'success' ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            ) : status === 'cancelled' ? (
              <XCircle className="w-10 h-10 text-orange-500" />
            ) : (
              <XCircle className="w-10 h-10 text-rose-500" />
            )}
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-primary">
            {status === 'success' ? "Attendance Confirmed!" : status === 'cancelled' ? "Cancellation Received" : "Link Error"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-10 pt-0 text-center">
          <p className="text-muted-foreground leading-relaxed">
            {status === 'success' 
              ? "Thank you! Your presence has been recorded. We look forward to seeing you at Maroma."
              : status === 'cancelled'
              ? "We've recorded your cancellation. If your plans change, please feel free to book another session."
              : "This confirmation link is invalid or has expired. Please contact support if you believe this is an error."}
          </p>

          {bookingData && (
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
            <Button asChild className="w-full bg-primary rounded-full h-12 font-bold shadow-lg shadow-primary/10">
              <Link href="/">Return to Maroma <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
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
