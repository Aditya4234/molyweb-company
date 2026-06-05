import { Router, Request, Response } from "express";
import crypto from "crypto";
import Employee from "../models/Employee";
import Department from "../models/Department";
import Activity from "../models/Activity";
import Payroll from "../models/Payroll";
import User from "../models/User";
import { escapeRegex } from "../middleware/error";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const search = req.query.search as string | undefined;
    const department = req.query.department as string | undefined;
    const status = req.query.status as string | undefined;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { position: regex },
      ];
    }
    const [data, total] = await Promise.all([
      Employee.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Employee.countDocuments(filter),
    ]);
    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[Employees] List error:", err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

router.get("/all", async (_req: Request, res: Response) => {
  try {
    const data = await Employee.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error("[Employees] All error:", err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

router.get("/stats", async (_req: Request, res: Response) => {
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
    console.error("[Employees] Stats error:", err);
    res.status(500).json({ error: "Failed to fetch employee stats" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.json(employee);
  } catch (err) {
    console.error("[Employees] Get error:", err);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, department, position, salary, status, joinDate, address, bankAccount, ifscCode, createLogin, password } = req.body;
    if (!firstName || !lastName || !email) {
      res.status(400).json({ error: "Missing required fields: firstName, lastName, email" });
      return;
    }
    
    // Create Employee record
    const employee = await Employee.create({
      firstName, lastName, email, phone: phone || "",
      department: department || "General", position: position || "",
      salary: parseFloat(salary) || 0, status: status || "active",
      joinDate: joinDate || new Date().toISOString().split("T")[0],
      address: address || "", bankAccount, ifscCode,
    });

    const dept = await Department.findOne({ name: employee.department });
    if (dept) {
      await Department.findByIdAndUpdate(dept._id, { $inc: { employeeCount: 1 } });
    }

    // Optionally create User login
    let generatedPassword: string | undefined;
    if (createLogin) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (!existingUser) {
        const loginPassword = password || crypto.randomBytes(4).toString("hex");
        generatedPassword = loginPassword;
        await User.create({
          email: email.toLowerCase(),
          password: loginPassword,
          fullName: `${firstName} ${lastName}`,
          role: "EMPLOYEE",
          employeeId: employee._id.toString(),
          department: employee.department,
          isActive: true
        });
      }
    }

    await Activity.create({
      type: "employee",
      message: `New employee joined: ${employee.firstName} ${employee.lastName} (${employee.department})`,
      user: "System",
    });
    res.status(201).json({ employee, generatedPassword });
  } catch (err) {
    console.error("[Employees] Create error:", err);
    res.status(500).json({ error: "Failed to create employee" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.json(employee);
  } catch (err) {
    console.error("[Employees] Update error:", err);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.json(employee);
  } catch (err) {
    console.error("[Employees] Patch error:", err);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    const dept = await Department.findOne({ name: emp.department });
    if (dept) {
      await Department.findByIdAndUpdate(dept._id, { $inc: { employeeCount: -1 } });
    }
    await Employee.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error("[Employees] Delete error:", err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

export default router;
