"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatCurrency";
import { CATEGORIES } from "@/lib/mockData";
import type { Receipt } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecentReceiptsProps {
  receipts: Receipt[];
}

export function RecentReceipts({ receipts }: RecentReceiptsProps) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Recent Receipts</h2>
        <Link href="/receipts" className="text-sm text-accent font-medium flex items-center gap-0.5 hover:gap-1.5 transition-all">
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-2.5 stagger-children">
        {receipts.slice(0, 5).map((receipt) => {
          const cat = CATEGORIES.find((c) => c.name === receipt.category?.name);

          return (
            <Link
              key={receipt.id}
              href={`/receipts/${receipt.id}`}
              className={cn(
                "flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-border hover:shadow-md transition-all duration-200 group",
                !receipt.isVerified && "border-l-4 border-l-amber-400"
              )}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: `${cat?.color || "#7C3AED"}15` }}
              >
                {cat?.icon || "📄"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{receipt.merchantName}</p>
                  {!receipt.isVerified && (
                    <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4">
                      Unverified
                    </Badge>
                  )}
                  {receipt.ocrConfidence < 0.7 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                      Low Confidence
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground">{receipt.category?.name}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(receipt.receiptDate), "dd MMM")}
                  </span>
                </div>
              </div>

              <p className="text-sm font-semibold text-accent whitespace-nowrap">
                {formatCurrency(receipt.totalAmount)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
