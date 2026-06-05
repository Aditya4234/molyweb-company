import { Router, Request, Response } from "express";
import BillingPlan from "../models/BillingPlan";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const status = req.query.status as string | undefined;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const [data, total] = await Promise.all([
      BillingPlan.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      BillingPlan.countDocuments(filter),
    ]);
    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[Billing] List error:", err);
    res.status(500).json({ error: "Failed to fetch billing plans" });
  }
});

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const all = await BillingPlan.find();
    const active = all.filter((b) => b.status === "active").length;
    const cancelled = all.filter((b) => b.status === "cancelled").length;
    const expired = all.filter((b) => b.status === "expired").length;
    const trial = all.filter((b) => b.status === "trial").length;
    const monthlyRevenue = all.filter((b) => b.status === "active").reduce((s, b) => s + b.amount, 0);
    res.json({ active, cancelled, expired, trial, total: all.length, monthlyRevenue });
  } catch (err) {
    console.error("[Billing] Stats error:", err);
    res.status(500).json({ error: "Failed to fetch billing stats" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const plan = await BillingPlan.findById(req.params.id);
    if (!plan) {
      res.status(404).json({ error: "Billing plan not found" });
      return;
    }
    res.json(plan);
  } catch (err) {
    console.error("[Billing] Get error:", err);
    res.status(500).json({ error: "Failed to fetch billing plan" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { clientId, clientName, plan, amount, status, startDate, endDate } = req.body;
    if (!clientId || !clientName || !plan || !amount) {
      res.status(400).json({ error: "Missing required fields: clientId, clientName, plan, amount" });
      return;
    }
    const billingPlan = await BillingPlan.create({
      clientId, clientName, plan, amount: parseFloat(amount),
      status: status || "active",
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    });
    res.status(201).json(billingPlan);
  } catch (err) {
    console.error("[Billing] Create error:", err);
    res.status(500).json({ error: "Failed to create billing plan" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const plan = await BillingPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) {
      res.status(404).json({ error: "Billing plan not found" });
      return;
    }
    res.json(plan);
  } catch (err) {
    console.error("[Billing] Update error:", err);
    res.status(500).json({ error: "Failed to update billing plan" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const plan = await BillingPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) {
      res.status(404).json({ error: "Billing plan not found" });
      return;
    }
    res.json(plan);
  } catch (err) {
    console.error("[Billing] Patch error:", err);
    res.status(500).json({ error: "Failed to update billing plan" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await BillingPlan.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Billing plan not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("[Billing] Delete error:", err);
    res.status(500).json({ error: "Failed to delete billing plan" });
  }
});

export default router;
