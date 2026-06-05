"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Download, ChevronLeft, ChevronRight, CreditCard, DollarSign,
  CheckCircle2, XCircle, Clock, MoreHorizontal, Eye,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { getPayments, createPayment, getPaymentReport } from "@/lib/api";

interface Payment {
  id: string;
  invoiceId: string;
  clientName: string;
  amount: number;
  method: string;
  status: "completed" | "pending" | "failed" | "refunded";
  date: string;
  fee: number;
  netAmount: number;
  reference: string;
}

const methodLabels: Record<string, string> = {
  credit_card: "Credit Card",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  check: "Check",
  upi: "UPI",
};


const statusBadge: Record<string, "success" | "warning" | "danger" | "info"> = {
  completed: "success", pending: "warning", failed: "danger", refunded: "info",
};

function backendToPayment(b: any): Payment {
  return {
    id: b.id,
    invoiceId: b.invoiceId,
    clientName: b.clientName,
    amount: b.amount,
    method: methodLabels[b.method] || b.method,
    status: b.status,
    date: b.date || (b.createdAt ? b.createdAt.split("T")[0] : ""),
    fee: 0,
    netAmount: b.amount,
    reference: b.transactionId || "",
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newPayment, setNewPayment] = useState({ invoiceId: "", clientName: "", amount: "", method: "bank_transfer" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPay, setSelectedPay] = useState<Payment | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 6;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadPayments = () => {
    getPayments().then((res) => setPayments(res.data.map(backendToPayment))).catch(() => showToast("Failed to load payments"));
  };

  useEffect(() => { loadPayments(); }, []);

  const filtered = useMemo(() => {
    let result = [...payments];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.clientName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.invoiceId.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);
    return result;
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalCollected = payments.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">Track all incoming and outgoing payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">Record Payment</button>
          <button onClick={async () => {
            try {
              const report = await getPaymentReport();
              const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "payments-report.json"; a.click();
              URL.revokeObjectURL(url);
              showToast("Report exported");
            } catch { showToast("Export failed"); }
          }} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
            <Download size={18} /> Export Report
          </button>
        </div>
      </motion.div>

      <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 lg:mb-8">
        {[
          { label: "Total Collected", value: `$${totalCollected.toLocaleString()}`, change: "+15.3% this month", icon: DollarSign, color: "text-blue-600 bg-blue-50" },
          { label: "Successful", value: String(payments.filter((p) => p.status === "completed").length), change: `${Math.round(payments.filter(p => p.status === "completed").length / payments.length * 100)}% success rate`, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Pending", value: String(payments.filter((p) => p.status === "pending").length), change: "Awaiting settlement", icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Failed", value: String(payments.filter((p) => p.status === "failed").length), change: "Needs review", icon: XCircle, color: "text-rose-600 bg-rose-50" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg", stat.color)}><stat.icon size={20} /></div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-400">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      <div className="mb-4 lg:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by client, invoice, or payment ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:max-w-md" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {["all", "completed", "pending", "failed", "refunded"].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={cn("rounded-lg px-3.5 py-1.5 text-xs font-medium transition whitespace-nowrap capitalize", statusFilter === s ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>{s}</button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {["Payment ID", "Client", "Invoice", "Amount", "Method", "Date", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 first:pl-6">{h}</th>
                ))}
                <th className="px-4 py-3.5 last:pr-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((pay, i) => (
                <motion.tr
                  key={pay.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="transition hover:bg-blue-50/30 cursor-pointer"
                  onClick={() => setSelectedPay(pay)}>
                  <td className="px-4 py-4 first:pl-6"><span className="text-sm font-medium text-blue-600">{pay.id}</span></td>
                  <td className="px-4 py-4"><p className="text-sm font-medium text-gray-900">{pay.clientName}</p></td>
                  <td className="px-4 py-4"><span className="text-sm text-gray-600">{pay.invoiceId}</span></td>
                  <td className="px-4 py-4"><span className="text-sm font-semibold text-gray-900">{formatCurrency(pay.amount)}</span></td>
                  <td className="px-4 py-4"><span className="text-xs text-gray-500">{pay.method}</span></td>
                  <td className="px-4 py-4"><span className="text-sm text-gray-600">{formatDate(pay.date)}</span></td>
                  <td className="px-4 py-4"><Badge variant={statusBadge[pay.status] || "default"}>{pay.status}</Badge></td>
                  <td className="px-4 py-4 last:pr-6">
                    <button onClick={() => setSelectedPay(pay)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><MoreHorizontal size={16} /></button>
                  </td>
                </motion.tr>
              ))}
              {paginated.length === 0 && <tr><td colSpan={8} className="px-6 py-16 text-center text-sm text-gray-500">No payments found</td></tr>}
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

      <Modal open={!!selectedPay} onClose={() => setSelectedPay(null)} title="Payment Details" size="md">
        {selectedPay && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div><h3 className="text-xl font-bold text-gray-900">{selectedPay.id}</h3><p className="text-sm text-gray-500">Ref: {selectedPay.reference}</p></div>
              <Badge variant={statusBadge[selectedPay.status] || "default"}>{selectedPay.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Client:</span> <span className="text-gray-900 ml-1">{selectedPay.clientName}</span></div>
              <div><span className="text-gray-500">Invoice:</span> <span className="text-gray-900 ml-1">{selectedPay.invoiceId}</span></div>
              <div><span className="text-gray-500">Amount:</span> <span className="text-gray-900 ml-1 font-semibold">{formatCurrency(selectedPay.amount)}</span></div>
              <div><span className="text-gray-500">Fee:</span> <span className="text-gray-900 ml-1">{formatCurrency(selectedPay.fee)}</span></div>
              <div><span className="text-gray-500">Net Amount:</span> <span className="text-gray-900 ml-1 font-semibold">{formatCurrency(selectedPay.netAmount)}</span></div>
              <div><span className="text-gray-500">Method:</span> <span className="text-gray-900 ml-1">{selectedPay.method}</span></div>
              <div><span className="text-gray-500">Date:</span> <span className="text-gray-900 ml-1">{formatDate(selectedPay.date)}</span></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Record Payment" size="md">
        <div className="space-y-4">
          {[
            { label: "Invoice ID", key: "invoiceId" },
            { label: "Client Name", key: "clientName" },
            { label: "Amount", key: "amount", type: "number" },
          ].map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{f.label}</label>
              <input type={f.type || "text"} value={(newPayment as any)[f.key]} onChange={(e) => setNewPayment((p) => ({ ...p, [f.key]: e.target.value }))} className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Method</label>
            <select value={newPayment.method} onChange={(e) => setNewPayment((p) => ({ ...p, method: e.target.value }))} className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none">
              {Object.keys(methodLabels).map((m) => <option key={m} value={m}>{methodLabels[m]}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => setShowAdd(false)} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
            <button onClick={async () => {
              try {
                await createPayment({ ...newPayment, amount: parseFloat(newPayment.amount), status: "completed", date: new Date().toISOString().split("T")[0] });
                setShowAdd(false);
                loadPayments();
                showToast("Payment recorded");
              } catch { showToast("Failed to record payment"); }
            }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white">Save</button>
          </div>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </motion.div>
  );
}
