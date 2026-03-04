"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { useMonthSelector } from "@/hooks/useMonthSelector";
import { MOCK_BUDGETS } from "@/lib/mockData";

export default function BudgetsPage() {
  const router = useRouter();
  const { monthYear, goToPreviousMonth, goToNextMonth } = useMonthSelector();

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
        <h1 className="text-lg font-bold">Monthly Budgets</h1>
        <div className="flex items-center gap-1">
          <button onClick={goToPreviousMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium min-w-[90px] text-center">{monthYear}</span>
          <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Budget Form */}
      <BudgetForm budgets={MOCK_BUDGETS} />
    </div>
  );
}
