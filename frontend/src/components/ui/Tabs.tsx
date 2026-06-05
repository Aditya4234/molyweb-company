"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className={cn("flex gap-1 rounded-xl bg-gray-100 p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            setActive(tab.id);
            onChange?.(tab.id);
          }}
          className={cn(
            "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            active === tab.id ? "text-gray-900" : "text-gray-500 hover:text-gray-700",
          )}
        >
          {active === tab.id && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 rounded-lg bg-white shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">{tab.count}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
