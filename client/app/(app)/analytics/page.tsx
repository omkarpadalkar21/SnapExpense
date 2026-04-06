"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { WeekCalendarStrip } from "@/components/shared/WeekCalendarStrip";
import { DonutChart } from "@/components/analytics/DonutChart";
import { CategoryCards } from "@/components/analytics/CategoryCards";
import { TrendBarChart } from "@/components/analytics/TrendBarChart";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatCurrency";
import { useMonthSelector } from "@/hooks/useMonthSelector";
import { useExpensesSummary, useExpensesSummaryCategories, useSpendingTrend, useGetReceipts } from "@/hooks/useApi";

export default function AnalyticsPage() {
  const router = useRouter();
  // Single source of truth for both month nav and week strip
  const { monthYear, selectedDate, setSelectedDate, goToPreviousMonth, goToNextMonth } = useMonthSelector();

  const monthParam = format(selectedDate, "yyyy-MM");

  const { data: summary, isPending: pendingSummary } = useExpensesSummary(monthParam);
  const { data: categorySummary, isPending: pendingCats } = useExpensesSummaryCategories(monthParam);
  const { data: trends, isPending: pendingTrends } = useSpendingTrend(6);
  const { data: receiptsPage } = useGetReceipts({ month: monthParam, page: 0, size: 100 });

  const datesWithReceipts = receiptsPage
    ? [...new Set(receiptsPage.content.map((r) => r.receiptDate))]
    : [];

  if (pendingSummary || pendingCats || pendingTrends) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="px-4 pt-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Analytics</h1>
        <div className="flex items-center gap-1">
          <button onClick={goToPreviousMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium min-w-[110px] text-center">{monthYear}</span>
          <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Week Calendar — day selection within selected month */}
      <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <WeekCalendarStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          datesWithReceipts={datesWithReceipts}
        />
      </div>

      {/* Spend Summary */}
      {summary && (
        <div className="text-center animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <p className="text-sm text-muted-foreground">You have spent</p>
          <p className="text-3xl font-bold text-primary mt-1">
            {formatCurrency(summary.totalSpent)}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">this month, {monthYear}</p>

          <div className="mt-4 px-2">
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${Math.min(Number(summary.percentUsed), 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-muted-foreground">
                {Number(summary.percentUsed).toFixed(2)}% used
              </span>
              <span className="text-xs text-muted-foreground">
                Budget: {formatCurrency(summary.budget)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Donut Chart */}
      {categorySummary && <DonutChart data={categorySummary} />}

      {/* Category Cards */}
      {categorySummary && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">By Category</h2>
            <Link href="/receipts" className="text-sm text-accent font-medium">
              View All →
            </Link>
          </div>
          <CategoryCards data={categorySummary} />
        </div>
      )}

      {/* Trend Chart */}
      {trends && (
        <div>
          <h2 className="text-base font-semibold mb-3">Monthly Trend</h2>
          <TrendBarChart data={trends} />
        </div>
      )}

      {/* Comparison Table */}
      {categorySummary && (
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <h2 className="text-base font-semibold mb-3">Category Comparison</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorySummary.map((cat) => {
                  const isOver = cat.remaining < 0;
                  return (
                    <TableRow key={cat.category}>
                      <TableCell className="font-medium text-xs">
                        <span className="mr-1.5">{cat.icon}</span>
                        {cat.category}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatCurrency(cat.budget)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {formatCurrency(cat.spent)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={isOver ? "destructive" : "success"}
                          className="text-[10px]"
                        >
                          {isOver ? "Over" : "Under"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
