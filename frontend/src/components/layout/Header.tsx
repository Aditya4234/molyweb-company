"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, Sun, Moon, Menu, ChevronDown, User, Settings, LogOut, HelpCircle,
  CheckCircle, AlertTriangle, Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getNotifications, markAllNotificationsRead, globalSearch } from "@/lib/api";
import type { Notification } from "@/types";

interface HeaderProps {
  onMenuClick: () => void;
}

const typeIcons = { success: CheckCircle, warning: AlertTriangle, error: AlertTriangle, info: Info };
const typeStyles = {
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  error: "bg-rose-50 text-rose-600",
  info: "bg-blue-50 text-blue-600",
};

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/invoices": "Invoices",
  "/clients": "Clients",
  "/payments": "Payments",
  "/billing": "Billing",
  "/employees": "Employees",
  "/departments": "Departments",
  "/attendance": "Attendance",
  "/leave": "Leave",
  "/payroll": "Payroll",
  "/reports": "Reports",
  "/settings": "Settings",
  "/help": "Help",
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [dark, setDark] = useLocalStorage("theme", "light");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ invoices: any[]; clients: any[]; employees: any[] } | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const pageTitle = pageTitles[pathname] || pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Dashboard";

  const unreadCount = notifications.filter((n) => !n.read).length;
  const initials = user?.name?.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2) || "U";

  useEffect(() => {
    getNotifications().then(setNotifications).catch(() => setNotifications([]));
  }, [notifOpen]);

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      globalSearch(debouncedSearch).then(setSearchResults).catch(() => setSearchResults(null));
    } else {
      setSearchResults(null);
    }
  }, [debouncedSearch]);

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const allResults = searchResults
    ? [...searchResults.invoices, ...searchResults.clients, ...searchResults.employees]
    : [];

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button onClick={onMenuClick} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100">
              <Menu size={20} />
            </button>
          )}
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <span className="text-sm text-gray-400">Pages</span>
            <span className="text-sm text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-900 capitalize">{pageTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-48 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:w-64 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 lg:w-56"
            />
            {debouncedSearch.length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-gray-200 bg-white py-2 shadow-lg max-h-64 overflow-y-auto">
                {allResults.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-400">No results for &quot;{debouncedSearch}&quot;</p>
                ) : (
                  allResults.map((r) => (
                    <button key={r.id + r.type} onClick={() => { router.push(r.href); setSearchQuery(""); }} className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                      {r.label}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button onClick={() => setDark(dark === "dark" ? "light" : "dark")} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100">
            {dark === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">{unreadCount}</span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -5 }} className="absolute right-0 top-full z-50 mt-2 w-[320px] sm:w-[360px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700">Mark all read</button>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-gray-400">No notifications</p>
                    ) : notifications.map((notif) => {
                      const Icon = typeIcons[notif.type];
                      return (
                        <div key={notif.id} className={cn("flex items-start gap-3 px-4 py-3 transition hover:bg-gray-50", !notif.read && "bg-blue-50/50")}>
                          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", typeStyles[notif.type])}><Icon size={14} /></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                            <p className="text-xs text-gray-500">{notif.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-gray-100">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-100" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">{initials}</div>
              )}
              <ChevronDown size={14} className="hidden text-gray-400 lg:block" />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -5 }} className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{user?.name || "User"}</p>
                    <p className="text-xs text-gray-500">{user?.email || ""}</p>
                  </div>
                  <div className="p-1">
                    {[{ label: "Settings", icon: Settings, href: "/settings" }, { label: "Help", icon: HelpCircle, href: "/help" }].map((item) => (
                      <a key={item.label} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50">
                        <item.icon size={16} className="text-gray-400" />{item.label}
                      </a>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 p-1">
                    <button onClick={() => logout()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-50">
                      <LogOut size={16} />Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
