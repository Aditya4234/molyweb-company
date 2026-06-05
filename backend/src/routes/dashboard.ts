import { Router, Request, Response } from "express";
import Invoice from "../models/Invoice";
import Activity from "../models/Activity";
import Client from "../models/Client";
import Employee from "../models/Employee";
import Payment from "../models/Payment";

const router = Router();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pctChange(current: number, previous: number): { change: string; trend: "up" | "down" } {
  if (previous === 0) return { change: current > 0 ? "+100%" : "0%", trend: "up" };
  const pct = ((current - previous) / previous) * 100;
  return {
    change: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
    trend: pct >= 0 ? "up" : "down",
  };
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const [allInvoices, recentActivity, clients, employees, payments] = await Promise.all([
      Invoice.find().sort({ createdAt: -1 }),
      Activity.find().sort({ createdAt: -1 }).limit(7),
      Client.find({ status: "active" }),
      Employee.find({ status: "active" }),
      Payment.find({ status: "completed" }),
    ]);

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const paidInvoices = allInvoices.filter((i) => i.status === "paid");
    const totalRevenue = paidInvoices.reduce((s, i) => s + i.amount, 0);
    const paidCount = paidInvoices.length;
    const pendingAmt = allInvoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);
    const overdueAmt = allInvoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

    const revenueThisMonth = paidInvoices
      .filter((i) => {
        const d = new Date(i.invoiceDate || i.createdAt);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((s, i) => s + i.amount, 0);
    const revenueLastMonth = paidInvoices
      .filter((i) => {
        const d = new Date(i.invoiceDate || i.createdAt);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      })
      .reduce((s, i) => s + i.amount, 0);

    const paidThisMonth = allInvoices.filter((i) => {
      const d = new Date(i.createdAt);
      return i.status === "paid" && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;
    const paidLastMonth = allInvoices.filter((i) => {
      const d = new Date(i.createdAt);
      return i.status === "paid" && d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    }).length;

    const revChange = pctChange(revenueThisMonth, revenueLastMonth);
    const paidChange = pctChange(paidThisMonth, paidLastMonth);

    const monthlyMap: Record<string, { revenue: number; expenses: number; count: number }> = {};
    for (const inv of allInvoices) {
      const d = new Date(inv.invoiceDate || inv.createdAt);
      const key = MONTHS[d.getMonth()];
      if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, expenses: 0, count: 0 };
      monthlyMap[key].count += 1;
      if (inv.status === "paid") {
        monthlyMap[key].revenue += inv.amount;
        monthlyMap[key].expenses += Math.round(inv.amount * 0.35);
      }
    }

    const monthlyRevenue = MONTHS.slice(0, thisMonth + 1).map((month) => {
      const data = monthlyMap[month] || { revenue: 0, expenses: 0, count: 0 };
      return { month, revenue: data.revenue, expenses: data.expenses, profit: data.revenue - data.expenses };
    });

    const invoiceGrowth = MONTHS.slice(0, thisMonth + 1).map((month, idx) => {
      const count = monthlyMap[month]?.count || 0;
      const prevMonth = idx > 0 ? MONTHS[idx - 1] : null;
      const prevCount = prevMonth ? (monthlyMap[prevMonth]?.count || 0) : 0;
      const growth = prevCount > 0 ? Math.round(((count - prevCount) / prevCount) * 100) : count > 0 ? 100 : 0;
      return { month, invoices: count, growth };
    });

    const totalAmount = allInvoices.reduce((s, i) => s + i.amount, 0);
    const avgInvoiceValue = allInvoices.length > 0 ? totalAmount / allInvoices.length : 0;
    const collectionRate = totalAmount > 0 ? (totalRevenue / totalAmount) * 100 : 0;
    const onTimeCount = paidInvoices.filter((i) => new Date(i.dueDate) >= new Date(i.invoiceDate || i.createdAt)).length;
    const onTimeRate = paidCount > 0 ? (onTimeCount / paidCount) * 100 : 0;

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    res.json({
      stats: [
        { label: "Total Revenue", value: `$${totalRevenue >= 1000 ? (totalRevenue / 1000).toFixed(1) + "K" : totalRevenue.toFixed(0)}`, change: revChange.change, trend: revChange.trend, icon: "DollarSign", prefix: "", suffix: "" },
        { label: "Paid Invoices", value: String(paidCount), change: paidChange.change, trend: paidChange.trend, icon: "CheckCircle", prefix: "", suffix: "" },
        { label: "Pending Payments", value: `$${pendingAmt >= 1000 ? (pendingAmt / 1000).toFixed(1) + "K" : pendingAmt.toFixed(0)}`, change: pendingAmt > 0 ? `${allInvoices.filter((i) => i.status === "pending").length} invoices` : "0", trend: "down", icon: "Clock", prefix: "", suffix: "" },
        { label: "Overdue Invoices", value: `$${overdueAmt >= 1000 ? (overdueAmt / 1000).toFixed(1) + "K" : overdueAmt.toFixed(0)}`, change: `${allInvoices.filter((i) => i.status === "overdue").length} invoices`, trend: overdueAmt > 0 ? "down" : "up", icon: "AlertTriangle", prefix: "", suffix: "" },
        { label: "Active Clients", value: String(clients.length), change: `${clients.length} active`, trend: "up", icon: "Users", prefix: "", suffix: "" },
        { label: "Monthly Profit", value: `$${monthlyRevenue.length ? (monthlyRevenue[monthlyRevenue.length - 1].profit / 1000).toFixed(1) + "K" : "0"}`, change: revChange.change, trend: revChange.trend, icon: "TrendingUp", prefix: "", suffix: "" },
      ],
      invoices: allInvoices.slice(0, 5).map((inv) => ({
        id: String(inv._id),
        clientName: inv.clientName,
        email: inv.email,
        amount: inv.amount,
        dueDate: inv.dueDate,
        status: inv.status,
        createdAt: String(inv.createdAt),
        items: inv.items ? inv.items.length : 0,
      })),
      upcomingDues: allInvoices
        .filter((inv) => (inv.status === "pending" || inv.status === "overdue") && new Date(inv.dueDate) <= sevenDaysFromNow)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 4)
        .map((inv) => ({
          id: String(inv._id),
          clientName: inv.clientName,
          amount: inv.amount,
          dueDate: inv.dueDate,
          status: inv.status,
        })),
      recentActivity: recentActivity.map((a) => ({
        id: String(a._id),
        type: a.type,
        message: a.message,
        timestamp: a.createdAt ? a.createdAt.toISOString() : a.timestamp,
        user: a.user,
      })),
      monthlyRevenue,
      invoiceGrowth,
      paymentStatus: [
        { label: "Paid", value: paidCount, color: "#10b981", amount: totalRevenue },
        { label: "Pending", value: allInvoices.filter((i) => i.status === "pending").length, color: "#f59e0b", amount: pendingAmt },
        { label: "Overdue", value: allInvoices.filter((i) => i.status === "overdue").length, color: "#ef4444", amount: overdueAmt },
        { label: "Draft", value: allInvoices.filter((i) => i.status === "draft").length, color: "#9ca3af", amount: allInvoices.filter((i) => i.status === "draft").reduce((s, i) => s + i.amount, 0) },
      ],
      performanceSummary: [
        { label: "Avg. Invoice Value", value: `$${avgInvoiceValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: `${allInvoices.length} total`, color: "text-blue-600" },
        { label: "Collection Rate", value: `${collectionRate.toFixed(1)}%`, change: `$${totalRevenue.toLocaleString()} collected`, color: "text-emerald-600" },
        { label: "On-time Payments", value: `${onTimeRate.toFixed(1)}%`, change: `${onTimeCount} of ${paidCount}`, color: "text-emerald-600" },
        { label: "Active Employees", value: String(employees.length), change: `${payments.length} payments`, color: "text-purple-600" },
      ],
    });
  } catch (err) {
    console.error("[Dashboard] Error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
