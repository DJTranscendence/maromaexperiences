"use client";

import { cn } from "@/lib/utils";

interface AvailabilityBadgeProps {
  booked: number;
  capacity: number;
  className?: string;
}

/**
 * A highly-visible availability indicator that uses psychological urgency 
 * to encourage bookings based on real-time occupancy.
 */
export default function AvailabilityBadge({ booked, capacity, className }: AvailabilityBadgeProps) {
  const remaining = Math.max(0, capacity - (booked || 0));
  const availablePercent = capacity > 0 ? (remaining / capacity) * 100 : 0;

  // Initializing with "Perfect" availability (100% free)
  let colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
  let dotClass = "bg-emerald-500";
  let label = `${remaining} / ${capacity} Spaces Available`;

  if (remaining === 0) {
    colorClass = "bg-red-100 text-red-800 border-red-200";
    dotClass = "bg-red-600";
    label = "Fully Booked";
  } else if (availablePercent <= 25) {
    // 1-25% remaining: High urgency
    colorClass = "bg-rose-100 text-rose-800 border-rose-200 shadow-sm shadow-rose-100";
    dotClass = "bg-rose-500";
    label = `Almost at Capacity. Book now!`;
  } else if (availablePercent <= 55) {
    // 26-55% remaining: Moderate urgency
    colorClass = "bg-orange-100 text-orange-800 border-orange-200 shadow-sm shadow-orange-100";
    dotClass = "bg-orange-500";
    label = `It's almost half full`;
  } else if (availablePercent <= 85) {
    // 56-85% remaining: Starting to fill
    colorClass = "bg-amber-100 text-amber-800 border-amber-200 shadow-sm shadow-amber-100";
    dotClass = "bg-amber-500";
    label = `Bookings are coming in! ${remaining} spaces left!`;
  }

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold shadow-sm transition-all duration-300", colorClass, className)}>
      <span className={cn("w-2 h-2 rounded-full animate-pulse", dotClass)} />
      <span className="flex items-center gap-1 font-body">
        {label}
      </span>
    </div>
  );
}
