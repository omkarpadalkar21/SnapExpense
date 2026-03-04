"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrencyAbbreviated } from "@/lib/formatCurrency";
import type { SpendingTrend } from "@/lib/types";

interface SpendingChartProps {
  data: SpendingTrend[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Analytics</h2>
        <Select defaultValue="2026">
          <SelectTrigger className="w-24 h-8 text-xs border-accent text-accent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={(v) => formatCurrencyAbbreviated(v)}
              width={45}
            />
            <Tooltip
              formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Spent"]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isCurrent ? "#F97316" : "#7C3AED"}
                  opacity={entry.isCurrent ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
