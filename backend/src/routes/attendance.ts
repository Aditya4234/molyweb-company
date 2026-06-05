import { Router, Request, Response } from "express";
import Attendance from "../models/Attendance";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const employeeId = req.query.employeeId as string | undefined;
    const date = req.query.date as string | undefined;
    const filter: Record<string, unknown> = {};
    if (employeeId) filter.employeeId = employeeId;
    if (date) filter.date = date;
    const [data, total] = await Promise.all([
      Attendance.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Attendance.countDocuments(filter),
    ]);
    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[Attendance] List error:", err);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});

router.get("/employee/:employeeId", async (req: Request, res: Response) => {
  try {
    const data = await Attendance.find({ employeeId: req.params.employeeId }).sort({ date: -1 });
    res.json(data);
  } catch (err) {
    console.error("[Attendance] By employee error:", err);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { employeeId, employeeName, date, status, checkIn, checkOut } = req.body;
    if (!employeeId || !employeeName || !date || !status) {
      res.status(400).json({ error: "Missing required fields: employeeId, employeeName, date, status" });
      return;
    }
    const record = await Attendance.create({
      employeeId, employeeName, date, status,
      checkIn: checkIn || "-", checkOut: checkOut || "-",
    });
    res.status(201).json(record);
  } catch (err) {
    console.error("[Attendance] Create error:", err);
    res.status(500).json({ error: "Failed to create attendance record" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }
    res.json(record);
  } catch (err) {
    console.error("[Attendance] Update error:", err);
    res.status(500).json({ error: "Failed to update attendance record" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }
    res.json(record);
  } catch (err) {
    console.error("[Attendance] Patch error:", err);
    res.status(500).json({ error: "Failed to update attendance record" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("[Attendance] Delete error:", err);
    res.status(500).json({ error: "Failed to delete attendance record" });
  }
});

export default router;
