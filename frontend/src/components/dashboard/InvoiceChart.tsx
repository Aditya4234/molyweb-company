"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface InvoiceGrowthPoint {
  month: string;
  invoices: number;
  growth: number;
}

interface InvoiceChartProps {
  data: InvoiceGrowthPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value}{entry.name === "Growth" ? "%" : ""}
        </p>
      ))}
    </div>
  );
};

export default function InvoiceChart({ data }: InvoiceChartProps) {
  if (!data.length) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Invoice Growth</h3>
        <p className="mt-4 text-sm text-gray-500 text-center py-8">No invoice data yet</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Invoice Growth</h3>
      <p className="mt-1 text-sm text-gray-500">Monthly invoice volume & growth rate</p>
      <div className="mt-4 lg:mt-6 h-[200px] lg:h-[260px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <BarChart data={data} barGap={4}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="invoices" fill="url(#barGradient)" radius={[4, 4, 0, 0]} name="Invoices" animationBegin={300} animationDuration={800} />
            <Bar dataKey="growth" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Growth" animationBegin={500} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
