
"use client";

import { cn } from "@/lib/utils";

interface AvailabilityBadgeProps {
  booked: number;
  capacity: number;
  className?: string;
}

export default function AvailabilityBadge({ booked, capacity, className }: AvailabilityBadgeProps) {
  const remaining = Math.max(0, capacity - (booked || 0));
  const availablePercent = capacity > 0 ? (remaining / capacity) * 100 : 0;

  let colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
  let dotClass = "bg-emerald-500";
  let label = "Spaces Available";

  if (remaining === 0) {
    colorClass = "bg-red-100 text-red-800 border-red-200";
    dotClass = "bg-red-600";
    label = "Fully Booked";
  } else if (availablePercent <= 15) {
    colorClass = "bg-rose-100 text-rose-800 border-rose-200";
    dotClass = "bg-rose-500";
    label = "Last Few Seats";
  } else if (availablePercent <= 35) {
    colorClass = "bg-orange-100 text-orange-800 border-orange-200";
    dotClass = "bg-orange-500";
    label = "Filling Fast";
  } else if (availablePercent <= 55) {
    colorClass = "bg-amber-100 text-amber-800 border-amber-200";
    dotClass = "bg-amber-500";
    label = "Moderate Interest";
  } else if (availablePercent <= 75) {
    colorClass = "bg-lime-100 text-lime-800 border-lime-200";
    dotClass = "bg-lime-500";
    label = "Good Availability";
  }

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold shadow-sm transition-all duration-300", colorClass, className)}>
      <span className={cn("w-2 h-2 rounded-full animate-pulse", dotClass)} />
      <span className="flex items-center gap-1">
        {remaining} / {capacity} {label}
      </span>
    </div>
  );
}
