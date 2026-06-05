import { Router, Request, Response } from "express";
import Payment from "../models/Payment";
import Activity from "../models/Activity";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const status = req.query.status as string | undefined;
    const method = req.query.method as string | undefined;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (method) filter.method = method;
    const [data, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Payment.countDocuments(filter),
    ]);
    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[Payments] List error:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const all = await Payment.find();
    const totalCollected = all.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);
    const totalPending = all.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    const totalFailed = all.filter((p) => p.status === "failed").reduce((s, p) => s + p.amount, 0);
    res.json({ totalCollected, totalPending, totalFailed, total: all.length });
  } catch (err) {
    console.error("[Payments] Stats error:", err);
    res.status(500).json({ error: "Failed to fetch payment stats" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    res.json(payment);
  } catch (err) {
    console.error("[Payments] Get error:", err);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { invoiceId, clientName, amount, method, status, transactionId, date } = req.body;
    if (!invoiceId || !clientName || !amount || !method) {
      res.status(400).json({ error: "Missing required fields: invoiceId, clientName, amount, method" });
      return;
    }
    const payment = await Payment.create({
      invoiceId, clientName, amount: parseFloat(amount),
      method, status: status || "completed",
      transactionId: transactionId || `TXN-${Date.now()}`,
      date: date || new Date().toISOString().split("T")[0],
    });
    if (payment.status === "completed") {
      await Activity.create({
        type: "payment",
        message: `Payment received from ${payment.clientName} - $${payment.amount.toLocaleString()}`,
        user: "System",
      });
    }
    res.status(201).json(payment);
  } catch (err) {
    console.error("[Payments] Create error:", err);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    res.json(payment);
  } catch (err) {
    console.error("[Payments] Update error:", err);
    res.status(500).json({ error: "Failed to update payment" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    res.json(payment);
  } catch (err) {
    console.error("[Payments] Patch error:", err);
    res.status(500).json({ error: "Failed to update payment" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await Payment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("[Payments] Delete error:", err);
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

export default router;
