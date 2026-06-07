"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  User,
  CalendarDays,
  CalendarCheck,
  DollarSign,
  Clock,
  Briefcase,
  ArrowRight,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getLeaveBalances, getLeaveRequests, getAttendance } from "@/lib/api";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [leaveBalances, setLeaveBalances] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      getLeaveBalances(user.id).then(setLeaveBalances).catch(() => {});
      getLeaveRequests("", user.id).then((res) => setLeaveRequests(res.data || [])).catch(() => {});
      getAttendance(user.id).then((res) => {
        const data = res.data || [];
        data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentAttendance(data.slice(0, 5));
      }).catch(() => {});
    }
  }, [user?.id]);

  const initials = user?.name?.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2) || "U";
  const totalLeaveRemaining = leaveBalances
    ? Object.values(leaveBalances).reduce((sum: number, l: any) => sum + (l.remaining || 0), 0)
    : 0;

  const statusIcon: Record<string, React.ElementType> = {
    approved: CheckCircle,
    rejected: XCircle,
    pending: AlertCircle,
  };
  const statusColor: Record<string, string> = {
    approved: "text-emerald-600 bg-emerald-50",
    rejected: "text-red-600 bg-red-50",
    pending: "text-amber-600 bg-amber-50",
  };

  return (
    <div className="p-4 lg:p-8 min-w-0 space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-blue-200">
          {initials}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name || "Employee"}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {user?.email} &middot; Employee Dashboard
          </p>
        </div>
        <Link
          href="/employee/profile"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <User size={16} />
          View Profile
        </Link>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Leave Balance</p>
              <p className="text-xl font-bold text-gray-900">{totalLeaveRemaining} days</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Pending Leaves</p>
              <p className="text-xl font-bold text-gray-900">
                {leaveRequests.filter((l) => l.status === "pending").length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <CalendarCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Leaves</p>
              <p className="text-xl font-bold text-gray-900">{leaveRequests.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Recent Attendance</p>
              <p className="text-xl font-bold text-gray-900">{recentAttendance.length} records</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <Link
            href="/employee/profile"
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:bg-blue-50 hover:border-blue-100 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <User size={18} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">My Profile</span>
            </div>
            <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-500 transition" />
          </Link>
          <Link
            href="/admin/attendance"
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:bg-emerald-50 hover:border-emerald-100 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <CalendarDays size={18} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Attendance</span>
            </div>
            <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-500 transition" />
          </Link>
          <Link
            href="/admin/leave"
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:bg-purple-50 hover:border-purple-100 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <CalendarCheck size={18} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Apply Leave</span>
            </div>
            <ArrowRight size={16} className="text-gray-400 group-hover:text-purple-500 transition" />
          </Link>
        </div>
      </motion.div>

      {/* Leave Balances & Recent Leaves */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leave Balance Details */}
        {leaveBalances && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Balances</h2>
            <div className="space-y-3">
              {Object.entries(leaveBalances).map(([key, val]: [string, any]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{key} Leave</span>
                    <span className="text-sm text-gray-500">
                      {val.used}/{val.total} used
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${val.total > 0 ? (val.used / val.total) * 100 : 0}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        val.remaining > 0 ? "bg-blue-500" : "bg-red-400"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {val.remaining} day{val.remaining !== 1 ? "s" : ""} remaining
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Leave Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Leave Requests</h2>
            <Link
              href="/admin/leave"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          {leaveRequests.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No leave requests yet</p>
          ) : (
            <div className="space-y-2">
              {leaveRequests.slice(0, 5).map((leave: any) => {
                const StatusIcon = statusIcon[leave.status] || AlertCircle;
                return (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${statusColor[leave.status] || "text-gray-600 bg-gray-100"}`}>
                        <StatusIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 capitalize truncate">
                          {leave.type} Leave
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(leave.fromDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {leave.toDate !== leave.fromDate
                            ? ` - ${new Date(leave.toDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                            : ""}{" "}
                          &middot; {leave.days} day{leave.days !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold capitalize shrink-0 ${
                        leave.status === "approved"
                          ? "text-emerald-600"
                          : leave.status === "rejected"
                          ? "text-red-600"
                          : "text-amber-600"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Attendance */}
      {recentAttendance.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Attendance</h2>
            <Link
              href="/admin/attendance"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((att: any) => (
                  <tr key={att.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 px-2 text-gray-900 font-medium">
                      {new Date(att.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          att.status === "present"
                            ? "bg-emerald-50 text-emerald-700"
                            : att.status === "absent"
                            ? "bg-red-50 text-red-700"
                            : att.status === "half-day"
                            ? "bg-amber-50 text-amber-700"
                            : att.status === "wfh"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {att.status.replace("-", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-600">{att.checkIn || "—"}</td>
                    <td className="py-3 px-2 text-gray-600">{att.checkOut || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
