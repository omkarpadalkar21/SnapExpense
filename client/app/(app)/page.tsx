"use client";

import { Bell } from "lucide-react";
import { HeroCard } from "@/components/home/HeroCard";
import { SpendingChart } from "@/components/home/SpendingChart";
import { RecentReceipts } from "@/components/home/RecentReceipts";
import { MOCK_SUMMARY, MOCK_TRENDS, MOCK_RECEIPTS, MOCK_USER } from "@/lib/mockData";

export default function HomePage() {
  return (
    <div className="px-4 pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
            {MOCK_USER.initials}
          </div>
          <h1 className="text-lg font-bold tracking-tight">SnapExpense</h1>
        </div>
        <button className="relative p-2 rounded-xl hover:bg-muted transition-colors" aria-label="Notifications">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>
      </div>

      {/* Hero Card */}
      <HeroCard summary={MOCK_SUMMARY} />

      {/* Spending Chart */}
      <SpendingChart data={MOCK_TRENDS} />

      {/* Recent Receipts */}
      <RecentReceipts receipts={MOCK_RECEIPTS} />
    </div>
  );
}
