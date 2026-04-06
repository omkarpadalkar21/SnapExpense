"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatCurrency";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGetCategories, useGetBudgetByMonth, useSetBudgetByMonth } from "@/hooks/useApi";

// Internal shape the form works with
interface BudgetRow {
  categoryId: number;
  categoryName: string;
  icon: string;
  color: string;
  amount: number;
}

interface BudgetFormProps {
  /** yyyy-MM string for the selected month */
  month: string;
}

export function BudgetForm({ month }: BudgetFormProps) {
  const { data: categories = [], isPending: loadingCats } = useGetCategories();
  const { data: existing = [], isPending: loadingBudgets } = useGetBudgetByMonth(month);
  const { mutate: setBudgets, isPending: saving } = useSetBudgetByMonth();

  const [rows, setRows] = useState<BudgetRow[]>([]);

  // Build rows whenever categories or existing budgets load
  useEffect(() => {
    if (loadingCats || loadingBudgets) return;

    const merged: BudgetRow[] = categories.map((cat) => {
      const saved = existing.find((b) => b.categoryId === cat.id);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        icon: cat.icon ?? "📦",
        color: cat.color ?? "#94A3B8",
        amount: saved ? Number(saved.budget) : 0,
      };
    });
    setRows(merged);
  }, [categories, existing, loadingCats, loadingBudgets]);

  const total = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);

  const handleChange = (categoryId: number, value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.categoryId === categoryId ? { ...r, amount: Number(value) || 0 } : r
      )
    );
  };

  const handleSave = () => {
    setBudgets(
      {
        month,
        budgets: rows
          // Only send rows with a non-zero budget to keep the payload minimal.
          // The backend upserts so existing zeros won't be wiped unless explicitly sent.
          .filter((r) => r.amount > 0)
          .map((r) => ({ categoryId: r.categoryId, budget: r.amount })),
      },
      {
        onSuccess: (data) => {
          toast.success(`Saved ${data.updated} budget${data.updated !== 1 ? "s" : ""} for ${month}`);
        },
        onError: () => {
          toast.error("Failed to save budgets. Please try again.");
        },
      }
    );
  };

  const isLoading = loadingCats || loadingBudgets;

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in-up">
      {rows.map((row) => (
        <div
          key={row.categoryId}
          className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-border"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: `${row.color}18` }}
          >
            {row.icon}
          </div>
          <span className="flex-1 text-sm font-medium">{row.categoryName}</span>
          <div className="relative w-28">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ₹
            </span>
            <Input
              type="number"
              min={0}
              value={row.amount === 0 ? "" : row.amount}
              placeholder="0"
              onChange={(e) => handleChange(row.categoryId, e.target.value)}
              className="pl-7 text-right text-sm h-10"
            />
          </div>
        </div>
      ))}

      {/* Total row */}
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">Total Budget</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="sticky bottom-20 pt-3">
        <Button
          onClick={handleSave}
          disabled={saving || isLoading}
          className="w-full"
          size="lg"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Budgets
        </Button>
      </div>
    </div>
  );
}
