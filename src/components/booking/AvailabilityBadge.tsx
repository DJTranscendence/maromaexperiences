
"use client";

import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface AvailabilityBadgeProps {
  booked: number;
  capacity: number;
  className?: string;
}

export default function AvailabilityBadge({ booked, capacity, className }: AvailabilityBadgeProps) {
  const remaining = capacity - booked;
  const percentage = (remaining / capacity) * 100;

  let colorClass = "bg-green-100 text-green-800 border-green-200";
  let dotClass = "bg-green-500";
  let label = "Spaces Available";

  if (remaining === 0) {
    colorClass = "bg-red-100 text-red-800 border-red-200";
    dotClass = "bg-red-500";
    label = "Fully Booked";
  } else if (percentage <= 25) {
    colorClass = "bg-orange-100 text-orange-800 border-orange-200";
    dotClass = "bg-orange-500";
    label = "Filling Fast";
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
