"use client";

import { useState, use, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Banknote,
  Shield, Edit, Download, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { getEmployee, getAttendance, getPayrollRecords, getLeaveRequests } from "@/lib/api";
import type { Employee, LeaveRequest, PayrollRun, LeaveType, LeaveStatus } from "@/types";

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const statusVariant: Record<string, "success" | "danger" | "warning" | "default"> = {
  active: "success", inactive: "default", "on-leave": "warning",
};

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [emp, setEmp] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [empAttendance, setEmpAttendance] = useState<any[]>([]);
  const [empPayroll, setEmpPayroll] = useState<PayrollRun[]>([]);
  const [empLeaves, setEmpLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const b = await getEmployee(id).catch(() => null);
      if (b) {
        const mappedEmp: Employee = {
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
        };
        setEmp(mappedEmp);

        // Fetch related data
        const att = await getAttendance(mappedEmp.employeeId).then(r => r.data).catch(() => []);
        setEmpAttendance(att);

        const pr = await getPayrollRecords().then(r => r.data).catch(() => []);
        const myPr = pr.filter((p: any) => p.employeeId.toLowerCase() === b.id.toLowerCase()).map((p: any) => ({
          id: p.id,
          employeeId: mappedEmp.employeeId,
          employeeName: mappedEmp.firstName + " " + mappedEmp.lastName,
          department: mappedEmp.department,
          month: months.indexOf(p.month),
          year: p.year,
          basic: p.basicSalary,
          hra: p.allowances * 0.4,
          allowances: p.allowances * 0.6,
          bonus: 0,
          grossPay: p.basicSalary + p.allowances,
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
        } as PayrollRun));
        setEmpPayroll(myPr);

        const lr = await getLeaveRequests(undefined, mappedEmp.employeeId).then(r => r.data).catch(() => []);
        setEmpLeaves(lr.map((l: any) => {
          const start = new Date(l.startDate);
          const end = new Date(l.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return {
            id: l.id,
            employeeId: mappedEmp.employeeId,
            employeeName: mappedEmp.firstName + " " + mappedEmp.lastName,
            type: (l.type === "vacation" ? "earned" : l.type === "personal" ? "casual" : l.type) as LeaveType,
            fromDate: l.startDate,
            toDate: l.endDate,
            days: days,
            reason: l.reason,
            status: l.status as LeaveStatus,
            appliedOn: l.createdAt,
          } as LeaveRequest;
        }));
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 lg:p-8 min-w-0 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-500">Loading employee details...</div>
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="p-4 lg:p-8 min-w-0 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Employee Not Found</h2>
          <p className="mt-1 text-sm text-gray-500">The employee you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/admin/employees" className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
            <ArrowLeft size={16} /> Back to Employees
          </Link>
        </div>
      </div>
    );
  }

  const presentDays = empAttendance.filter((a) => a.status === "present" || a.status === "wfh").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
        <Link href="/admin/employees" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-4">
          <ArrowLeft size={16} /> Back to Employees
        </Link>
      </motion.div>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-md shrink-0">
              {emp.firstName[0]}{emp.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{emp.firstName} {emp.lastName}</h1>
              <p className="text-sm text-gray-500">{emp.designation}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Briefcase size={12} /> {emp.department}</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {emp.workLocation}</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> Joined {formatDate(emp.joiningDate)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[emp.status] || "default"}>{emp.status}</Badge>
            <Link href={`/admin/create-employee?id=${emp.id}`} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
              <Edit size={16} />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {["overview", "attendance", "payroll", "leaves", "documents"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition capitalize whitespace-nowrap",
              activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700",
            )}
          >
            {tab === "payroll" ? "Payroll & Salary" : tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Personal Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-900">{emp.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-gray-900">{emp.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">DOB</span><span className="text-gray-900">{formatDate(emp.dob)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Gender</span><span className="text-gray-900 capitalize">{emp.gender}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="text-gray-900 text-right max-w-[200px]">{emp.address}, {emp.city}, {emp.state} - {emp.pincode}</span></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Emergency Contact</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-gray-900">{emp.emergencyContact}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-gray-900">{emp.emergencyPhone}</span></div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Employment Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Employee ID</span><span className="text-gray-900 font-mono">{emp.employeeId}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Department</span><span className="text-gray-900">{emp.department}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Designation</span><span className="text-gray-900">{emp.designation}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="text-gray-900 capitalize">{emp.employmentType}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Joining Date</span><span className="text-gray-900">{formatDate(emp.joiningDate)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Reporting To</span><span className="text-gray-900">{emp.reportingManager || "—"}</span></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Salary Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Gross Pay</span><span className="text-gray-900 font-semibold">₹{emp.salary.grossPay.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Net Pay</span><span className="text-gray-900 font-semibold text-emerald-600">₹{emp.salary.netPay.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Deductions</span><span className="text-gray-900 text-rose-600">₹{emp.salary.totalDeductions.toLocaleString()}</span></div>
                <hr className="border-gray-100" />
                <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="text-gray-900">{emp.bankDetails.bankName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="text-gray-900 font-mono">{emp.bankDetails.accountNumber}</span></div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === "attendance" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Attendance Record</h3>
              <p className="text-sm text-gray-500">May 2026 · {presentDays} days present</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Present</span>
              <span className="flex items-center gap-1.5 text-xs"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Absent</span>
              <span className="flex items-center gap-1.5 text-xs"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Half-Day</span>
            </div>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-1.5">
            {empAttendance.map((a) => {
              const day = new Date(a.date).getDate();
              const colorMap: Record<string, string> = {
                present: "bg-emerald-100 text-emerald-700",
                absent: "bg-red-100 text-red-700",
                "half-day": "bg-amber-100 text-amber-700",
                wfh: "bg-blue-100 text-blue-700",
                leave: "bg-purple-100 text-purple-700",
                holiday: "bg-gray-100 text-gray-400",
              };
              return (
                <div key={a.id} title={`${a.date}: ${a.status}`}
                  className={cn("flex flex-col items-center rounded-lg py-2 text-xs font-medium transition", colorMap[a.status] || "bg-gray-50")}
                >
                  <span>{day}</span>
                  <span className="text-[10px] opacity-70">{a.status === "present" ? "P" : a.status === "absent" ? "A" : a.status === "half-day" ? "HD" : a.status === "wfh" ? "WFH" : a.status === "leave" ? "L" : "—"}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {activeTab === "payroll" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Payroll History</h3>
          <p className="text-sm text-gray-500 mb-6">Salary records for {emp.firstName} {emp.lastName}</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  {["Period", "Gross Pay", "Deductions", "Net Pay", "Status", "Paid On"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 first:pl-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {empPayroll.map((p) => (
                  <tr key={p.id} className="transition hover:bg-blue-50/30">
                    <td className="px-4 py-3 first:pl-4 text-sm text-gray-900">{months[p.month] ? months[p.month].substring(0,3) : "—"} {p.year}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{p.grossPay.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-rose-600">₹{p.totalDeductions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600">₹{p.netPay.toLocaleString()}</td>
                    <td className="px-4 py-3"><Badge variant={p.status === "paid" ? "success" : "warning"}>{p.status}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.paidDate || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === "leaves" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Leave Records</h3>
          <p className="text-sm text-gray-500 mb-6">Leave applications and history</p>
          {empLeaves.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No leave records found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    {["Type", "From", "To", "Days", "Reason", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 first:pl-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {empLeaves.map((l) => (
                    <tr key={l.id} className="transition hover:bg-blue-50/30">
                      <td className="px-4 py-3 first:pl-4 text-sm capitalize text-gray-900">{l.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(l.fromDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(l.toDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{l.days}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{l.reason}</td>
                      <td className="px-4 py-3">
                        <Badge variant={l.status === "approved" ? "success" : l.status === "rejected" ? "danger" : "warning"}>{l.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "documents" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Documents & IDs</h3>
          <p className="text-sm text-gray-500 mb-6">Government-issued identification documents</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "PAN Card", value: emp.documents.pan, icon: Shield, color: "text-amber-600 bg-amber-50" },
              { label: "Aadhar Number", value: emp.documents.aadhar, icon: Shield, color: "text-blue-600 bg-blue-50" },
              { label: "UAN (EPFO)", value: emp.documents.uan, icon: Shield, color: "text-purple-600 bg-purple-50" },
            ].map((doc) => {
              const Icon = doc.icon;
              return (
                <div key={doc.label} className="rounded-xl border border-gray-100 p-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg mb-3", doc.color)}>
                    <Icon size={20} />
                  </div>
                  <p className="text-xs font-medium text-gray-500">{doc.label}</p>
                  <p className="mt-1 text-sm font-mono font-semibold text-gray-900">{doc.value}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-medium text-gray-500">Bank Account</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{emp.bankDetails.bankName}</p>
              <p className="text-xs font-mono text-gray-500">A/C: {emp.bankDetails.accountNumber}</p>
              <p className="text-xs font-mono text-gray-500">IFSC: {emp.bankDetails.ifsc}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-medium text-gray-500">Salary Account</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">₹{emp.salary.netPay.toLocaleString()}/month</p>
              <p className="text-xs text-gray-500">Effective from {formatDate(emp.salary.effectiveFrom)}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
