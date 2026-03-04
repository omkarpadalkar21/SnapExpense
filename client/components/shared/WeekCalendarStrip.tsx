"use client";

import { useMemo, useRef, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";

interface WeekCalendarStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  datesWithReceipts?: string[];
}

export function WeekCalendarStrip({ selectedDate, onDateSelect, datesWithReceipts = [] }: WeekCalendarStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [selectedDate]);

  const receiptDateSet = useMemo(() => new Set(datesWithReceipts), [datesWithReceipts]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto hide-scrollbar py-2 px-1"
    >
      {days.map((day) => {
        const isSelected = isSameDay(day, selectedDate);
        const hasReceipt = receiptDateSet.has(format(day, "yyyy-MM-dd"));
        const dayIsToday = isToday(day);

        return (
          <button
            key={day.toISOString()}
            data-selected={isSelected}
            onClick={() => onDateSelect(day)}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[48px] py-2.5 px-2 rounded-2xl transition-all duration-200",
              isSelected
                ? "bg-accent text-white shadow-md scale-105"
                : "bg-white hover:bg-gray-50",
              !isSelected && dayIsToday && "ring-2 ring-accent/30"
            )}
          >
            <span className={cn(
              "text-[11px] font-medium uppercase",
              isSelected ? "text-white/80" : "text-muted-foreground"
            )}>
              {format(day, "EEE")}
            </span>
            <span className={cn(
              "text-lg font-bold leading-none",
              isSelected ? "text-white" : "text-foreground"
            )}>
              {format(day, "d")}
            </span>
            {hasReceipt && (
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                isSelected ? "bg-white" : "bg-primary"
              )} />
            )}
          </button>
        );
      })}
    </div>
  );
}
