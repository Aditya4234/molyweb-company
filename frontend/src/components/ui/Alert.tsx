"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  dismissible?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const variantConfig: Record<
  AlertVariant,
  {
    bg: string;
    border: string;
    iconColor: string;
    defaultIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }
> = {
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
    defaultIcon: Info,
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-500",
    defaultIcon: CheckCircle2,
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    iconColor: "text-yellow-500",
    defaultIcon: AlertTriangle,
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    defaultIcon: AlertCircle,
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  description,
  icon: Icon,
  dismissible = false,
  className,
  children,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const config = variantConfig[variant];
  const AlertIcon = Icon || config.defaultIcon;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex gap-3 rounded-lg border p-4",
            config.bg,
            config.border,
            className,
          )}
        >
          <AlertIcon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)} />
          <div className="flex-1 min-w-0">
            {title && (
              <p className="text-sm font-medium text-gray-900">{title}</p>
            )}
            {(description || children) && (
              <div className={cn("text-sm text-gray-600", title && "mt-1")}>
                {description || children}
              </div>
            )}
          </div>
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
