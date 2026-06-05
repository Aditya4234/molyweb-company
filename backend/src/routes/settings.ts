import { Router, Request, Response } from "express";
import { getOrganizationSettings } from "../models/Settings";

const router = Router();

router.get("/organization", async (_req: Request, res: Response) => {
  try {
    const settings = await getOrganizationSettings();
    res.json(settings);
  } catch (err) {
    console.error("[Settings] Get error:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

const ALLOWED_SETTINGS_FIELDS = [
  "companyName", "email", "phone", "address", "city", "state",
  "pincode", "gstin", "pan", "website", "financialYearStart",
];

router.put("/organization", async (req: Request, res: Response) => {
  try {
    const settings = await getOrganizationSettings();
    for (const key of ALLOWED_SETTINGS_FIELDS) {
      if (req.body[key] !== undefined) {
        (settings as any)[key] = req.body[key];
      }
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error("[Settings] Update error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
