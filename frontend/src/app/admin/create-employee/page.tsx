"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, User, Briefcase, Banknote, FileText, Shield, CheckCircle, Copy, Eye, EyeOff, Check,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { getDepartments, createEmployee } from "@/lib/api";
import type { EmploymentType, Gender, Department } from "@/types";

const tabs = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "salary", label: "Salary", icon: Banknote },
  { id: "bank", label: "Bank Details", icon: FileText },
  { id: "documents", label: "Documents", icon: Shield },
];

export default function RegisterEmployeePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("personal");
  const [form, setForm] = useState({
    employeeId: `EMP-${String(Date.now()).slice(-6)}`,
    firstName: "", lastName: "", email: "", phone: "", otherPhone: "", gender: "male" as Gender,
    dob: "", address: "", city: "", state: "", pincode: "",
    departmentId: "", designation: "", employmentType: "full-time" as EmploymentType,
    joiningDate: "", workLocation: "", reportingManager: "",
    basic: "", hra: "", da: "", travelAllowance: "", medicalAllowance: "", specialAllowance: "",
    accountNumber: "", ifsc: "", bankName: "", branch: "",
    pan: "", aadhar: "", uan: "",
    createLogin: false, password: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {});
  }, []);

  const generatePassword = () => {
    const pw = Array.from({ length: 3 }, () => Math.random().toString(36).slice(2, 6)).join("-");
    setForm((prev) => ({ ...prev, password: pw }));
  };

  const update = (field: string, value: string | boolean) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const salary = [form.basic, form.hra, form.da, form.travelAllowance, form.medicalAllowance, form.specialAllowance]
        .reduce((s, v) => s + Number(v || 0), 0);
      const res = await createEmployee({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        department: dept?.name || form.departmentId,
        position: form.designation,
        salary,
        status: "active",
        joinDate: form.joiningDate,
        address: [form.address, form.city, form.state, form.pincode].filter(Boolean).join(", "),
        bankAccount: form.accountNumber,
        ifscCode: form.ifsc,
        createLogin: form.createLogin,
        password: form.password,
      });
      if (res?.generatedPassword) setGeneratedPassword(res.generatedPassword);
      setSubmitted(true);
      setTimeout(() => router.push("/admin/employees"), 3000);
    } catch {
      alert("Failed to create employee. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="p-4 lg:p-8 min-w-0 flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Employee Registered!</h2>
          <p className="mt-1 text-sm text-gray-500">Redirecting to employee list...</p>
          {form.createLogin && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">
              <p className="text-sm font-medium text-emerald-800">Login Credentials</p>
              <p className="mt-2 text-xs text-emerald-700">Email: <span className="font-mono font-semibold">{form.email}</span></p>
              <p className="text-xs text-emerald-700">
                Password:{" "}
                <span className="font-mono font-semibold">{generatedPassword || form.password}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword || form.password);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 ml-2 text-emerald-700 hover:text-emerald-900 transition"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span className="text-xs">{copied ? "Copied!" : "Copy"}</span>
                </button>
              </p>
              <p className="mt-2 text-xs text-emerald-600">Please share these credentials with the employee.</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const inputClass = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm placeholder:text-gray-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition";
  const labelClass = "text-sm font-medium text-gray-700";
  const dept = departments.find((d) => d.id === form.departmentId);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6 lg:mb-8">
        <Link href="/admin/employees" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-4">
          <ArrowLeft size={16} /> Back to Employees
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Register New Employee</h1>
        <p className="mt-1 text-sm text-gray-500">Add a new employee to the organization</p>
      </motion.div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition whitespace-nowrap",
                isActive ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700",
              )}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-sm">
          {/* Personal Information */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                <p className="text-sm text-gray-500">Basic details about the employee</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Employee ID *</label>
                  <input required className={inputClass} placeholder="EMP-001" value={form.employeeId} onChange={(e) => update("employeeId", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>First Name *</label>
                  <input required className={inputClass} placeholder="Enter first name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Last Name *</label>
                  <input required className={inputClass} placeholder="Enter last name" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Email *</label>
                  <input required type="email" className={inputClass} placeholder="email@company.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Phone *</label>
                  <input required className={inputClass} placeholder="+91-9876543210" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Other Phone</label>
                  <input className={inputClass} placeholder="Alternate phone" value={form.otherPhone} onChange={(e) => update("otherPhone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Gender</label>
                  <select className={inputClass} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Date of Birth *</label>
                  <input required type="date" className={inputClass} value={form.dob} onChange={(e) => update("dob", e.target.value)} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 lg:col-span-2 space-y-1.5">
                    <label className={labelClass}>Address</label>
                    <input className={inputClass} placeholder="Street address" value={form.address} onChange={(e) => update("address", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>City</label>
                    <input className={inputClass} placeholder="City" value={form.city} onChange={(e) => update("city", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>State</label>
                    <input className={inputClass} placeholder="State" value={form.state} onChange={(e) => update("state", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Pincode</label>
                    <input className={inputClass} placeholder="Pincode" value={form.pincode} onChange={(e) => update("pincode", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <input type="checkbox" id="createLogin" checked={form.createLogin} onChange={(e) => update("createLogin", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                  <label htmlFor="createLogin" className="text-sm font-medium text-gray-900">Create Login Account for this Employee</label>
                </div>
                {form.createLogin && (
                  <div className="space-y-1.5 max-w-sm">
                    <label className={labelClass}>Login Password</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? "text" : "password"}
                          minLength={6}
                          className={inputClass + " pr-10"}
                          placeholder="Leave blank to auto-generate"
                          value={form.password}
                          onChange={(e) => update("password", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button type="button" onClick={() => { generatePassword(); setShowPassword(true); }} className="shrink-0 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                        Generate
                      </button>
                    </div>
                    {form.password && (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                        <span className="text-xs font-mono font-semibold text-amber-800 break-all">{form.password}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(form.password);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="shrink-0 text-amber-600 hover:text-amber-800 transition"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">The employee can log in using their Email ID and this password. Click Generate to create a strong password.</p>
                  </div>
                )}
              </div>


            </div>
          )}

          {/* Employment Details */}
          {activeTab === "employment" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Employment Details</h3>
                <p className="text-sm text-gray-500">Job information and work details</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Department *</label>
                  <select required className={inputClass} value={form.departmentId} onChange={(e) => update("departmentId", e.target.value)}>
                    <option value="">Select department</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Designation *</label>
                  <input required className={inputClass} placeholder="e.g. Senior Developer" value={form.designation} onChange={(e) => update("designation", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Employment Type *</label>
                  <select required className={inputClass} value={form.employmentType} onChange={(e) => update("employmentType", e.target.value as EmploymentType)}>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                    <option value="probation">Probation</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Joining Date *</label>
                  <input required type="date" className={inputClass} value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Work Location</label>
                  <input className={inputClass} placeholder="Office location" value={form.workLocation} onChange={(e) => update("workLocation", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Reporting Manager</label>
                  <input className={inputClass} placeholder="Manager name" value={form.reportingManager} onChange={(e) => update("reportingManager", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Salary Structure */}
          {activeTab === "salary" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Salary Structure</h3>
                <p className="text-sm text-gray-500">Compensation and allowance details</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Basic Salary *</label>
                  <input required type="number" className={inputClass} placeholder="0" value={form.basic} onChange={(e) => update("basic", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>HRA</label>
                  <input type="number" className={inputClass} placeholder="0" value={form.hra} onChange={(e) => update("hra", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Dearness Allowance</label>
                  <input type="number" className={inputClass} placeholder="0" value={form.da} onChange={(e) => update("da", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Travel Allowance</label>
                  <input type="number" className={inputClass} placeholder="0" value={form.travelAllowance} onChange={(e) => update("travelAllowance", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Medical Allowance</label>
                  <input type="number" className={inputClass} placeholder="0" value={form.medicalAllowance} onChange={(e) => update("medicalAllowance", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Special Allowance</label>
                  <input type="number" className={inputClass} placeholder="0" value={form.specialAllowance} onChange={(e) => update("specialAllowance", e.target.value)} />
                </div>
              </div>
              {form.basic && (
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-800">Salary Summary</p>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-blue-600">Total Allowances:</span> <span className="font-semibold">₹{(Number(form.hra || 0) + Number(form.da || 0) + Number(form.travelAllowance || 0) + Number(form.medicalAllowance || 0) + Number(form.specialAllowance || 0)).toLocaleString()}</span></div>
                    <div><span className="text-blue-600">Gross:</span> <span className="font-semibold">₹{(Number(form.basic) + Number(form.hra || 0) + Number(form.da || 0) + Number(form.travelAllowance || 0) + Number(form.medicalAllowance || 0) + Number(form.specialAllowance || 0)).toLocaleString()}</span></div>
                    <div><span className="text-blue-600">PF (12%):</span> <span className="font-semibold">₹{Math.round(Number(form.basic) * 0.12).toLocaleString()}</span></div>
                    <div><span className="text-blue-600">Estimated Net:</span> <span className="font-semibold">₹{Math.round((Number(form.basic) + Number(form.hra || 0) + Number(form.da || 0) + Number(form.travelAllowance || 0) + Number(form.medicalAllowance || 0) + Number(form.specialAllowance || 0)) * 0.82).toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bank Details */}
          {activeTab === "bank" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Bank Details</h3>
                <p className="text-sm text-gray-500">Salary account information</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Account Number *</label>
                  <input required className={inputClass} placeholder="Enter account number" value={form.accountNumber} onChange={(e) => update("accountNumber", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>IFSC Code *</label>
                  <input required className={inputClass} placeholder="SBIN0001234" value={form.ifsc} onChange={(e) => update("ifsc", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Bank Name *</label>
                  <input required className={inputClass} placeholder="Bank name" value={form.bankName} onChange={(e) => update("bankName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Branch</label>
                  <input className={inputClass} placeholder="Branch name" value={form.branch} onChange={(e) => update("branch", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Documents & IDs</h3>
                <p className="text-sm text-gray-500">Government IDs and statutory information</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>PAN Card *</label>
                  <input required className={inputClass} placeholder="ABCDE1234F" value={form.pan} onChange={(e) => update("pan", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Aadhar Number *</label>
                  <input required className={inputClass} placeholder="1234-5678-9012" value={form.aadhar} onChange={(e) => update("aadhar", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>UAN (EPFO)</label>
                  <input className={inputClass} placeholder="IN123456789012" value={form.uan} onChange={(e) => update("uan", e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            {tabs.map((tab, i) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={cn("h-2 w-2 rounded-full transition", activeTab === tab.id ? "bg-blue-600 w-6" : "bg-gray-300")}
              />
            ))}
          </div>
          <div className="flex gap-3">
            {activeTab !== "personal" && (
              <button type="button" onClick={() => setActiveTab(tabs[tabs.findIndex((t) => t.id === activeTab) - 1].id)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Previous
              </button>
            )}
            {activeTab !== "documents" ? (
              <button type="button" onClick={() => setActiveTab(tabs[tabs.findIndex((t) => t.id === activeTab) + 1].id)}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                Next
              </button>
            ) : (
              <button type="submit"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition"
              >
                <Save size={18} /> Register Employee
              </button>
            )}
          </div>
        </div>
      </form>
    </motion.div>
  );
}
