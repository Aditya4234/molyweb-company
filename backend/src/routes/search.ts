import { Router, Request, Response } from "express";
import Invoice from "../models/Invoice";
import Client from "../models/Client";
import Employee from "../models/Employee";
import { escapeRegex } from "../middleware/error";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || "").trim();
    if (!q || q.length < 2) {
      res.json({ invoices: [], clients: [], employees: [] });
      return;
    }
    const regex = new RegExp(escapeRegex(q), "i");
    const [invoices, clients, employees] = await Promise.all([
      Invoice.find({ $or: [{ clientName: regex }, { email: regex }] }).limit(5).lean(),
      Client.find({ $or: [{ name: regex }, { email: regex }, { company: regex }] }).limit(5).lean(),
      Employee.find({ $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] }).limit(5).lean(),
    ]);
    res.json({
      invoices: invoices.map((i) => ({
        id: String(i._id),
        label: `${i._id} — ${i.clientName}`,
        href: `/invoices/${i._id}`,
        type: "invoice",
      })),
      clients: clients.map((c) => ({
        id: String(c._id),
        label: `${c.name} (${c.company || c.email})`,
        href: `/clients`,
        type: "client",
      })),
      employees: employees.map((e) => ({
        id: String(e._id),
        label: `${e.firstName} ${e.lastName}`,
        href: `/employees/${e._id}`,
        type: "employee",
      })),
    });
  } catch (err) {
    console.error("[Search] Error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
