"use client";

import { motion } from "framer-motion";
import {
  DollarSign,
  FileText,
  UserCheck,
  AlertCircle,
  RotateCcw,
  MoreHorizontal,
} from "lucide-react";
import type { Activity } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

interface ActivityTimelineProps {
  activities: Activity[];
}

const config: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  payment: { icon: DollarSign, bg: "bg-emerald-50", color: "text-emerald-600" },
  invoice: { icon: FileText, bg: "bg-blue-50", color: "text-blue-600" },
  client: { icon: UserCheck, bg: "bg-purple-50", color: "text-purple-600" },
  failed: { icon: AlertCircle, bg: "bg-rose-50", color: "text-rose-600" },
  refund: { icon: RotateCcw, bg: "bg-amber-50", color: "text-amber-600" },
};

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
          <p className="mt-1 text-sm text-gray-500">Real-time platform activity</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      <div className="relative mt-6">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 h-full w-px bg-gray-100" />

        <div className="space-y-0">
          {activities.map((activity, i) => {
            const cfg = config[activity.type] ?? { icon: FileText, bg: "bg-gray-50", color: "text-gray-600" };
            const Icon = cfg.icon;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="relative flex items-start gap-4 pb-6 last:pb-0"
              >
                {/* Icon */}
                <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg} ${cfg.color} ring-4 ring-white`}>
                  <Icon size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-900 leading-snug">{activity.message}</p>
                    <button className="shrink-0 rounded-lg p-1 text-gray-400 opacity-0 transition hover:bg-gray-100 group-hover:opacity-100">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                    {activity.user && (
                      <>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{activity.user}</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
