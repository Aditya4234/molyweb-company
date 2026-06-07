"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Shield, User,
} from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

function LoginForm() {
  const [role, setRole] = useState<"admin" | "employee">("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, googleLogin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const remembered = localStorage.getItem("molyweb_remembered_email");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password, role);
      if (rememberMe) {
        localStorage.setItem("molyweb_remembered_email", email);
      } else {
        localStorage.removeItem("molyweb_remembered_email");
      }
      router.push(role === "admin" ? "/admin/dashboard" : "/employee/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    setSubmitting(true);
    try {
      await googleLogin(credentialResponse.credential);
      router.push(role === "admin" ? "/admin/dashboard" : "/employee/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = role === "admin";
  const accentColor = isAdmin ? "blue" : "emerald";
  const accentGradient = isAdmin
    ? "from-blue-600 to-indigo-600"
    : "from-emerald-600 to-teal-600";
  const accentGradientLight = isAdmin
    ? "from-blue-50 to-indigo-50"
    : "from-emerald-50 to-teal-50";
  const accentRing = isAdmin ? "focus:border-blue-400 focus:ring-blue-100" : "focus:border-emerald-400 focus:ring-emerald-100";
  const accentShadow = isAdmin ? "shadow-blue-500/20" : "shadow-emerald-500/20";
  const accentShadowHover = isAdmin ? "hover:shadow-blue-500/30" : "hover:shadow-emerald-500/30";
  const accentHover = isAdmin ? "hover:from-blue-700 hover:to-indigo-700" : "hover:from-emerald-700 hover:to-teal-700";
  const checkColor = isAdmin ? "text-blue-600" : "text-emerald-600";
  const forgotColor = isAdmin ? "text-blue-600 hover:text-blue-700" : "text-emerald-600 hover:text-emerald-700";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F1F5F9] p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        <div className="rounded-3xl border border-white/40 bg-white/80 p-8 shadow-2xl shadow-blue-500/5 backdrop-blur-xl sm:p-10">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 text-center"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-blue-500/25">
              M
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Sign in to your MolyWeb account
            </p>
          </motion.div>

          {/* Role Tabs */}
          <div className="mb-8 grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              onClick={() => { setRole("admin"); setError(""); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center justify-center gap-2.5 rounded-2xl px-4 py-4 text-sm font-semibold transition-all ${
                isAdmin
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-200 hover:text-blue-600 hover:shadow-md hover:shadow-blue-500/5"
              }`}
            >
              <Shield size={20} />
              <span>Admin</span>
              {isAdmin && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white"
                >
                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                </motion.div>
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={() => { setRole("employee"); setError(""); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center justify-center gap-2.5 rounded-2xl px-4 py-4 text-sm font-semibold transition-all ${
                !isAdmin
                  ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-200 hover:text-emerald-600 hover:shadow-md hover:shadow-emerald-500/5"
              }`}
            >
              <User size={20} />
              <span>Employee</span>
              {!isAdmin && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {!isAdmin && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white"
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-600" />
                </motion.div>
              )}
            </motion.button>
          </div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={role}
              initial={{ opacity: 0, x: isAdmin ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isAdmin ? 12 : -12 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className={`w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 ${accentRing}`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className={`w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 ${accentRing}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <div className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
                    rememberMe
                      ? `border-transparent ${isAdmin ? "bg-blue-600" : "bg-emerald-600"} text-white`
                      : "border-gray-300 bg-white"
                  }`}>
                    {rememberMe && (
                      <motion.svg
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        viewBox="0 0 12 12"
                        className="h-3 w-3"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    )}
                  </div>
                  Remember me
                </button>
                <Link
                  href="/admin/forgot-password"
                  className={`text-sm font-medium transition-colors ${forgotColor}`}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={submitting ? {} : { scale: 1.02 }}
                whileTap={submitting ? {} : { scale: 0.98 }}
                className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${accentGradient} px-4 py-3 text-sm font-semibold text-white shadow-lg ${accentShadow} transition-all ${accentHover} ${accentShadowHover} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ArrowRight size={18} />
                )}
                {submitting ? "Signing in..." : `Sign in as ${isAdmin ? "Admin" : "Employee"}`}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          {/* Social Buttons */}
          <div className="space-y-3">
            {GOOGLE_CLIENT_ID ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google sign-in failed")}
                  size="large"
                  width="340"
                  shape="pill"
                  text="continue_with"
                  theme="outline"
                />
              </div>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {}}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </motion.button>
            )}

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {}}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="#2563EB" d="M11.4 24H0V12.6L5.7 7.2 11.4 24zM12.6 24H24V12.6L18.3 7.2 12.6 24zM12 13.2L5.7 0h12.6L12 13.2z" />
              </svg>
              Continue with Microsoft
            </motion.button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} MolyWeb. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  if (!GOOGLE_CLIENT_ID) return <LoginForm />;
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginForm />
    </GoogleOAuthProvider>
  );
}
