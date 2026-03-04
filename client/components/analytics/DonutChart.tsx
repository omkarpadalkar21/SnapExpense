"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/formatCurrency";
import type { CategorySummary } from "@/lib/types";

interface DonutChartProps {
  data: CategorySummary[];
}

const CHART_COLORS = ["#7C3AED", "#F97316", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];

export function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.spent, 0);

  return (
    <div className="animate-fade-in-up">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex justify-center">
          <div className="relative">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="spent"
                  nameKey="category"
                  strokeWidth={0}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Spent"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
          {data.map((item, index) => (
            <div key={item.category} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-xs text-muted-foreground truncate flex-1">{item.category}</span>
              <span className="text-xs font-medium">{formatCurrency(item.spent)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
