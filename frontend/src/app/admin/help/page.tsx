"use client";

import { motion } from "framer-motion";
import { BookOpen, FileText, Users, DollarSign, Clock, Shield } from "lucide-react";

const guides = [
  { icon: FileText, title: "Creating Invoices", desc: "Learn how to create and manage GST-compliant invoices with line items, taxes, and PDF generation." },
  { icon: Users, title: "Managing Employees", desc: "Register new employees, manage their departments, track attendance, and process payroll." },
  { icon: DollarSign, title: "Payments & Billing", desc: "Track payments, manage billing plans, and generate payment reports." },
  { icon: Clock, title: "Leave & Attendance", desc: "Configure attendance tracking, manage leave requests, and view attendance reports." },
  { icon: Shield, title: "User Roles & Permissions", desc: "Understand user roles, access controls, and security settings." },
  { icon: BookOpen, title: "Reports & Analytics", desc: "Generate revenue reports, client insights, employee analytics, and export data." },
];

export default function HelpPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="mt-1 text-sm text-gray-500">Guides and documentation for MolyWeb features</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Need More Help?</h2>
        <p className="mt-1 text-sm text-gray-500">Contact our support team for assistance.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">Email</p>
            <p className="text-sm text-blue-600">support@molyweb.com</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">Phone</p>
            <p className="text-sm text-gray-600">+1 (555) 000-0000</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
