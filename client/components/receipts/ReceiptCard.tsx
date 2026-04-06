"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CATEGORIES } from "@/lib/mockData";
import type { Receipt } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatCurrency";
import { useExpensesSummaryCategories } from "@/hooks/useApi";

interface ReceiptCardProps {
  receipt: Receipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const cat = CATEGORIES.find((c) => c.name === receipt.category?.name);
  const { data: categories } = useExpensesSummaryCategories();
  
  const catSummary = categories?.find((c) => c.category === receipt.category?.name);
  const spent = catSummary?.spent || receipt.totalAmount;
  const budget = catSummary?.budget || 5000;
  const ratio = Math.min((spent / budget) * 100, 100);
  const isOver = spent > budget;

  return (
    <Link
      href={`/receipts/${receipt.id}`}
      className={cn(
        "block bg-white rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-all duration-200",
        !receipt.isVerified && "border-l-4 border-l-amber-400"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${cat?.color || "#7C3AED"}15` }}
        >
          {cat?.icon || "📄"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{receipt.merchantName}</p>
            {!receipt.isVerified && (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4">
                Unverified
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {receipt.category?.name || "Uncategorized"} · {receipt.receiptDate && format(parseISO(receipt.receiptDate), "dd MMM yyyy")}
          </p>

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>Total Spend: <span className="text-foreground font-medium">{formatCurrency(spent)}</span></span>
            <span>|</span>
            <span>Budget: <span className="text-foreground font-medium">{formatCurrency(budget)}</span></span>
          </div>

          <div className="mt-2">
            <Progress
              value={ratio}
              className="h-1.5"
              indicatorClassName={isOver ? "bg-danger" : "bg-primary"}
            />
          </div>

          <div className="flex justify-end mt-1">
            <span className={cn(
              "text-xs font-semibold",
              isOver ? "text-danger" : "text-primary"
            )}>
              {ratio.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
