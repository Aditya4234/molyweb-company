"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus, Search, Users, UserCheck, UserX, TrendingUp,
  MoreHorizontal, ChevronLeft, ChevronRight, Eye, Edit, Mail, Phone, MapPin,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { getEmployees, getDepartments, deleteEmployee } from "@/lib/api";
import type { Employee, Department } from "@/types";

const statusVariant: Record<string, "success" | "danger" | "warning" | "default"> = {
  active: "success", inactive: "default", "on-leave": "warning",
};

const ITEMS_PER_PAGE = 8;

function backendToEmployee(b: any): Employee {
  return {
    id: b.id,
    employeeId: b.id.toUpperCase(),
    firstName: b.firstName,
    lastName: b.lastName,
    email: b.email,
    phone: b.phone,
    gender: "other",
    dob: "1990-01-01",
    address: b.address || "",
    city: "Unknown",
    state: "Unknown",
    pincode: "000000",
    department: b.department,
    departmentId: "DEPT-000",
    designation: b.position,
    designationId: "DSG-000",
    employmentType: "full-time",
    status: b.status,
    joiningDate: b.joinDate,
    bankDetails: {
      accountNumber: b.bankAccount || "",
      ifsc: b.ifscCode || "",
      bankName: "Unknown",
      branch: "Unknown",
    },
    documents: { pan: "", aadhar: "", uan: "" },
    salary: {
      id: "SAL-" + b.id,
      employeeId: b.id,
      basic: b.salary * 0.5,
      hra: b.salary * 0.2,
      da: b.salary * 0.1,
      travelAllowance: b.salary * 0.05,
      medicalAllowance: b.salary * 0.05,
      specialAllowance: b.salary * 0.1,
      bonus: 0,
      pf: b.salary * 0.06,
      esi: 0,
      professionalTax: 200,
      tds: b.salary * 0.05,
      grossPay: b.salary,
      totalDeductions: b.salary * 0.11 + 200,
      netPay: b.salary * 0.89 - 200,
      effectiveFrom: "2024-01-01",
    },
    workLocation: "Office",
    emergencyContact: "",
    emergencyPhone: "",
    createdAt: b.createdAt || new Date().toISOString(),
    updatedAt: b.updatedAt || new Date().toISOString(),
  } as Employee;
}

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to terminate this employee?")) return;
    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setSelectedEmp(null);
      showToast("Employee removed successfully");
    } catch {
      showToast("Failed to remove employee");
    }
  };

  useEffect(() => {
    getEmployees().then((res) => setEmployees(res.data.map(backendToEmployee))).catch(() => {});
    getDepartments().then(setDepartments).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let result = [...employees];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
      );
    }
    if (deptFilter !== "all") result = result.filter((e) => e.departmentId === deptFilter);
    if (statusFilter !== "all") result = result.filter((e) => e.status === statusFilter);
    return result;
  }, [search, deptFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = [
    { label: "Total Employees", value: String(employees.length), change: "+3 this month", icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Active", value: String(employees.filter((e) => e.status === "active").length), change: `${Math.round(employees.filter(e => e.status === "active").length / employees.length * 100)}% workforce`, icon: UserCheck, color: "text-emerald-600 bg-emerald-50" },
    { label: "Departments", value: String(departments.length), change: "across org", icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
    { label: "Inactive/Left", value: String(employees.filter((e) => e.status !== "active").length), change: "need review", icon: UserX, color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your workforce and employee information</p>
        </div>
        <Link
          href="/admin/create-employee"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} /> Register Employee
        </Link>
      </motion.div>

      <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 lg:mb-8">
        {stats.map((stat, i) => (
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
          <input
            type="text" placeholder="Search by name, ID, department..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-gray-400 shrink-0">Dept:</span>
          <select
            value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-blue-300"
          >
            <option value="all">All</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          {["all", "active", "inactive", "on-leave"].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition whitespace-nowrap capitalize", statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>{s}</button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {["Employee", "Department", "Designation", "Contact", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 first:pl-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="transition hover:bg-blue-50/30 cursor-pointer"
                  onClick={() => setSelectedEmp(emp)}>
                  <td className="px-4 py-4 first:pl-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shrink-0">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-400">{emp.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className="text-sm text-gray-700">{emp.department}</span></td>
                  <td className="px-4 py-4"><span className="text-sm text-gray-600">{emp.designation}</span></td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700">{emp.email}</p>
                    <p className="text-xs text-gray-400">{emp.phone}</p>
                  </td>
                  <td className="px-4 py-4"><Badge variant={statusVariant[emp.status] || "default"}>{emp.status}</Badge></td>
                  <td className="px-4 py-4 last:pr-6">
                    <Dropdown
                      trigger={
                        <button className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                          <MoreHorizontal size={16} />
                        </button>
                      }
                      items={[
                        { label: "View", icon: Eye, onClick: () => setSelectedEmp(emp) },
                        { label: "Edit", icon: Edit, onClick: () => showToast("Edit feature coming soon") },
                        { label: "Delete", icon: undefined, danger: true, onClick: () => handleDelete(emp.id) },
                      ]}
                    />
                  </td>
                </motion.tr>
              ))}
              {paginated.length === 0 && <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-500">No employees found</td></tr>}
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

      <Modal open={!!selectedEmp} onClose={() => setSelectedEmp(null)} title="Employee Details" size="xl">
        {selectedEmp && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-md">
                  {selectedEmp.firstName[0]}{selectedEmp.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedEmp.firstName} {selectedEmp.lastName}</h3>
                  <p className="text-sm text-gray-500">{selectedEmp.designation} · {selectedEmp.department}</p>
                  <p className="text-xs text-gray-400">{selectedEmp.employeeId}</p>
                </div>
              </div>
              <Badge variant={statusVariant[selectedEmp.status] || "default"}>{selectedEmp.status}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Personal</p>
                <p><span className="text-gray-500">Email:</span> <span className="text-gray-900">{selectedEmp.email}</span></p>
                <p><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{selectedEmp.phone}</span></p>
                <p><span className="text-gray-500">DOB:</span> <span className="text-gray-900">{formatDate(selectedEmp.dob)}</span></p>
                <p><span className="text-gray-500">Gender:</span> <span className="text-gray-900 capitalize">{selectedEmp.gender}</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Employment</p>
                <p><span className="text-gray-500">Type:</span> <span className="text-gray-900 capitalize">{selectedEmp.employmentType}</span></p>
                <p><span className="text-gray-500">Joined:</span> <span className="text-gray-900">{formatDate(selectedEmp.joiningDate)}</span></p>
                <p><span className="text-gray-500">Location:</span> <span className="text-gray-900">{selectedEmp.workLocation}</span></p>
                <p><span className="text-gray-500">Manager:</span> <span className="text-gray-900">{selectedEmp.reportingManager || "—"}</span></p>
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Salary</p>
                <p><span className="text-gray-500">Gross:</span> <span className="text-gray-900 font-semibold">₹{selectedEmp.salary.grossPay.toLocaleString()}</span></p>
                <p><span className="text-gray-500">Net:</span> <span className="text-gray-900 font-semibold">₹{selectedEmp.salary.netPay.toLocaleString()}</span></p>
                <p><span className="text-gray-500">Basic:</span> <span className="text-gray-900">₹{selectedEmp.salary.basic.toLocaleString()}</span></p>
                <p><span className="text-gray-500">Deductions:</span> <span className="text-gray-900">₹{selectedEmp.salary.totalDeductions.toLocaleString()}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Address</p>
                <p className="text-gray-900">{selectedEmp.address}</p>
                <p className="text-gray-900">{selectedEmp.city}, {selectedEmp.state} - {selectedEmp.pincode}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Bank Details</p>
                <p><span className="text-gray-500">Bank:</span> <span className="text-gray-900">{selectedEmp.bankDetails.bankName}</span></p>
                <p><span className="text-gray-500">Account:</span> <span className="text-gray-900 font-mono">{selectedEmp.bankDetails.accountNumber}</span></p>
                <p><span className="text-gray-500">IFSC:</span> <span className="text-gray-900 font-mono">{selectedEmp.bankDetails.ifsc}</span></p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
              <Link href={`/admin/employees/${selectedEmp.id}`} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
                <Eye size={16} /> Full Profile
              </Link>
              <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                <Mail size={16} /> Send Email
              </button>
            </div>
          </div>
        )}
      </Modal>
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          {toastMsg}
        </div>
      )}
    </motion.div>
  );
}
