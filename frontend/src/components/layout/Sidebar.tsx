"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Users,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  HelpCircle,
  ChevronDown,
  UserPlus,
  Building2,
  CalendarDays,
  CalendarCheck,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  children?: { title: string; href: string }[];
}



interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const adminMenuItems: MenuItem[] = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    {
      title: "Invoices",
      icon: FileText,
      href: "/admin/invoices",
      badge: 4,
      children: [
        { title: "All Invoices", href: "/admin/invoices" },
        { title: "Create Invoice", href: "/admin/invoices/create" },
      ],
    },
    { title: "Clients", icon: Users, href: "/admin/clients", badge: 12 },
    {
      title: "Employees",
      icon: UserPlus,
      href: "/admin/employees",
      children: [
        { title: "All Employees", href: "/admin/employees" },
        { title: "Register", href: "/admin/create-employee" },
      ],
    },
    { title: "Departments", icon: Building2, href: "/admin/departments" },
    { title: "Attendance", icon: CalendarDays, href: "/admin/attendance" },
    { title: "Leave", icon: CalendarCheck, href: "/admin/leave" },
    { title: "Payroll", icon: DollarSign, href: "/admin/payroll" },
    { title: "Billing", icon: Receipt, href: "/admin/billing" },
    { title: "Payments", icon: CreditCard, href: "/admin/payments" },
    {
      title: "Reports",
      icon: BarChart3,
      href: "/admin/reports",
      children: [
        { title: "Analytics", href: "/admin/reports" },
      ],
    },
  ];

  const employeeMenuItems: MenuItem[] = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/employee/dashboard" },
    { title: "My Profile", icon: Users, href: "/employee/profile" },
  ];

  const menuItems = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" ? adminMenuItems : employeeMenuItems;

  const bottomItems: MenuItem[] = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" 
    ? [
        { title: "Settings", icon: Settings, href: "/admin/settings" },
        { title: "Help", icon: HelpCircle, href: "/admin/help" },
      ]
    : [
        { title: "Help", icon: HelpCircle, href: "/employee/help" },
      ];

  const handleLogout = async () => {
    await logout();
  };

  const toggleSubmenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  const isActive = (href: string) => {
    if (href === "/admin/dashboard" || href === "/employee/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-100 px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <Image
            src="/image/logo.png"
            alt="MolyWeb"
            width={36}
            height={36}
            className="shrink-0 rounded-lg"
            loading="eager"
          />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-base font-bold text-gray-900">MolyWeb</h1>
                <p className="text-[10px] text-gray-400">Invoice Software</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={onToggle}
          className="ml-auto hidden rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 lg:block"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className={cn("mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400",
          collapsed && "sr-only"
        )}>
          Main Menu
        </p>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const expanded = expandedMenus.includes(item.title);

            return (
              <div key={item.title}>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (hasChildren && !collapsed) {
                      toggleSubmenu(item.title);
                    }
                  }}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-600",
                  )}
                >
                  <Icon size={20} className="shrink-0" />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 truncate"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!collapsed && item.badge && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                      {item.badge}
                    </span>
                  )}
                  {!collapsed && hasChildren && (
                    <ChevronDown
                      size={14}
                      className={cn(
                        "transition-transform",
                        expanded && "rotate-180",
                      )}
                    />
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Submenu */}
                {hasChildren && !collapsed && (
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-9 mt-1 space-y-1 border-l border-gray-200 pl-3">
                          {item.children!.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "block rounded-lg px-3 py-2 text-sm transition",
                                pathname === child.href
                                  ? "bg-blue-50 font-medium text-blue-600"
                                  : "text-gray-500 hover:text-gray-700",
                              )}
                            >
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-3">
        <nav className="space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                )}
              >
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50">
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </nav>
      </div>
    </aside>
  );
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-full lg:hidden"
            >
              <div className="relative">
                <button
                  onClick={onMobileClose}
                  className="absolute right-2 top-2 z-50 rounded-lg bg-white p-2 shadow-lg"
                >
                  <X size={20} />
                </button>
                <SidebarContent collapsed={false} onToggle={() => {}} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
