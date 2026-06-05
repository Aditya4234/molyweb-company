import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  homeIcon?: boolean;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, homeIcon = true, className }) => {
  return (
    <nav className={cn("flex items-center gap-1.5 text-sm", className)}>
      {homeIcon && (
        <>
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Home size={16} />
          </Link>
          {items.length > 0 && <ChevronRight size={14} className="text-gray-400" />}
        </>
      )}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.label + index}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast
                    ? "text-gray-900 font-medium"
                    : "text-gray-500",
                )}
              >
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight size={14} className="text-gray-400" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
