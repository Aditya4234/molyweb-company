"use client";

import { motion } from "framer-motion";
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  Landmark,
} from "lucide-react";
import type { Stat } from "@/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  DollarSign, CheckCircle, Clock, AlertTriangle, Users, TrendingUp, Landmark,
};

interface StatsCardProps {
  stat: Stat;
  index: number;
}

export default function StatsCard({ stat, index }: StatsCardProps) {
  const Icon = iconMap[stat.icon] || DollarSign;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 lg:p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Glassmorphism overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md">
            <Icon size={20} />
          </div>

          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.05 + 0.2, type: "spring" }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
              stat.trend === "up"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                : "bg-rose-50 text-rose-700 ring-rose-600/20",
            )}
          >
            <span>{stat.trend === "up" ? "↑" : "↓"}</span>
            {stat.change}
          </motion.span>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500">{stat.label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {stat.value}
          </p>
        </div>

        {/* Progress bar decoration */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-gray-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.random() * 40 + 60}%` }}
            transition={{ delay: index * 0.05 + 0.3, duration: 0.8 }}
            className={cn(
              "h-full rounded-full",
              stat.trend === "up" ? "bg-emerald-400" : "bg-rose-400",
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}
