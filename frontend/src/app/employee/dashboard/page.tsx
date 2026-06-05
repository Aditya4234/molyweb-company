"use client";

import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export default function EmployeeDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 lg:mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || user?.fullName}</h1>
        <p className="mt-1 text-sm text-gray-500">Employee Dashboard</p>
      </motion.div>
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-gray-700">This is your employee dashboard. More features coming soon.</p>
      </div>
    </div>
  );
}
