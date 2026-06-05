"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const colorStyles: Record<string, { bar: string; bg: string }> = {
  blue: { bar: "bg-blue-500", bg: "bg-blue-100" },
  green: { bar: "bg-green-500", bg: "bg-green-100" },
  yellow: { bar: "bg-yellow-500", bg: "bg-yellow-100" },
  red: { bar: "bg-red-500", bg: "bg-red-100" },
  purple: { bar: "bg-purple-500", bg: "bg-purple-100" },
};

function getAutoColor(percent: number): keyof typeof colorStyles {
  if (percent >= 90) return "green";
  if (percent >= 60) return "blue";
  if (percent >= 30) return "yellow";
  return "red";
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = "md",
  color,
  className,
}) => {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);
  const resolvedColor = color || getAutoColor(percent);
  const colors = colorStyles[resolvedColor];

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="mb-1 flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500">
              {Math.round(percent)}%
            </span>
          )}
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full", colors.bg, sizeStyles[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("rounded-full transition-colors", colors.bar, sizeStyles[size])}
        />
      </div>
    </div>
  );
}
