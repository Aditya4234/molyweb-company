"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Download,
  Printer,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import type { Invoice, SortConfig } from "@/types";
import { cn, formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { useDebounce } from "@/hooks/useDebounce";
import { getAllInvoices, updateInvoice, deleteInvoice, remindInvoice, emailInvoice, exportInvoicesCsv } from "@/lib/api";
import { generateInvoicePDF, downloadPDF, printPDF, invoiceToFormData } from "@/lib/invoice/pdf";

const statusVariantMap: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  paid: "success", pending: "warning", overdue: "danger", draft: "default", cancelled: "default",
};

const ITEMS_PER_PAGE = 8;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortConfig>({ key: "id", direction: "desc" });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const showToastFn = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  useEffect(() => {
    getAllInvoices()
      .then(setInvoices)
      .catch((e) => setLoadError(e.message || "Failed to load invoices"));
  }, []);

  const filtered = useMemo(() => {
    let result = [...invoices];
    const q = debouncedSearch.toLowerCase();
    if (q) {
      result = result.filter((inv) =>
        inv.id.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.email.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((inv) => inv.status === statusFilter);
    }
    result.sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      switch (sort.key) {
        case "amount": return (a.amount - b.amount) * dir;
        case "dueDate": return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * dir;
        case "clientName": return a.clientName.localeCompare(b.clientName) * dir;
        default: return a.id.localeCompare(b.id) * dir;
      }
    });
    return result;
  }, [invoices, debouncedSearch, statusFilter, sort]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSort = (key: string) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sort.key !== columnKey) return <ArrowUpDown size={12} className="text-gray-300" />;
    return sort.direction === "asc"
      ? <ArrowUpDown size={12} className="text-blue-600" />
      : <ArrowUpDown size={12} className="text-blue-600" />;
  };

  const statuses = ["all", "paid", "pending", "overdue", "draft"];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all your invoices, GST, and payments
          </p>
        </div>
        <Link
          href="/admin/invoices/create"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Invoice
        </Link>
      </motion.div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices by ID, client, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition whitespace-nowrap",
                statusFilter === s
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {[
                  { key: "id", label: "Invoice ID" },
                  { key: "clientName", label: "Client" },
                  { key: "amount", label: "Amount" },
                  { key: "dueDate", label: "Due Date" },
                  { key: "status", label: "Status" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="cursor-pointer px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 first:pl-6 last:pr-6"
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      <SortIcon columnKey={col.key} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 last:pr-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((invoice, i) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="transition hover:bg-blue-50/30">
                  <td className="px-4 py-4 first:pl-6">
                    <span className="text-sm font-medium text-blue-600">{invoice.id}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-gray-900">{invoice.clientName}</p>
                    <p className="text-xs text-gray-500">{invoice.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">{formatDate(invoice.dueDate)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={statusVariantMap[invoice.status] || "default"}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 last:pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setPreviewInvoice(invoice)}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={async () => {
                          const blob = await generateInvoicePDF(invoiceToFormData(invoice));
                          downloadPDF(blob, `${invoice.id}.pdf`);
                        }}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={async () => {
                          const blob = await generateInvoicePDF(invoiceToFormData(invoice));
                          printPDF(blob);
                        }}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Printer size={16} />
                      </button>
                      <Dropdown
                        trigger={
                          <button className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                            <Filter size={16} />
                          </button>
                        }
                        items={[
                          { label: "View Details", icon: Eye, onClick: () => window.location.href = `/admin/invoices/${invoice.id}` },
                          { label: "Download PDF", icon: Download, onClick: async () => {
                            const blob = await generateInvoicePDF(invoiceToFormData(invoice));
                            downloadPDF(blob, `${invoice.id}.pdf`);
                          }},
                          { label: "Print", icon: Printer, onClick: async () => {
                            const blob = await generateInvoicePDF(invoiceToFormData(invoice));
                            printPDF(blob);
                          }},
                          { label: "Email Invoice", icon: undefined, onClick: async () => {
                            try {
                              await emailInvoice(invoice.id);
                              showToastFn(`Invoice emailed to ${invoice.email}`);
                            } catch { showToastFn("Failed to email invoice"); }
                          }},
                          { label: "Send Reminder", icon: undefined, onClick: async () => {
                            try {
                              await remindInvoice(invoice.id);
                              showToastFn(`Reminder sent for ${invoice.id}`);
                            } catch { showToastFn("Failed to send reminder"); }
                          }},
                          { label: "Mark as Paid", icon: undefined, onClick: async () => {
                            try {
                              await updateInvoice(invoice.id, { status: "paid" });
                              setInvoices((prev) => prev.map((inv) => inv.id === invoice.id ? { ...inv, status: "paid" } : inv));
                              showToastFn(`${invoice.id} marked as paid`);
                            } catch { showToastFn("Failed to update invoice"); }
                          }},
                          { label: "Delete", icon: undefined, danger: true, onClick: async () => {
                            if (!confirm("Delete this invoice?")) return;
                            try {
                              await deleteInvoice(invoice.id);
                              setInvoices((prev) => prev.filter((inv) => inv.id !== invoice.id));
                              showToastFn(`${invoice.id} deleted`);
                            } catch { showToastFn("Failed to delete invoice"); }
                          }},
                        ]}
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
              {paginated.length === 0 && (
                <tr key="empty-state">
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <p className="text-sm text-gray-500">No invoices found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3.5">
            <p className="text-xs text-gray-500">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition",
                    page === i + 1 ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100",
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <Modal open={!!previewInvoice} onClose={() => setPreviewInvoice(null)} title={`Invoice ${previewInvoice?.id}`} size="lg">
        {previewInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Client</p>
                <p className="text-sm font-semibold text-gray-900">{previewInvoice.clientName}</p>
                <p className="text-xs text-gray-500">{previewInvoice.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500">Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(previewInvoice.amount)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Due Date</p>
                <p className="text-sm text-gray-900">{formatDate(previewInvoice.dueDate)}</p>
              </div>
              <div className="text-right">
                <Badge variant={statusVariantMap[previewInvoice.status] || "default"}>
                  {previewInvoice.status.charAt(0).toUpperCase() + previewInvoice.status.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 flex gap-3">
              <button onClick={async () => {
                const blob = await generateInvoicePDF(invoiceToFormData(previewInvoice));
                downloadPDF(blob, `${previewInvoice.id}.pdf`);
              }} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                Download PDF
              </button>
              <button onClick={() => showToastFn(`Reminder sent for ${previewInvoice.id}`)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                Send Reminder
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          {toastMsg}
          <button onClick={() => setToastMsg(null)} className="ml-3 text-white/60 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}
    </motion.div>
  );
}
