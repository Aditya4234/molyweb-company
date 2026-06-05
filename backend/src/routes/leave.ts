import { Router, Request, Response } from "express";
import LeaveRequest from "../models/LeaveRequest";
import Activity from "../models/Activity";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const status = req.query.status as string | undefined;
    const employeeId = req.query.employeeId as string | undefined;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;
    const [data, total] = await Promise.all([
      LeaveRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      LeaveRequest.countDocuments(filter),
    ]);
    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[Leave] List error:", err);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
});

router.get("/balances", async (req: Request, res: Response) => {
  try {
    const employeeId = req.query.employeeId as string | undefined;
    const DEFAULTS = { sick: 12, casual: 12, earned: 15, maternity: 90, paternity: 15, unpaid: 0 };
    const filter: Record<string, unknown> = { status: "approved" };
    if (employeeId) filter.employeeId = employeeId;

    const approved = await LeaveRequest.find(filter);
    const usedByType: Record<string, number> = {};

    for (const leave of approved) {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const type = leave.type === "vacation" ? "earned" : leave.type === "personal" ? "casual" : leave.type;
      usedByType[type] = (usedByType[type] || 0) + days;
    }

    const balances: Record<string, { total: number; used: number; remaining: number }> = {};
    for (const [type, total] of Object.entries(DEFAULTS)) {
      const used = usedByType[type] || 0;
      balances[type] = { total, used, remaining: Math.max(0, total - used) };
    }
    res.json(balances);
  } catch (err) {
    console.error("[Leave] Balances error:", err);
    res.status(500).json({ error: "Failed to fetch leave balances" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }
    res.json(leave);
  } catch (err) {
    console.error("[Leave] Get error:", err);
    res.status(500).json({ error: "Failed to fetch leave request" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { employeeId, employeeName, type, startDate, endDate, reason } = req.body;
    if (!employeeId || !employeeName || !type || !startDate || !endDate) {
      res.status(400).json({ error: "Missing required fields: employeeId, employeeName, type, startDate, endDate" });
      return;
    }
    const leave = await LeaveRequest.create({
      employeeId, employeeName, type, startDate, endDate,
      reason: reason || "", status: "pending",
    });
    res.status(201).json(leave);
  } catch (err) {
    console.error("[Leave] Create error:", err);
    res.status(500).json({ error: "Failed to create leave request" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const leave = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!leave) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }
    if (req.body.status === "approved") {
      await Activity.create({
        type: "leave",
        message: `Leave approved for ${leave.employeeName} (${leave.type})`,
        user: "Admin",
      });
    }
    res.json(leave);
  } catch (err) {
    console.error("[Leave] Update error:", err);
    res.status(500).json({ error: "Failed to update leave request" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const leave = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!leave) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }
    if (req.body.status === "approved") {
      await Activity.create({
        type: "leave",
        message: `Leave approved for ${leave.employeeName} (${leave.type})`,
        user: "Admin",
      });
    }
    res.json(leave);
  } catch (err) {
    console.error("[Leave] Patch error:", err);
    res.status(500).json({ error: "Failed to update leave request" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("[Leave] Delete error:", err);
    res.status(500).json({ error: "Failed to delete leave request" });
  }
});

export default router;
