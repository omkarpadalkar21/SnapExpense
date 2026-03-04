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
import { formatCurrencyAbbreviated } from "@/lib/formatCurrency";
import type { SpendingTrend } from "@/lib/types";

interface TrendBarChartProps {
  data: SpendingTrend[];
}

export function TrendBarChart({ data }: TrendBarChartProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-border animate-fade-in-up">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="15%">
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
  );
}
