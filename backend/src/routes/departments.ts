import { Router, Request, Response } from "express";
import Department from "../models/Department";
import { escapeRegex } from "../middleware/error";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) filter.name = new RegExp(escapeRegex(search), "i");
    const data = await Department.find(filter).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error("[Departments] List error:", err);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      res.status(404).json({ error: "Department not found" });
      return;
    }
    res.json(department);
  } catch (err) {
    console.error("[Departments] Get error:", err);
    res.status(500).json({ error: "Failed to fetch department" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, head, budget, status } = req.body;
    if (!name) {
      res.status(400).json({ error: "Missing required field: name" });
      return;
    }
    const department = await Department.create({
      name, head: head || "", budget: parseFloat(budget) || 0, status: status || "active",
    });
    res.status(201).json(department);
  } catch (err) {
    console.error("[Departments] Create error:", err);
    res.status(500).json({ error: "Failed to create department" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!department) {
      res.status(404).json({ error: "Department not found" });
      return;
    }
    res.json(department);
  } catch (err) {
    console.error("[Departments] Update error:", err);
    res.status(500).json({ error: "Failed to update department" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!department) {
      res.status(404).json({ error: "Department not found" });
      return;
    }
    res.json(department);
  } catch (err) {
    console.error("[Departments] Patch error:", err);
    res.status(500).json({ error: "Failed to update department" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Department not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("[Departments] Delete error:", err);
    res.status(500).json({ error: "Failed to delete department" });
  }
});

export default router;
