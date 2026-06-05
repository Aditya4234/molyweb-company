"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Building2, Users, Briefcase, Search, Edit, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { getDepartments, getAllEmployees, createDepartment, updateDepartment, deleteDepartment } from "@/lib/api";
import type { Department, Employee } from "@/types";

export default function DepartmentsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const [form, setForm] = useState({ name: "", head: "", budget: "" });
  const [editDept, setEditDept] = useState<Department | null>(null);

  const loadDepartments = () => {
    getDepartments().then((res) => {
      setDepartments(res.map((d: any) => ({ ...d, headName: d.head, createdAt: d.createdAt || "" })));
    }).catch(() => showToast("Failed to load departments"));
  };

  useEffect(() => {
    loadDepartments();
    getAllEmployees().then((res) => {
      setEmployees(res.map((b: any) => ({
        id: b.id,
        employeeId: b.id.toUpperCase(),
        firstName: b.firstName,
        lastName: b.lastName,
        departmentId: b.departmentId || b.department,
        status: b.status,
        designation: b.position,
      } as Employee)));
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      const headEmp = employees.find((e) => e.id === form.head);
      const payload = {
        name: form.name,
        head: headEmp ? `${headEmp.firstName} ${headEmp.lastName}` : form.head,
        budget: parseFloat(form.budget) || 0,
      };
      if (editDept) {
        await updateDepartment(editDept.id, payload);
        showToast("Department updated");
      } else {
        await createDepartment(payload);
        showToast("Department added");
      }
      setShowAdd(false);
      setEditDept(null);
      setForm({ name: "", head: "", budget: "" });
      loadDepartments();
    } catch {
      showToast("Failed to save department");
    }
  };

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.headName && d.headName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalBudget = departments.reduce((s, d) => s + d.budget, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="mt-1 text-sm text-gray-500">Manage organizational departments and teams</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} /> Add Department
        </button>
      </motion.div>

      <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 lg:mb-8">
        {[
          { label: "Total Departments", value: String(departments.length), icon: Building2, color: "text-blue-600 bg-blue-50" },
          { label: "Total Employees", value: String(employees.length), icon: Users, color: "text-emerald-600 bg-emerald-50" },
          { label: "Avg Team Size", value: String(Math.round(employees.length / departments.length)), icon: Briefcase, color: "text-purple-600 bg-purple-50" },
          { label: "Annual Budget", value: `₹${(totalBudget / 100000).toFixed(1)}L`, icon: Briefcase, color: "text-amber-600 bg-amber-50" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg", stat.color)}><stat.icon size={20} /></div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mb-4 lg:mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search departments..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((dept, i) => {
          // Adjust logic here since department matching might be by name in backend
          const deptEmployees = employees.filter((e) => e.departmentId === dept.id || (e as any).department === dept.name);
          const empCount = deptEmployees.length;
          return (
            <motion.div key={dept.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                  <Building2 size={22} />
                </div>
                <button onClick={() => { setEditDept(dept); setForm({ name: dept.name, head: "", budget: String(dept.budget) }); setShowAdd(true); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition">
                  <Edit size={14} />
                </button>
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900">{dept.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Head: {dept.headName || "—"}</p>
              <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Users size={14} />
                  <span>{empCount} employees</span>
                </div>
                <span className="text-xs font-medium text-gray-400">₹{(dept.budget / 100000).toFixed(1)}L/yr</span>
              </div>
              {deptEmployees.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {deptEmployees.slice(0, 5).map((e) => (
                    <div key={e.id} className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-[10px] font-bold text-white ring-2 ring-white"
                      title={`${e.firstName} ${e.lastName}`}
                    >
                      {e.firstName[0]}{e.lastName[0]}
                    </div>
                  ))}
                  {empCount > 5 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-500 ring-2 ring-white">
                      +{empCount - 5}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditDept(null); }} title={editDept ? "Edit Department" : "Add New Department"} size="md">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Department Name</label>
            <input type="text" placeholder="Enter department name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Department Head</label>
            <select value={form.head} onChange={(e) => setForm((p) => ({ ...p, head: e.target.value }))} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
              <option value="">Select head</option>
              {employees.filter((e) => e.status === "active").map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} - {e.designation}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Annual Budget (₹)</label>
            <input type="number" placeholder="0" value={form.budget} onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            {editDept && (
              <button onClick={async () => {
                if (!confirm("Delete this department?")) return;
                try {
                  await deleteDepartment(editDept.id);
                  showToast("Department deleted");
                  setShowAdd(false);
                  setEditDept(null);
                  loadDepartments();
                } catch { showToast("Failed to delete"); }
              }} className="mr-auto rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition">Delete</button>
            )}
            <button onClick={() => { setShowAdd(false); setEditDept(null); }} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleSave} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">Save Department</button>
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
