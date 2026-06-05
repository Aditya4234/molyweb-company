"use client";

import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export default function EmployeeProfile() {
  const { user } = useAuth();

  return (
    <div className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 lg:mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      </motion.div>
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
            <p className="text-gray-900 text-lg">{user?.name || user?.fullName}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
            <p className="text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</label>
            <p className="text-gray-900 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
