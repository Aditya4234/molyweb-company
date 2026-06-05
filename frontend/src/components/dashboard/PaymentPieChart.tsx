"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";
import type { PaymentStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface PaymentPieChartProps {
  data: PaymentStatus[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm font-medium text-gray-900">{d.label}</p>
      <p className="text-sm text-gray-600">{d.value}% ({formatCurrency(d.amount)})</p>
    </div>
  );
};

export default function PaymentPieChart({ data }: PaymentPieChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-gray-900">Payment Distribution</h3>
      <p className="mt-1 text-sm text-gray-500">Invoice payment status breakdown</p>

      <div className="mt-4 h-[200px] lg:h-[260px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              animationBegin={200}
              animationDuration={1000}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
