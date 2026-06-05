import { Router, Request, Response } from "express";
import Activity, { type IActivity } from "../models/Activity";

const router = Router();

const typeMap: Record<string, "success" | "warning" | "error" | "info"> = {
  payment: "success",
  invoice: "info",
  client: "info",
  failed: "error",
  refund: "warning",
  employee: "info",
  leave: "warning",
  payroll: "success",
};

function toNotification(a: IActivity) {
  const type = typeMap[a.type] || "info";
  const title = a.type.charAt(0).toUpperCase() + a.type.slice(1);
  return {
    id: String(a._id),
    title,
    message: a.message,
    type,
    read: a.read ?? false,
    timestamp: a.createdAt ? a.createdAt.toISOString() : a.timestamp,
  };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [data, total] = await Promise.all([
      Activity.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Activity.countDocuments(),
    ]);
    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[Activities] List error:", err);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

router.get("/all", async (_req: Request, res: Response) => {
  try {
    const data = await Activity.find().sort({ createdAt: -1 }).limit(100);
    res.json(data);
  } catch (err) {
    console.error("[Activities] All error:", err);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

router.get("/notifications", async (_req: Request, res: Response) => {
  try {
    const data = await Activity.find().sort({ createdAt: -1 }).limit(20);
    res.json(data.map((a) => toNotification(a)));
  } catch (err) {
    console.error("[Activities] Notifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.patch("/notifications/:id/read", async (req: Request, res: Response) => {
  try {
    const activity = await Activity.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!activity) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json(toNotification(activity));
  } catch (err) {
    console.error("[Activities] Mark read error:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

router.post("/notifications/read-all", async (_req: Request, res: Response) => {
  try {
    await Activity.updateMany({ read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("[Activities] Mark all read error:", err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

export default router;
