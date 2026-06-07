"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User,
} from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

function LoginForm() {
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
      await login(email, password, "employee");
      if (rememberMe) localStorage.setItem("molyweb_remembered_email", email);
      else localStorage.removeItem("molyweb_remembered_email");
      router.push("/employee/dashboard");
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
      router.push("/employee/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F1F5F9] p-4">
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-teal-100/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[480px]"
      >
        <motion.div
          variants={stagger}
          animate="animate"
          className="overflow-hidden rounded-[32px] border border-white/50 bg-white/70 p-8 shadow-[0_2px_80px_-12px_rgba(16,185,129,0.12),0_8px_32px_-4px_rgba(0,0,0,0.04)] backdrop-blur-2xl sm:p-10"
        >
          <motion.div
            variants={fadeUp}
            transition={{ delay: 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 text-center"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-bold text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <User size={28} />
            </div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[#0F172A]">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Sign in to your MolyWeb Employee account
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              className="mb-6 overflow-hidden"
            >
              <div className="rounded-2xl border border-red-100 bg-red-50/80 px-5 py-3.5 backdrop-blur-sm">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={fadeUp} transition={{ delay: 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <label className="mb-2 block text-[13px] font-semibold text-gray-700">
                Email address
              </label>
              <div className="relative group">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-emerald-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@molyweb.com"
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-white/80 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 group-hover:border-gray-300"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ delay: 0.24, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <label className="mb-2 block text-[13px] font-semibold text-gray-700">
                Password
              </label>
              <div className="relative group">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-emerald-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-white/80 py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 group-hover:border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
              >
                <div className={`flex h-[18px] w-[18px] items-center justify-center rounded-md border-2 transition-all ${
                  rememberMe ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 bg-white"
                }`}>
                  {rememberMe && (
                    <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} viewBox="0 0 12 12" className="h-2.5 w-2.5">
                      <path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  )}
                </div>
                <span className="text-[13px] font-medium">Remember me</span>
              </button>
              <Link href="/admin/forgot-password" className="text-[13px] font-medium text-emerald-600 transition-colors hover:text-emerald-700">
                Forgot password?
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ delay: 0.36, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={submitting ? {} : { scale: 1.015 }}
                whileTap={submitting ? {} : { scale: 0.985 }}
                className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/0 transition-all duration-300 group-hover:bg-white/10" />
                {submitting ? (
                  <Loader2 size={19} className="animate-spin" />
                ) : (
                  <ArrowRight size={19} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                )}
                <span className="relative z-10">{submitting ? "Signing in..." : "Sign in"}</span>
              </motion.button>
            </motion.div>
          </form>

          <motion.div variants={fadeUp} transition={{ delay: 0.42, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">Or continue with</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </motion.div>

          <motion.div variants={fadeUp} transition={{ delay: 0.48, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="space-y-3.5">
            {GOOGLE_CLIENT_ID ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google sign-in failed")}
                  size="large"
                  width="100%"
                  shape="pill"
                  text="continue_with"
                  theme="outline"
                />
              </div>
            ) : (
              <motion.button type="button" whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={() => {}}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </motion.button>
            )}

            <motion.button type="button" whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={() => {}}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
                <path d="M11.4 24H0V12.6l5.7-5.4L11.4 24zM12.6 24H24V12.6l-5.7-5.4L12.6 24zM12 13.2 5.7 0h12.6L12 13.2z" fill="#2563EB" />
              </svg>
              Continue with Microsoft
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }} className="mt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} MolyWeb. All rights reserved.
        </motion.p>
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
