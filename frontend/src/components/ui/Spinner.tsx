import React from "react";
import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-3",
};

const labelSizeMap: Record<SpinnerSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export const Spinner: React.FC<SpinnerProps> = ({ size = "md", label, className }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-gray-300 border-t-blue-600",
          sizeMap[size],
        )}
      />
      {label && (
        <span className={cn("text-gray-500", labelSizeMap[size])}>
          {label}
        </span>
      )}
    </div>
  );
}
