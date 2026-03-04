"use client";

import { useState, useMemo } from "react";
import { Bell, Wallet, ReceiptText } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { WeekCalendarStrip } from "@/components/shared/WeekCalendarStrip";
import { ReceiptCard } from "@/components/receipts/ReceiptCard";
import { formatCurrency } from "@/lib/formatCurrency";
import { MOCK_RECEIPTS, MOCK_SUMMARY, MOCK_USER } from "@/lib/mockData";

export default function ReceiptsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const datesWithReceipts = useMemo(
    () => [...new Set(MOCK_RECEIPTS.map((r) => r.date))],
    []
  );

  const filteredReceipts = useMemo(
    () =>
      MOCK_RECEIPTS.filter((r) => isSameDay(parseISO(r.date), selectedDate)),
    [selectedDate]
  );

  const allReceipts = useMemo(
    () => (filteredReceipts.length > 0 ? filteredReceipts : MOCK_RECEIPTS),
    [filteredReceipts]
  );

  return (
    <div className="px-4 pt-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
          {MOCK_USER.initials}
        </div>
        <h1 className="text-lg font-bold">Expenses</h1>
        <button className="relative p-2 rounded-xl hover:bg-muted transition-colors" aria-label="Notifications">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>
      </div>

      {/* Week Calendar */}
      <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <WeekCalendarStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          datesWithReceipts={datesWithReceipts}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <div className="bg-primary text-white rounded-2xl p-4 relative overflow-hidden">
          <p className="text-xs text-white/70">Total Budget</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(MOCK_SUMMARY.budget)}</p>
          <p className="text-[10px] text-white/60 mt-1">
            {format(selectedDate, "MMMM yyyy")}
          </p>
          <Wallet className="absolute bottom-2 right-2 h-8 w-8 text-white/10" />
        </div>
        <div className="bg-accent text-white rounded-2xl p-4 relative overflow-hidden">
          <p className="text-xs text-white/70">Total Spent</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(MOCK_SUMMARY.totalSpent)}</p>
          <p className="text-[10px] text-white/60 mt-1">
            {format(selectedDate, "MMMM yyyy")}
          </p>
          <ReceiptText className="absolute bottom-2 right-2 h-8 w-8 text-white/10" />
        </div>
      </div>

      {/* Receipt List */}
      <div className="space-y-2.5 stagger-children">
        {allReceipts.length > 0 ? (
          allReceipts.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <ReceiptText className="h-9 w-9 text-primary/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No receipts for this date</p>
            <p className="text-xs text-muted-foreground mt-1">Tap + to scan your first receipt</p>
          </div>
        )}
      </div>
    </div>
  );
}
