import { Router, Request, Response } from "express";
import Payroll from "../models/Payroll";
import Employee from "../models/Employee";
import Activity from "../models/Activity";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const month = req.query.month as string | undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const status = req.query.status as string | undefined;
    const filter: Record<string, unknown> = {};
    if (month) filter.month = month;
    if (year) filter.year = year;
    if (status) filter.status = status;
    const [data, total] = await Promise.all([
      Payroll.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Payroll.countDocuments(filter),
    ]);
    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[Payroll] List error:", err);
    res.status(500).json({ error: "Failed to fetch payroll records" });
  }
});

router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const records = await Payroll.find();
    const totalGross = records.reduce((s, r) => s + r.basicSalary + r.allowances, 0);
    const totalDeductions = records.reduce((s, r) => s + r.deductions, 0);
    const totalNet = records.reduce((s, r) => s + r.netSalary, 0);
    const paid = records.filter((r) => r.status === "paid").length;
    const pending = records.filter((r) => r.status === "pending").length;
    res.json({ totalGross, totalDeductions, totalNet, paid, pending, total: records.length });
  } catch (err) {
    console.error("[Payroll] Summary error:", err);
    res.status(500).json({ error: "Failed to fetch payroll summary" });
  }
});

router.post("/run", async (req: Request, res: Response) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      res.status(400).json({ error: "Missing required fields: month, year" });
      return;
    }
    const employees = await Employee.find({ status: "active" });
    const created = [];

    for (const emp of employees) {
      const existing = await Payroll.findOne({ employeeId: String(emp._id), month, year: parseInt(year) });
      if (existing) continue;

      const basic = emp.salary || 100000;
      const allowances = Math.round(basic * 0.15);
      const deductions = Math.round(basic * 0.1);
      const record = await Payroll.create({
        employeeId: String(emp._id),
        employeeName: `${emp.firstName} ${emp.lastName}`,
        month,
        year: parseInt(year),
        basicSalary: basic,
        allowances,
        deductions,
        netSalary: basic + allowances - deductions,
        status: "processing",
      });
      created.push(record);
    }

    await Activity.create({
      type: "payroll",
      message: `Payroll run for ${month} ${year}: ${created.length} records created`,
      user: "System",
    });

    res.status(201).json({ created: created.length, records: created });
  } catch (err) {
    console.error("[Payroll] Run error:", err);
    res.status(500).json({ error: "Failed to run payroll" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) {
      res.status(404).json({ error: "Payroll record not found" });
      return;
    }
    res.json(record);
  } catch (err) {
    console.error("[Payroll] Get error:", err);
    res.status(500).json({ error: "Failed to fetch payroll record" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { employeeId, employeeName, month, year, basicSalary, allowances, deductions, netSalary, status } = req.body;
    if (!employeeId || !employeeName || !month || !year) {
      res.status(400).json({ error: "Missing required fields: employeeId, employeeName, month, year" });
      return;
    }
    const basic = parseFloat(basicSalary) || 0;
    const allow = parseFloat(allowances) || 0;
    const deduct = parseFloat(deductions) || 0;
    const record = await Payroll.create({
      employeeId, employeeName, month, year: parseInt(year),
      basicSalary: basic, allowances: allow, deductions: deduct,
      netSalary: parseFloat(netSalary) || (basic + allow - deduct),
      status: status || "pending",
    });
    res.status(201).json(record);
  } catch (err) {
    console.error("[Payroll] Create error:", err);
    res.status(500).json({ error: "Failed to create payroll record" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const record = await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) {
      res.status(404).json({ error: "Payroll record not found" });
      return;
    }
    if (req.body.status === "paid") {
      await Activity.create({
        type: "payroll",
        message: `Payroll processed for ${record.employeeName}`,
        user: "System",
      });
    }
    res.json(record);
  } catch (err) {
    console.error("[Payroll] Update error:", err);
    res.status(500).json({ error: "Failed to update payroll record" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const record = await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) {
      res.status(404).json({ error: "Payroll record not found" });
      return;
    }
    if (req.body.status === "paid") {
      await Activity.create({
        type: "payroll",
        message: `Payroll processed for ${record.employeeName}`,
        user: "System",
      });
    }
    res.json(record);
  } catch (err) {
    console.error("[Payroll] Patch error:", err);
    res.status(500).json({ error: "Failed to update payroll record" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await Payroll.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Payroll record not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("[Payroll] Delete error:", err);
    res.status(500).json({ error: "Failed to delete payroll record" });
  }
});

export default router;
