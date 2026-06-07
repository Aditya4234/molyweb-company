"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserCog, Users, ArrowRight, Building2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[520px]"
      >
        <div className="rounded-3xl border border-slate-200/60 bg-white/90 p-8 shadow-2xl shadow-blue-500/10 backdrop-blur-xl sm:p-10">
          {/* Logo */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-3xl font-bold text-white shadow-lg shadow-blue-500/25"
            >
              <Building2 size={36} />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              MolyWeb
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Enterprise Invoice & Billing Management
            </p>
          </div>

          <div className="space-y-4">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => router.push("/admin/login")}
              className="flex w-full items-center justify-between rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 text-left transition-all hover:from-blue-100 hover:to-indigo-100 hover:shadow-lg hover:shadow-blue-500/10 group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
                  <UserCog size={28} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Admin Login</h2>
                  <p className="text-sm text-gray-500">Manage invoices, clients & employees</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-blue-400 transition-transform group-hover:translate-x-1" />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => router.push("/employee/login")}
              className="flex w-full items-center justify-between rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 text-left transition-all hover:from-emerald-100 hover:to-teal-100 hover:shadow-lg hover:shadow-emerald-500/10 group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md">
                  <Users size={28} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Employee Login</h2>
                  <p className="text-sm text-gray-500">View attendance, leave & payslips</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-emerald-400 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} MolyWeb. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
