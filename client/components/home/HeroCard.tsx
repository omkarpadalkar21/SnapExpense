"use client";

import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatCurrency";
import type { MonthlySummary } from "@/lib/types";

interface HeroCardProps {
  summary: MonthlySummary;
}

export function HeroCard({ summary }: HeroCardProps) {
  return (
    <div className="bg-indigo-950 text-white rounded-2xl p-5 animate-fade-in-up">
      <p className="text-xs text-indigo-300 font-medium">This Month&apos;s Spending</p>

      <p className="text-3xl font-bold mt-2 tracking-tight">
        {formatCurrency(summary.totalSpent)}
      </p>

      <div className="flex items-center gap-1 mt-1.5">
        <span className="text-xs text-indigo-300">
          Budget: {formatCurrency(summary.budget)}
        </span>
        <span className="text-xs text-indigo-400">·</span>
        <span className="text-xs text-indigo-300">
          Remaining: {formatCurrency(summary.remaining)}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <Progress
          value={summary.percentUsed}
          className="flex-1 h-2.5 bg-indigo-800"
          indicatorClassName="bg-primary"
        />
        <span className="text-xs text-indigo-300 font-medium whitespace-nowrap">
          {summary.percentUsed}% used
        </span>
      </div>
    </div>
  );
}
