"use client";

import { Bell, Loader2 } from "lucide-react";
import { HeroCard } from "@/components/home/HeroCard";
import { SpendingChart } from "@/components/home/SpendingChart";
import { RecentReceipts } from "@/components/home/RecentReceipts";
import { useExpensesSummary, useSpendingTrend, useGetReceipts, useUserProfile } from "@/hooks/useApi";

export default function HomePage() {
  const { data: summary, isPending: pendingSummary } = useExpensesSummary();
  const { data: trends, isPending: pendingTrends } = useSpendingTrend(6);
  const { data: receiptsPage, isPending: pendingReceipts } = useGetReceipts({
    page: 0,
    size: 5,
  });
  const { data: user, isPending: pendingUser } = useUserProfile();

  if (pendingSummary || pendingTrends || pendingReceipts || pendingUser) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="px-4 pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
            {user?.initials || "OP"}
          </div>
          <h1 className="text-lg font-bold tracking-tight">SnapExpense</h1>
        </div>
        <button className="relative p-2 rounded-xl hover:bg-muted transition-colors" aria-label="Notifications">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>
      </div>

      {/* Hero Card */}
      {summary && <HeroCard summary={summary} />}

      {/* Spending Chart */}
      {trends && <SpendingChart data={trends} />}

      {/* Recent Receipts */}
      {receiptsPage && <RecentReceipts receipts={receiptsPage.content || []} />}
    </div>
  );
}
