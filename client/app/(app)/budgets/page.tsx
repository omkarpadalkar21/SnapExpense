"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { useMonthSelector } from "@/hooks/useMonthSelector";
import { useGetBudgetByMonth, useSetBudgetByMonth } from "@/hooks/useApi";

export default function BudgetsPage() {
  const router = useRouter();
  const { monthYear, selectedDate, goToPreviousMonth, goToNextMonth } = useMonthSelector();
  const monthParam = format(selectedDate, "yyyy-MM");

  const { data: budgets, isPending } = useGetBudgetByMonth(monthParam);
  const { mutate: setBudgets, isPending: saving } = useSetBudgetByMonth();

  const handleSave = (newBudgets: import("@/lib/types").Budget[]) => {
    setBudgets({ month: monthParam, budgets: newBudgets });
  };

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
      {isPending ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : (
        <BudgetForm budgets={budgets || []} onSave={handleSave} saving={saving} />
      )}
    </div>
  );
}
