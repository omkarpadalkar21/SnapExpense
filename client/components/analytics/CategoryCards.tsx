"use client";

import { formatCurrency } from "@/lib/formatCurrency";
import { Progress } from "@/components/ui/progress";
import type { CategorySummary } from "@/lib/types";

interface CategoryCardsProps {
  data: CategorySummary[];
}

const CARD_COLORS = ["#7C3AED", "#F97316", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];

export function CategoryCards({ data }: CategoryCardsProps) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
      <div className="flex overflow-x-auto gap-3 hide-scrollbar pb-1">
        {data.map((item, index) => {
          const ratio = item.budget > 0 ? Math.min((item.spent / item.budget) * 100, 100) : 0;
          const color = CARD_COLORS[index % CARD_COLORS.length];

          return (
            <div
              key={item.category}
              className="min-w-[130px] bg-white rounded-2xl p-3.5 shadow-sm border border-border shrink-0"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base mb-2"
                style={{ backgroundColor: `${color}15` }}
              >
                {item.icon}
              </div>
              <p className="text-xs font-medium text-muted-foreground truncate">{item.category}</p>
              <p className="text-sm font-bold mt-0.5">{formatCurrency(item.spent)}</p>
              <Progress
                value={ratio}
                className="h-1 mt-2"
                indicatorClassName={item.remaining < 0 ? "bg-danger" : ""}
                style={{ "--tw-bg-opacity": 1 } as React.CSSProperties}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
