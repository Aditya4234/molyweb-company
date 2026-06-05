"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays, Search, CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronLeft, ChevronRight, Plus, Filter, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { getLeaveRequests, getAllEmployees, getLeaveBalances, createLeaveRequest, updateLeaveRequest } from "@/lib/api";
import type { LeaveRequest, LeaveType, LeaveStatus, Employee } from "@/types";

const statusBadge: Record<string, "success" | "danger" | "warning" | "info" | "default"> = {
  approved: "success", rejected: "danger", pending: "warning", cancelled: "default",
};

const leaveColors: Record<string, string> = {
  sick: "bg-rose-100 text-rose-700",
  casual: "bg-blue-100 text-blue-700",
  earned: "bg-emerald-100 text-emerald-700",
  maternity: "bg-purple-100 text-purple-700",
  paternity: "bg-indigo-100 text-indigo-700",
  unpaid: "bg-gray-100 text-gray-700",
};

export default function LeavePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");
  const [showApply, setShowApply] = useState(false);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<Record<string, { total: number; used: number; remaining: number }>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "approved" | "rejected" } | null>(null);
  const ITEMS_PER_PAGE = 6;

  // Apply leave form state
  const [form, setForm] = useState({ employeeId: "", employeeName: "", type: "sick", fromDate: "", toDate: "", reason: "" });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    getAllEmployees().then((res) => {
      setEmployees(res.map((b: any) => ({
        id: b._id || b.id,
        employeeId: b.employeeId || `EMP-${String(b._id || b.id).slice(-6).toUpperCase()}`,
        firstName: b.firstName,
        lastName: b.lastName,
        status: "active",
      } as Employee)));
    }).catch(() => {});
    getLeaveBalances().then(setLeaveBalances).catch(() => {});
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = () => {
    getLeaveRequests().then(res => {
      setLeaveRequests(res.data.map((l: any) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return {
          id: l._id || l.id,
          employeeId: (l.employeeId || "").toUpperCase(),
          employeeName: l.employeeName,
          type: (l.type === "vacation" ? "earned" : l.type === "personal" ? "casual" : l.type) as LeaveType,
          fromDate: l.startDate,
          toDate: l.endDate,
          days,
          reason: l.reason,
          status: l.status,
          appliedOn: l.createdAt,
        } as LeaveRequest;
      }));
    }).catch(() => showToast("Failed to load leave requests"));
  };

  const handleApplyLeave = async () => {
    if (!form.employeeId || !form.fromDate || !form.toDate) {
      showToast("Please fill all required fields");
      return;
    }
    try {
      const emp = employees.find((e) => e.id === form.employeeId);
      await createLeaveRequest({
        employeeId: form.employeeId,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : form.employeeName,
        type: form.type,
        startDate: form.fromDate,
        endDate: form.toDate,
        reason: form.reason,
      });
      setShowApply(false);
      setForm({ employeeId: "", employeeName: "", type: "sick", fromDate: "", toDate: "", reason: "" });
      showToast("Leave request submitted");
      loadLeaveRequests();
    } catch {
      showToast("Failed to submit leave request");
    }
  };

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setProcessingId(id);
    try {
      await updateLeaveRequest(id, { status: action });
      showToast(`Leave ${action} successfully`);
      loadLeaveRequests();
    } catch {
      showToast(`Failed to ${action} leave`);
    }
    setProcessingId(null);
    setConfirmAction(null);
  };

  const filtered = useMemo(() => {
    let result = [...leaveRequests];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.employeeName.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter((l) => l.status === statusFilter);
    return result;
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const pendingCount = leaveRequests.filter((l) => l.status === "pending").length;
  const approvedCount = leaveRequests.filter((l) => l.status === "approved").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="mt-1 text-sm text-gray-500">Track, manage, and approve leave requests</p>
        </div>
        <button onClick={() => setShowApply(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} /> Apply Leave
        </button>
      </motion.div>

      <div className="grid gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-4 mb-6 lg:mb-8">
        {[
          { label: "Pending Requests", value: String(pendingCount), icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Approved", value: String(approvedCount), icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Rejected", value: String(leaveRequests.filter((l) => l.status === "rejected").length), icon: XCircle, color: "text-rose-600 bg-rose-50" },
          { label: "Total Applied", value: String(leaveRequests.length), icon: CalendarDays, color: "text-blue-600 bg-blue-50" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-lg", stat.color)}><stat.icon size={18} /></div>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="mt-0.5 text-xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mb-6 lg:mb-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Leave Balances</h3>
        <motion.div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" variants={{ visible: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="visible">
          {Object.entries(leaveBalances).map(([type, balance]) => (
            <motion.div key={type} variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <p className={cn("text-xs font-medium capitalize mb-2", leaveColors[type]?.split(" ")[1] || "text-gray-700")}>{type} Leave</p>
              <p className="text-2xl font-bold text-gray-900">{balance.remaining}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className={cn("h-full rounded-full", balance.used > balance.total * 0.7 ? "bg-rose-400" : "bg-emerald-400")}
                  style={{ width: `${(balance.used / balance.total) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">{balance.used}/{balance.total} used</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="mb-4 lg:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by employee, reason..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition capitalize whitespace-nowrap",
                statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            >{s}</button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {["Employee", "Type", "Duration", "Days", "Reason", "Status", "Applied On", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 first:pl-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((leave, i) => (
                <motion.tr key={leave.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className={cn("transition", leave.status === "pending" ? "bg-amber-50/30" : "hover:bg-blue-50/30")}
                >
                  <td className="px-4 py-4 first:pl-6">
                    <p className="text-sm font-medium text-gray-900">{leave.employeeName}</p>
                    <p className="text-xs text-gray-400">{leave.employeeId}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("inline-flex rounded-lg px-2.5 py-1 text-xs font-medium capitalize", leaveColors[leave.type])}>{leave.type}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(leave.fromDate)} — {formatDate(leave.toDate)}
                  </td>
                  <td className="px-4 py-4"><span className="text-sm font-semibold text-gray-900">{leave.days}</span></td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate">{leave.reason}</td>
                  <td className="px-4 py-4"><Badge variant={statusBadge[leave.status] || "default"}>{leave.status}</Badge></td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(leave.appliedOn)}</td>
                  <td className="px-4 py-4">
                    {leave.status === "pending" ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setConfirmAction({ id: leave.id, action: "approved" })}
                          disabled={processingId === leave.id}
                          className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <ThumbsUp size={14} /> Approve
                        </button>
                        <button onClick={() => setConfirmAction({ id: leave.id, action: "rejected" })}
                          disabled={processingId === leave.id}
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          <ThumbsDown size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
              {paginated.length === 0 && <tr><td colSpan={8} className="px-6 py-16 text-center text-sm text-gray-500">No leave requests found</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 lg:px-6 py-3.5">
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

      {/* Confirm Action Modal */}
      <Modal open={!!confirmAction} onClose={() => setConfirmAction(null)} title="Confirm Action" size="sm">
        <div className="text-center py-4">
          {confirmAction?.action === "approved" ? (
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-4"><ThumbsUp size={28} className="text-emerald-600" /></div>
          ) : (
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4"><ThumbsDown size={28} className="text-red-600" /></div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {confirmAction?.action === "approved" ? "Approve Leave" : "Reject Leave"}
          </h3>
          <p className="text-sm text-gray-500">
            Are you sure you want to <strong>{confirmAction?.action}</strong> this leave request?
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button onClick={() => setConfirmAction(null)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={() => confirmAction && handleAction(confirmAction.id, confirmAction.action)}
            className={cn("rounded-xl px-4 py-2.5 text-sm font-medium text-white transition",
              confirmAction?.action === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            )}
          >
            {processingId ? "Processing..." : `Yes, ${confirmAction?.action === "approved" ? "Approve" : "Reject"}`}
          </button>
        </div>
      </Modal>

      {/* Apply Leave Modal */}
      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply for Leave" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Employee *</label>
              <select className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                value={form.employeeId} onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
              >
                <option value="">Select employee</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Leave Type *</label>
              <select className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="earned">Earned Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">From Date *</label>
              <input type="date" className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                value={form.fromDate} onChange={(e) => setForm((p) => ({ ...p, fromDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">To Date *</label>
              <input type="date" className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                value={form.toDate} onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Reason</label>
            <textarea rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 resize-none"
              placeholder="Provide a brief reason for leave..." value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowApply(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleApplyLeave} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">Submit Request</button>
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