"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays, CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronLeft, ChevronRight, Search, Save, LogIn, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { getAttendance, getAllEmployees, markAttendance, updateAttendance } from "@/lib/api";
import type { AttendanceStatus, Employee } from "@/types";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_LIST: { value: AttendanceStatus; label: string; short: string; color: string; bg: string; text: string }[] = [
  { value: "present", label: "Present", short: "P", color: "bg-emerald-100 text-emerald-700", bg: "bg-emerald-100", text: "text-emerald-700" },
  { value: "absent", label: "Absent", short: "A", color: "bg-red-100 text-red-700", bg: "bg-red-100", text: "text-red-700" },
  { value: "half-day", label: "Half Day", short: "HD", color: "bg-amber-100 text-amber-700", bg: "bg-amber-100", text: "text-amber-700" },
  { value: "wfh", label: "WFH", short: "W", color: "bg-blue-100 text-blue-700", bg: "bg-blue-100", text: "text-blue-700" },
  { value: "leave", label: "Leave", short: "L", color: "bg-purple-100 text-purple-700", bg: "bg-purple-100", text: "text-purple-700" },
  { value: "holiday", label: "Holiday", short: "—", color: "bg-gray-50 text-gray-300", bg: "bg-gray-50", text: "text-gray-300" },
];

const TOGGLE_ORDER: (AttendanceStatus | undefined)[] = [undefined, "present", "absent"];

export default function AttendancePage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear] = useState(today.getFullYear());
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  useEffect(() => {
    getAllEmployees().then((res) => {
      setEmployees(res.map((b: any) => ({
        id: b.id,
        employeeId: b.employeeId || b.id.toUpperCase(),
        firstName: b.firstName,
        lastName: b.lastName,
      } as Employee)));
    });
    getAttendance().then(res => setAttendanceRecords(res.data)).catch(() => {});
  }, [currentMonth, currentYear]);

  useEffect(() => {
    if (!openMenu) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [openMenu]);

  const filteredEmployees = useMemo(() => {
    let result = [...employees];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q)
      );
    }
    if (filterStatus) {
      result = result.filter((e) => {
        for (let day = 1; day <= daysInMonth; day++) {
          if (getAttendanceForDay(e.employeeId, day) === filterStatus) return true;
        }
        return false;
      });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, changes, attendanceRecords, daysInMonth]);

  const getAttendanceForDay = (empId: string, day: number): AttendanceStatus | undefined => {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const changeKey = `${empId}-${date}`;
    if (changeKey in changes) return changes[changeKey] as AttendanceStatus;
    const rec = attendanceRecords.find((a) => a.employeeId === empId && a.date === date);
    return rec?.status;
  };

  const getRecordForDay = (empId: string, day: number) => {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendanceRecords.find((a) => a.employeeId === empId && a.date === date);
  };

  const setStatus = (empId: string, day: number, status: AttendanceStatus | undefined) => {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setChanges((prev) => {
      const next = { ...prev };
      if (status === undefined) {
        delete next[`${empId}-${date}`];
      } else {
        next[`${empId}-${date}`] = status;
      }
      return next;
    });
    setOpenMenu(null);
  };

  const toggleCell = (empId: string, day: number) => {
    const current = getAttendanceForDay(empId, day);
    const idx = TOGGLE_ORDER.indexOf(current);
    const next = TOGGLE_ORDER[(idx + 1) % TOGGLE_ORDER.length];
    setStatus(empId, day, next);
  };

  const allStats = attendanceRecords.filter((a) => {
    const [y, m] = a.date.split("-").map(Number);
    return y === currentYear && m === currentMonth + 1;
  });

  const presentCount = allStats.filter((a) => a.status === "present" || a.status === "wfh").length;
  const absentCount = allStats.filter((a) => a.status === "absent").length;
  const halfDayCount = allStats.filter((a) => a.status === "half-day").length;
  const leaveCount = allStats.filter((a) => a.status === "leave").length;

  const prevMonth = () => setCurrentMonth((p) => (p === 0 ? 11 : p - 1));
  const nextMonth = () => setCurrentMonth((p) => (p === 11 ? 0 : p + 1));

  const markTodayForAll = () => {
    const day = today.getDate();
    if (today.getMonth() !== currentMonth || today.getFullYear() !== currentYear) {
      showToast("Please switch to current month first");
      return;
    }
    employees.forEach((emp) => {
      const existing = getAttendanceForDay(emp.employeeId, day);
      if (!existing || existing === "absent") setStatus(emp.employeeId, day, "present");
    });
    showToast("All marked Present for today");
  };

  const cellKey = (empId: string, day: number) => `${empId}-${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const saveAllChanges = async () => {
    setSaving(true);
    let saved = 0;
    for (const [key, status] of Object.entries(changes)) {
      const [empId, date] = key.split("-");
      const emp = employees.find((e) => e.employeeId === empId);
      const existing = getRecordForDay(empId, parseInt(date.split("-")[2]));
      try {
        if (existing) {
          await updateAttendance(existing._id || existing.id, { status });
        } else {
          await markAttendance({
            employeeId: empId,
            employeeName: emp ? `${emp.firstName} ${emp.lastName}` : empId,
            date,
            status,
          });
        }
        saved++;
      } catch { showToast(`Failed to save ${empId}`); }
    }
    setChanges({});
    const fresh = await getAttendance().then(r => r.data).catch(() => []);
    setAttendanceRecords(fresh);
    setSaving(false);
    showToast(`Saved ${saved} record(s)`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">Click cell to toggle P/A · Click ▼ for all options</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition"><ChevronLeft size={18} /></button>
          <span className="text-sm font-semibold text-gray-900 min-w-[140px] text-center">{months[currentMonth]} {currentYear}</span>
          <button onClick={nextMonth} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition"><ChevronRight size={18} /></button>
        </div>
      </motion.div>

      {/* Action Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button onClick={markTodayForAll} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
          <LogIn size={16} /> Mark All Present Today
        </button>
        {Object.keys(changes).length > 0 && (
          <button onClick={saveAllChanges} disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50">
            <Save size={16} /> {saving ? "Saving..." : `Save ${Object.keys(changes).length}`}
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {Object.keys(changes).length > 0 ? `${Object.keys(changes).length} unsaved change(s)` : "No pending changes"}
        </span>
      </div>

      {/* Stats */}
      <div className="grid gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-4 mb-6 lg:mb-8">
        {[
          { label: "Present", value: String(presentCount), icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Absent", value: String(absentCount), icon: XCircle, color: "text-rose-600 bg-rose-50" },
          { label: "Half Day", value: String(halfDayCount), icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "On Leave", value: String(leaveCount), icon: CalendarDays, color: "text-purple-600 bg-purple-50" },
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

      {/* Search & Legend */}
      <div className="mb-4 lg:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
          <button onClick={() => setFilterStatus(null)} className={cn("rounded-md px-2 py-1 font-medium transition", !filterStatus ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>All</button>
          {STATUS_LIST.map((s) => (
            <button key={s.value} onClick={() => setFilterStatus(filterStatus === s.value ? null : s.value)}
              className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 transition",
                filterStatus === s.value ? `${s.bg} ${s.text} ring-2 ring-offset-1 ring-gray-300` : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              )}
            >
              <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold", s.color)}>{s.short}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="sticky left-0 z-10 bg-gray-50/50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[160px]">Employee</th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const date = new Date(currentYear, currentMonth, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = currentYear === today.getFullYear() && currentMonth === today.getMonth() && day === today.getDate();
                  return (
                    <th key={day} className={cn("px-1 py-3 text-center text-xs font-medium", isWeekend ? "text-gray-300" : isToday ? "text-blue-600" : "text-gray-500")}>
                      {day}
                      <span className="block text-[10px]">{["Su","Mo","Tu","We","Th","Fr","Sa"][date.getDay()]}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEmployees.map((emp, i) => (
                <motion.tr key={emp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className={cn("transition", openMenu?.startsWith(`${emp.employeeId}-`) ? "bg-blue-50" : "hover:bg-blue-50/30")}
                >
                  <td className={cn("sticky left-0 z-10 px-4 py-3 min-w-[160px]", openMenu?.startsWith(`${emp.employeeId}-`) ? "bg-blue-50" : "bg-white")}>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-[10px] font-bold text-white shrink-0">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-400">{emp.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: daysInMonth }, (_, d) => d + 1).map((day) => {
                    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const status = getAttendanceForDay(emp.employeeId, day);
                    const isChanged = `${emp.employeeId}-${date}` in changes;
                    const isToday = date === todayStr;
                    const meta = STATUS_LIST.find((s) => s.value === status);
                    const key = cellKey(emp.employeeId, day);

                    const cellHasOpenMenu = openMenu === key;

                    return (
                      <td key={day} className={cn("px-1 py-2 text-center relative", isToday && "bg-blue-50/50")}>
                        <div className={cn("relative inline-flex items-center rounded-lg", isChanged && "ring-2 ring-emerald-400 ring-offset-1")}>
                          {/* Main cell — click to toggle P/A */}
                          <button
                            type="button"
                            onClick={() => toggleCell(emp.employeeId, day)}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-l-lg text-[11px] font-bold transition border border-r-0",
                              meta ? meta.color : "bg-gray-50 text-gray-300 border-gray-200",
                              "hover:border-gray-400 cursor-pointer"
                            )}
                            title={`${emp.firstName} ${emp.lastName} · ${months[currentMonth]} ${day} · Current: ${meta?.label || "none"} · Click to toggle`}
                          >
                            {meta ? meta.short : "?"}
                          </button>
                          {/* Menu trigger */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === key ? null : key); }}
                            className={cn(
                              "flex h-8 w-4 items-center justify-center rounded-r-lg text-[9px] border border-l-0 transition cursor-pointer",
                              meta ? meta.color : "bg-gray-50 text-gray-300 border-gray-200",
                              "hover:border-gray-400"
                            )}
                            title={`${emp.firstName} ${emp.lastName} · More options`}
                          >
                            <ChevronDown size={10} />
                          </button>

                          {cellHasOpenMenu && (
                            <div ref={menuRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 w-28 rounded-xl border border-gray-200 bg-white shadow-xl py-1">
                              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 border-b border-gray-100 mb-1 truncate text-center">
                                {emp.firstName} {emp.lastName} · {day} {months[currentMonth]}
                              </div>
                              {STATUS_LIST.map((s) => (
                                <button key={s.value} type="button"
                                  onClick={() => setStatus(emp.employeeId, day, s.value)}
                                  className={cn("flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium transition",
                                    s.value === status ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                                  )}
                                >
                                  <span className={cn("flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold", s.color)}>{s.short}</span>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </motion.div>
  );
}