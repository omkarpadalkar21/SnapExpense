"use client";

import { formatCurrency } from "@/lib/formatCurrency";

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  compact?: boolean;
}

export function CurrencyDisplay({ amount, className = "", compact = false }: CurrencyDisplayProps) {
  const formatted = formatCurrency(amount);
  return <span className={className}>{compact ? `₹${amount.toLocaleString("en-IN")}` : formatted}</span>;
}
