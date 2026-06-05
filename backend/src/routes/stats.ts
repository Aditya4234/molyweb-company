import { Router, Request, Response } from "express";
import Invoice from "../models/Invoice";
import Client from "../models/Client";
import Employee from "../models/Employee";
import Department from "../models/Department";
import Payroll from "../models/Payroll";
const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const [allInvoices, allClients] = await Promise.all([
      Invoice.find(),
      Client.find({ status: "active" }),
    ]);
    const totalRevenue = allInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const paidCount = allInvoices.filter((i) => i.status === "paid").length;
    const pendingAmt = allInvoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);
    const overdueAmt = allInvoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
    const profit = totalRevenue - pendingAmt - overdueAmt;
    res.json([
      { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, change: "+12.5%", trend: "up", icon: "DollarSign", prefix: "", suffix: "" },
      { label: "Paid Invoices", value: String(paidCount), change: "+8.2%", trend: "up", icon: "CheckCircle", prefix: "", suffix: "" },
      { label: "Pending Payments", value: `$${pendingAmt.toLocaleString()}`, change: "-3.1%", trend: "down", icon: "Clock", prefix: "", suffix: "" },
      { label: "Overdue Invoices", value: `$${overdueAmt.toLocaleString()}`, change: "+2.4%", trend: "down", icon: "AlertTriangle", prefix: "", suffix: "" },
      { label: "Active Clients", value: String(allClients.length), change: "+18.7%", trend: "up", icon: "Users", prefix: "", suffix: "" },
      { label: "Monthly Profit", value: `$${profit.toLocaleString()}`, change: "+15.3%", trend: "up", icon: "TrendingUp", prefix: "", suffix: "" },
    ]);
  } catch (err) {
    console.error("[Stats] Error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/revenue", async (_req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap: Record<string, { revenue: number; expenses: number }> = {};
    for (const inv of invoices) {
      const month = inv.invoiceDate ? new Date(inv.invoiceDate).getMonth() : new Date().getMonth();
      const key = monthNames[month];
      if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, expenses: 0 };
      if (inv.status === "paid") monthlyMap[key].revenue += inv.amount;
      monthlyMap[key].expenses += Math.round(inv.amount * 0.35);
    }
    for (const name of monthNames) {
      if (!monthlyMap[name]) monthlyMap[name] = { revenue: 0, expenses: 0 };
    }
    const result = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses,
    }));
    result.sort((a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month));
    res.json(result.filter((r) => r.revenue > 0 || monthNames.indexOf(r.month) <= new Date().getMonth()));
  } catch (err) {
    console.error("[Stats] Revenue error:", err);
    res.status(500).json({ error: "Failed to fetch revenue data" });
  }
});

router.get("/payment-status", async (_req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find();
    const paidAmt = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const pendingAmt = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);
    const overdueAmt = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
    const draftAmt = invoices.filter((i) => i.status === "draft").reduce((s, i) => s + i.amount, 0);
    const total = paidAmt + pendingAmt + overdueAmt + draftAmt;
    const toPercent = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
    res.json([
      { label: "Paid", value: toPercent(paidAmt), color: "#10b981", amount: paidAmt },
      { label: "Pending", value: toPercent(pendingAmt), color: "#f59e0b", amount: pendingAmt },
      { label: "Overdue", value: toPercent(overdueAmt), color: "#ef4444", amount: overdueAmt },
      { label: "Draft", value: toPercent(draftAmt), color: "#9ca3af", amount: draftAmt },
    ]);
  } catch (err) {
    console.error("[Stats] Payment status error:", err);
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
});

router.get("/invoices", async (_req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find();
    const total = invoices.length;
    const paid = invoices.filter((i) => i.status === "paid").length;
    const pending = invoices.filter((i) => i.status === "pending").length;
    const overdue = invoices.filter((i) => i.status === "overdue").length;
    const draft = invoices.filter((i) => i.status === "draft").length;
    const totalAmount = invoices.reduce((s, i) => s + i.amount, 0);
    const paidAmount = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const pendingAmount = invoices.filter((i) => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
    res.json({ total, paid, pending, overdue, draft, totalAmount, paidAmount, pendingAmount });
  } catch (err) {
    console.error("[Stats] Invoice stats error:", err);
    res.status(500).json({ error: "Failed to fetch invoice stats" });
  }
});

router.get("/clients", async (_req: Request, res: Response) => {
  try {
    const clients = await Client.find();
    const total = clients.length;
    const active = clients.filter((c) => c.status === "active").length;
    const inactive = clients.filter((c) => c.status === "inactive").length;
    res.json({ total, active, inactive });
  } catch (err) {
    console.error("[Stats] Client stats error:", err);
    res.status(500).json({ error: "Failed to fetch client stats" });
  }
});

router.get("/employees", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const currentMonth = now.toLocaleString("default", { month: "long" });
    const currentYear = now.getFullYear();
    const [employees, departments, payrollRecords] = await Promise.all([
      Employee.find(),
      Department.find(),
      Payroll.find({ month: currentMonth, year: currentYear }),
    ]);
    const total = employees.length;
    const active = employees.filter((e) => e.status === "active").length;
    const onLeave = employees.filter((e) => e.status === "on-leave").length;
    const inactive = employees.filter((e) => e.status === "inactive").length;
    const payrollTotal = payrollRecords.reduce((s, p) => s + p.netSalary, 0);
    res.json({ total, active, onLeave, inactive, payrollTotal, departmentCount: departments.length });
  } catch (err) {
    console.error("[Stats] Employee stats error:", err);
    res.status(500).json({ error: "Failed to fetch employee stats" });
  }
});

export default router;
