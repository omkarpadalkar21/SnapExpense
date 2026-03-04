"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Budget } from "@/lib/types";

interface BudgetFormProps {
  budgets: Budget[];
}

export function BudgetForm({ budgets: initialBudgets }: BudgetFormProps) {
  const [budgets, setBudgets] = useState(initialBudgets);

  const total = useMemo(() => budgets.reduce((s, b) => s + b.amount, 0), [budgets]);

  const handleChange = (category: string, value: string) => {
    setBudgets((prev) =>
      prev.map((b) =>
        b.category === category ? { ...b, amount: Number(value) || 0 } : b
      )
    );
  };

  return (
    <div className="space-y-3 animate-fade-in-up">
      {budgets.map((budget) => (
        <div
          key={budget.category}
          className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-border"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
            {budget.icon}
          </div>
          <span className="flex-1 text-sm font-medium">{budget.category}</span>
          <div className="relative w-28">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
            <Input
              type="number"
              value={budget.amount}
              onChange={(e) => handleChange(budget.category, e.target.value)}
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
        <Button className="w-full" size="lg">
          Save Budgets
        </Button>
      </div>
    </div>
  );
}
