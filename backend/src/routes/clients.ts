import { Router, Request, Response } from "express";
import Client from "../models/Client";
import Activity from "../models/Activity";
import { escapeRegex } from "../middleware/error";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { company: regex }, { email: regex }];
    }
    const [data, total] = await Promise.all([
      Client.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Client.countDocuments(filter),
    ]);
    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[Clients] List error:", err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

router.get("/all", async (_req: Request, res: Response) => {
  try {
    const data = await Client.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error("[Clients] All error:", err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const clients = await Client.find();
    const total = clients.length;
    const active = clients.filter((c) => c.status === "active").length;
    const inactive = clients.filter((c) => c.status === "inactive").length;
    res.json({ total, active, inactive });
  } catch (err) {
    console.error("[Clients] Stats error:", err);
    res.status(500).json({ error: "Failed to fetch client stats" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json(client);
  } catch (err) {
    console.error("[Clients] Get error:", err);
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, address, pincode, gstin, status } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: "Missing required fields: name, email" });
      return;
    }
    const client = await Client.create({
      name, email, phone: phone || "", company: company || "",
      address: address || "", pincode: pincode || "", gstin, status: status || "active",
    });
    await Activity.create({ type: "client", message: `New client registered: ${client.name}`, user: "Admin" });
    res.status(201).json(client);
  } catch (err) {
    console.error("[Clients] Create error:", err);
    res.status(500).json({ error: "Failed to create client" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json(client);
  } catch (err) {
    console.error("[Clients] Update error:", err);
    res.status(500).json({ error: "Failed to update client" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json(client);
  } catch (err) {
    console.error("[Clients] Patch error:", err);
    res.status(500).json({ error: "Failed to update client" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await Client.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("[Clients] Delete error:", err);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;
