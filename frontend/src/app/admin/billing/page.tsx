"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Download, ChevronLeft, ChevronRight, Receipt, DollarSign,
  TrendingUp, Clock, MoreHorizontal, Eye, Printer,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { getBillingPlans, createBillingPlan } from "@/lib/api";

interface BillingRecord {
  id: string;
  clientName: string;
  plan: string;
  amount: number;
  billingCycle: "monthly" | "quarterly" | "yearly";
  status: "active" | "past_due" | "cancelled" | "trialing";
  lastPayment: string;
  nextBilling: string;
  paymentMethod: string;
}

const planMap: Record<string, string> = { basic: "Starter", pro: "Business", enterprise: "Enterprise" };
const statusMap: Record<string, "active" | "past_due" | "cancelled" | "trialing"> = {
  active: "active", cancelled: "cancelled", expired: "past_due", trial: "trialing",
};

const planColors: Record<string, "info" | "success" | "warning" | "default"> = {
  Enterprise: "info", Business: "success", Starter: "default",
};

const statusBadge: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  active: "success", past_due: "danger", cancelled: "default", trialing: "info",
};

function backendToBilling(b: any): BillingRecord {
  const start = b.startDate ? new Date(b.startDate) : new Date();
  const end = b.endDate ? new Date(b.endDate) : new Date(Date.now() + 30 * 86400000);
  const diffDays = (end.getTime() - start.getTime()) / 86400000;
  let cycle: "monthly" | "quarterly" | "yearly" = "monthly";
  if (diffDays >= 330) cycle = "yearly";
  else if (diffDays >= 80) cycle = "quarterly";
  return {
    id: b.id,
    clientName: b.clientName,
    plan: planMap[b.plan] || b.plan,
    amount: b.amount,
    billingCycle: cycle,
    status: statusMap[b.status] || "active",
    lastPayment: "—",
    nextBilling: b.endDate ? b.endDate.split("T")[0] : "—",
    paymentMethod: "N/A",
  };
}

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingRecord[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBill, setSelectedBill] = useState<BillingRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 6;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    getBillingPlans().then((res) => setBillingData(res.data.map(backendToBilling))).catch(() => showToast("Failed to load billing plans"));
  }, []);

  const filtered = useMemo(() => {
    let result = [...billingData];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((b) => b.clientName.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.plan.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") result = result.filter((b) => b.status === statusFilter);
    return result;
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const mrr = billingData.filter((b) => b.status === "active" || b.status === "trialing").reduce((s, b) => {
    if (b.billingCycle === "yearly") return s + b.amount / 12;
    if (b.billingCycle === "quarterly") return s + b.amount / 3;
    return s + b.amount;
  }, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage subscription billing details</p>
        </div>
        <button onClick={() => showToast("Exporting billing report...")} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
          <Download size={18} /> Export Report
        </button>
      </motion.div>

      <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 lg:mb-8">
        {[
          { label: "Monthly Recurring Revenue", value: `$${Math.round(mrr).toLocaleString()}`, change: "+12.5% vs last month", icon: DollarSign, color: "text-blue-600 bg-blue-50" },
          { label: "Active Subscriptions", value: String(billingData.filter((b) => b.status === "active").length), change: `${Math.round(billingData.filter(b => b.status === "active").length / billingData.length * 100)}% of total`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
          { label: "Past Due", value: String(billingData.filter((b) => b.status === "past_due").length), change: "Requires attention", icon: Clock, color: "text-rose-600 bg-rose-50" },
          { label: "Avg Revenue/Client", value: `$${Math.round(billingData.reduce((s, b) => s + b.amount, 0) / billingData.length).toLocaleString()}`, change: "per month", icon: Receipt, color: "text-purple-600 bg-purple-50" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg", stat.color)}>
              <stat.icon size={20} />
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-400">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      <div className="mb-4 lg:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by client, plan, or ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:max-w-md" />
        </div>
        <div className="flex items-center gap-2">
          {["all", "active", "past_due", "trialing", "cancelled"].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={cn("rounded-lg px-3.5 py-1.5 text-xs font-medium transition whitespace-nowrap capitalize", statusFilter === s ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {["Client", "Plan", "Amount", "Cycle", "Next Billing", "Payment", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 first:pl-6">{h}</th>
                ))}
                <th className="px-4 py-3.5 last:pr-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((bill) => (
                <tr key={bill.id} className="transition hover:bg-blue-50/30 cursor-pointer" onClick={() => setSelectedBill(bill)}>
                  <td className="px-4 py-4 first:pl-6"><p className="text-sm font-medium text-gray-900">{bill.clientName}</p></td>
                  <td className="px-4 py-4"><Badge variant={planColors[bill.plan] || "default"}>{bill.plan}</Badge></td>
                  <td className="px-4 py-4"><span className="text-sm font-semibold text-gray-900">{formatCurrency(bill.amount)}</span></td>
                  <td className="px-4 py-4"><span className="text-sm text-gray-600 capitalize">{bill.billingCycle}</span></td>
                  <td className="px-4 py-4"><span className="text-sm text-gray-600">{bill.nextBilling === "—" ? "—" : formatDate(bill.nextBilling)}</span></td>
                  <td className="px-4 py-4"><span className="text-xs text-gray-500">{bill.paymentMethod}</span></td>
                  <td className="px-4 py-4"><Badge variant={statusBadge[bill.status] || "default"}>{bill.status.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-4 last:pr-6">
                    <button onClick={() => setSelectedBill(bill)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><MoreHorizontal size={16} /></button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && <tr><td colSpan={8} className="px-6 py-16 text-center text-sm text-gray-500">No billing records found</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3.5">
            <p className="text-xs text-gray-500">Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16} /></button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition", page === i + 1 ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100")}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </motion.div>

      <Modal open={!!selectedBill} onClose={() => setSelectedBill(null)} title="Billing Details" size="lg">
        {selectedBill && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div><h3 className="text-xl font-bold text-gray-900">{selectedBill.clientName}</h3><p className="text-sm text-gray-500">{selectedBill.id}</p></div>
              <Badge variant={statusBadge[selectedBill.status] || "default"}>{selectedBill.status.replace("_", " ")}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Plan:</span> <span className="text-gray-900 ml-1 font-medium">{selectedBill.plan}</span></div>
              <div><span className="text-gray-500">Amount:</span> <span className="text-gray-900 ml-1 font-semibold">{formatCurrency(selectedBill.amount)}/{selectedBill.billingCycle}</span></div>
              <div><span className="text-gray-500">Billing Cycle:</span> <span className="text-gray-900 ml-1 capitalize">{selectedBill.billingCycle}</span></div>
              <div><span className="text-gray-500">Payment Method:</span> <span className="text-gray-900 ml-1">{selectedBill.paymentMethod}</span></div>
              <div><span className="text-gray-500">Last Payment:</span> <span className="text-gray-900 ml-1">{selectedBill.lastPayment === "—" ? "N/A" : formatDate(selectedBill.lastPayment)}</span></div>
              <div><span className="text-gray-500">Next Billing:</span> <span className="text-gray-900 ml-1">{selectedBill.nextBilling === "—" ? "N/A" : formatDate(selectedBill.nextBilling)}</span></div>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </motion.div>
  );
}
