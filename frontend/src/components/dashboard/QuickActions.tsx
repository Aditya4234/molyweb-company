"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, UserPlus, FileBarChart, FileDown, Send, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { remindAllInvoices, exportInvoicesCsv } from "@/lib/api";

interface Action {
  label: string;
  icon: React.ElementType;
  color: string;
  desc: string;
  type: "link" | "action";
  href?: string;
  actionId?: string;
}

const actions: Action[] = [
  { label: "Create Invoice", icon: Plus, color: "bg-blue-600 text-white hover:bg-blue-700", desc: "New invoice", type: "link", href: "/admin/invoices/create" },
  { label: "Add Client", icon: UserPlus, color: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300", desc: "Register client", type: "link", href: "/admin/clients" },
  { label: "Generate Report", icon: FileBarChart, color: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300", desc: "Analytics report", type: "link", href: "/admin/reports" },
  { label: "Export CSV", icon: FileDown, color: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300", desc: "Export invoices", type: "action", actionId: "export" },
  { label: "Send Reminder", icon: Send, color: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300", desc: "Payment reminder", type: "action", actionId: "reminder" },
  { label: "Add Payment", icon: DollarSign, color: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300", desc: "Record payment", type: "link", href: "/admin/payments" },
];

export default function QuickActions() {
  const { addToast } = useToast();

  const handleAction = async (actionId?: string) => {
    if (actionId === "export") {
      try {
        const data = await exportInvoicesCsv();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "invoices-export.json";
        a.click();
        URL.revokeObjectURL(url);
        addToast("success", "Export complete", "Invoice data downloaded.");
      } catch {
        addToast("error", "Export failed", "Could not export invoices.");
      }
    } else if (actionId === "reminder") {
      try {
        const result = await remindAllInvoices();
        addToast("success", "Reminders sent", result.message || "Payment reminders sent.");
      } catch {
        addToast("error", "Failed", "Could not send reminders.");
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      <p className="mt-1 text-sm text-gray-500">Common tasks at your fingertips</p>
      <motion.div className="mt-4 grid grid-cols-2 gap-2 lg:gap-3" variants={{ visible: { transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="visible">
        {actions.map((action) => {
          const Icon = action.icon;
          if (action.type === "link" && action.href) {
            return (
              <motion.div key={action.label} variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href={action.href} className={cn("flex flex-col items-center gap-2 rounded-xl px-4 py-4 text-sm font-medium shadow-sm transition-all", action.color)}>
                  <Icon size={22} /><span>{action.label}</span>
                </Link>
              </motion.div>
            );
          }
          return (
            <motion.div key={action.label} variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <button onClick={() => handleAction(action.actionId)} className={cn("flex flex-col items-center gap-2 rounded-xl px-4 py-4 text-sm font-medium shadow-sm transition-all cursor-pointer w-full", action.color)}>
                <Icon size={22} /><span>{action.label}</span>
              </button>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
