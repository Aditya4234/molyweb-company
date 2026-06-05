"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, Users, TrendingUp, Clock, Search, Download,
  ChevronLeft, ChevronRight, MoreHorizontal, CheckCircle2, Send,
  Banknote, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { getPayrollRecords, getAllEmployees, runPayroll, updatePayroll } from "@/lib/api";
import type { PayrollRun, PayrollStatus, Employee } from "@/types";

const statusBadge: Record<string, "success" | "warning" | "danger" | "default"> = {
  paid: "success", processing: "warning", pending: "default",
};

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function PayrollPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [selectedYear] = useState(2026);
  const [page, setPage] = useState(1);
  const [selectedPay, setSelectedPay] = useState<PayrollRun | null>(null);
  const [showRunPayroll, setShowRunPayroll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRun[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const ITEMS_PER_PAGE = 8;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    let currentEmps: Employee[] = [];
    getAllEmployees().then((res) => {
      currentEmps = res.map((b: any) => ({
        id: b.id,
        employeeId: b.id.toUpperCase(),
        firstName: b.firstName,
        lastName: b.lastName,
        department: b.department,
        status: b.status,
      } as Employee));
      setEmployees(currentEmps);
    }).catch(() => {});

    getPayrollRecords().then(res => {
      setPayrollRecords(res.data.map((p: any) => {
        const emp = currentEmps.find(e => e.id === p.employeeId || e.id.toLowerCase() === p.employeeId.toLowerCase());
        const gross = p.basicSalary + p.allowances;
        return {
          id: p.id,
          employeeId: p.employeeId.toUpperCase(),
          employeeName: p.employeeName,
          department: emp ? emp.department : "Unknown",
          month: months.indexOf(p.month),
          year: p.year,
          basic: p.basicSalary,
          hra: p.allowances * 0.4,
          allowances: p.allowances * 0.6,
          bonus: 0,
          grossPay: gross,
          pf: p.deductions * 0.5,
          esi: 0,
          professionalTax: 200,
          tds: p.deductions * 0.5 - 200,
          otherDeductions: 0,
          totalDeductions: p.deductions,
          netPay: p.netSalary,
          status: p.status,
          paidDate: p.paidDate,
          paymentMode: "Bank Transfer"
        } as PayrollRun;
      }));
    }).catch(() => showToast("Failed to load payroll"));
  }, []);

  const monthPayroll = payrollRecords.filter((p) => p.month === selectedMonth && p.year === selectedYear);

  const filtered = useMemo(() => {
    let result = [...monthPayroll];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.employeeName.toLowerCase().includes(q) ||
        p.employeeId.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);
    return result;
  }, [search, statusFilter, selectedMonth, selectedYear]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalGross = monthPayroll.reduce((s, p) => s + p.grossPay, 0);
  const totalNet = monthPayroll.reduce((s, p) => s + p.netPay, 0);
  const totalDeductions = monthPayroll.reduce((s, p) => s + p.totalDeductions, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="mt-1 text-sm text-gray-500">Process salaries and manage payroll records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowRunPayroll(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Send size={18} /> Run Payroll
          </button>
          <button onClick={() => showToast("Exporting payroll data...")} className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            <Download size={18} /> Export
          </button>
        </div>
      </motion.div>

      <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 lg:mb-8">
        {[
          { label: "Total Gross", value: `₹${(totalGross / 100000).toFixed(2)}L`, change: `${monthPayroll.length} employees`, icon: DollarSign, color: "text-blue-600 bg-blue-50" },
          { label: "Net Payable", value: `₹${(totalNet / 100000).toFixed(2)}L`, change: "after deductions", icon: Banknote, color: "text-emerald-600 bg-emerald-50" },
          { label: "Total Deductions", value: `₹${(totalDeductions / 100000).toFixed(2)}L`, change: "PF, TDS, ESI, etc", icon: TrendingUp, color: "text-rose-600 bg-rose-50" },
          { label: "Avg Salary", value: `₹${monthPayroll.length > 0 ? Math.round(totalNet / monthPayroll.length).toLocaleString() : 0}`, change: "per employee", icon: Users, color: "text-purple-600 bg-purple-50" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg", stat.color)}><stat.icon size={20} /></div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-400">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Month Selector + Filters */}
      <div className="mb-4 lg:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-1.5">
          <button onClick={() => setSelectedMonth((p) => (p === 0 ? 11 : p - 1))} className="p-1 text-gray-400 hover:text-gray-600"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-gray-900 min-w-[120px] text-center">{months[selectedMonth]} {selectedYear}</span>
          <button onClick={() => setSelectedMonth((p) => (p === 11 ? 0 : p + 1))} className="p-1 text-gray-400 hover:text-gray-600"><ChevronRight size={16} /></button>
        </div>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search employee..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {(["all", "paid", "pending", "processing"] as const).map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition capitalize whitespace-nowrap",
                statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Payroll Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {["Employee", "Department", "Gross Pay", "Deductions", "Net Pay", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 first:pl-6">{h}</th>
                ))}
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
                  <td className="px-4 py-4 first:pl-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shrink-0">
                        {pay.employeeName.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pay.employeeName}</p>
                        <p className="text-xs text-gray-400">{pay.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{pay.department}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900">₹{pay.grossPay.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-rose-600">₹{pay.totalDeductions.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm font-bold text-emerald-600">₹{pay.netPay.toLocaleString()}</td>
                  <td className="px-4 py-4"><Badge variant={statusBadge[pay.status] || "default"}>{pay.status}</Badge></td>
                  <td className="px-4 py-4 last:pr-6">
                    <button onClick={() => setSelectedPay(pay)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {paginated.length === 0 && <tr><td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-500">No payroll records for this month</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 lg:px-6 py-3.5">
            <p className="text-xs text-gray-500">Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16} /></button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition", page === i + 1 ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100")}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Payslip Modal */}
      <Modal open={!!selectedPay} onClose={() => setSelectedPay(null)} title="Salary Details" size="lg">
        {selectedPay && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedPay.employeeName}</h3>
                <p className="text-sm text-gray-500">{selectedPay.department} · {selectedPay.employeeId}</p>
              </div>
              <Badge variant={statusBadge[selectedPay.status] || "default"}>{selectedPay.status}</Badge>
            </div>
            <div className="text-center border-b border-gray-100 pb-4">
              <p className="text-sm font-medium text-gray-500">Payslip for {months[selectedPay.month - 1]} {selectedPay.year}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Earnings</h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Basic</span><span className="text-gray-900 font-medium">₹{selectedPay.basic.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">HRA</span><span className="text-gray-900 font-medium">₹{selectedPay.hra.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Allowances</span><span className="text-gray-900 font-medium">₹{selectedPay.allowances.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Bonus</span><span className="text-gray-900 font-medium">₹{selectedPay.bonus.toLocaleString()}</span></div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between text-base font-bold"><span className="text-gray-900">Gross Pay</span><span className="text-gray-900">₹{selectedPay.grossPay.toLocaleString()}</span></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Deductions</h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">PF (12%)</span><span className="text-gray-900 font-medium">₹{selectedPay.pf.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">ESI</span><span className="text-gray-900 font-medium">₹{selectedPay.esi.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Professional Tax</span><span className="text-gray-900 font-medium">₹{selectedPay.professionalTax.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">TDS</span><span className="text-gray-900 font-medium">₹{selectedPay.tds.toLocaleString()}</span></div>
                  {selectedPay.otherDeductions > 0 && (
                    <div className="flex justify-between"><span className="text-gray-600">Other</span><span className="text-gray-900 font-medium">₹{selectedPay.otherDeductions.toLocaleString()}</span></div>
                  )}
                  <hr className="border-gray-100" />
                  <div className="flex justify-between text-base font-bold"><span className="text-rose-600">Total Deductions</span><span className="text-rose-600">₹{selectedPay.totalDeductions.toLocaleString()}</span></div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Net Payable</span>
                <span className="text-2xl font-bold text-emerald-600">₹{selectedPay.netPay.toLocaleString()}</span>
              </div>
              {selectedPay.paymentMode && (
                <p className="mt-2 text-xs text-gray-400">Payment via {selectedPay.paymentMode} on {selectedPay.paidDate}</p>
              )}
            </div>
            <div className="flex gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => showToast(`Downloading payslip for ${selectedPay.employeeName}...`)} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">
                <FileText size={16} /> Download Payslip
              </button>
              <button onClick={() => showToast(`Payslip emailed to ${selectedPay.employeeName}`)} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                <Send size={16} /> Email Payslip
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Run Payroll Modal */}
      <Modal open={showRunPayroll} onClose={() => setShowRunPayroll(false)} title="Run Payroll" size="md">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Payroll Month</label>
            <select className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
              {months.map((m, i) => <option key={i} value={i}>{m} 2026</option>)}
            </select>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 text-sm">
            <p className="font-medium text-blue-800">Payroll Summary</p>
            <div className="mt-2 space-y-1 text-blue-700">
              <p>Total Employees: {employees.length}</p>
              <p>Active Employees: {employees.filter((e) => e.status === "active").length}</p>
              <p>Estimated Gross Pay: ₹{totalGross.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowRunPayroll(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button onClick={async () => {
              try {
                const result = await runPayroll(months[selectedMonth], selectedYear);
                setShowRunPayroll(false);
                showToast(`Payroll run: ${result.created} records created`);
                window.location.reload();
              } catch { showToast("Payroll run failed"); }
            }} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition">
              <CheckCircle2 size={16} className="inline mr-1.5" /> Confirm & Process
            </button>
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
