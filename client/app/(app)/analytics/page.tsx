"use client";

import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WeekCalendarStrip } from "@/components/shared/WeekCalendarStrip";
import { DonutChart } from "@/components/analytics/DonutChart";
import { CategoryCards } from "@/components/analytics/CategoryCards";
import { TrendBarChart } from "@/components/analytics/TrendBarChart";
import { Progress } from "@/components/ui/progress";
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
import { MOCK_SUMMARY, MOCK_CATEGORY_SUMMARY, MOCK_TRENDS, MOCK_RECEIPTS } from "@/lib/mockData";

export default function AnalyticsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { monthYear, goToPreviousMonth, goToNextMonth } = useMonthSelector();
  const router = useRouter();

  const datesWithReceipts = [...new Set(MOCK_RECEIPTS.map((r) => r.date))];

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

      {/* Week Calendar */}
      <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <WeekCalendarStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          datesWithReceipts={datesWithReceipts}
        />
      </div>

      {/* Spend Summary */}
      <div className="text-center animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <p className="text-sm text-muted-foreground">You have spent</p>
        <p className="text-3xl font-bold text-primary mt-1">
          {formatCurrency(MOCK_SUMMARY.totalSpent)}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">this month, {monthYear}</p>

        <div className="mt-4 px-2">
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${MOCK_SUMMARY.percentUsed}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-muted-foreground">
              {MOCK_SUMMARY.percentUsed.toFixed(2)}% used
            </span>
            <span className="text-xs text-muted-foreground">
              {(100 - MOCK_SUMMARY.percentUsed).toFixed(2)}% remaining
            </span>
          </div>
        </div>
      </div>

      {/* Donut Chart */}
      <DonutChart data={MOCK_CATEGORY_SUMMARY} />

      {/* Category Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Analytics</h2>
          <Link href="/receipts" className="text-sm text-accent font-medium">
            View All →
          </Link>
        </div>
        <CategoryCards data={MOCK_CATEGORY_SUMMARY} />
      </div>

      {/* Trend Chart */}
      <div>
        <h2 className="text-base font-semibold mb-3">Monthly Trend</h2>
        <TrendBarChart data={MOCK_TRENDS} />
      </div>

      {/* Comparison Table */}
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
              {MOCK_CATEGORY_SUMMARY.map((cat) => {
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
    </div>
  );
}
