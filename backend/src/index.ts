import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import corsMiddleware from "./middleware/cors";
import { errorHandler } from "./middleware/error";

import db from "./db";
import User from "./models/User";
import { getOrganizationSettings } from "./models/Settings";
import authRouter from "./routes/auth";
import { authMiddleware } from "./middleware/auth";
import invoicesRouter from "./routes/invoices";
import clientsRouter from "./routes/clients";
import employeesRouter from "./routes/employees";
import departmentsRouter from "./routes/departments";
import attendanceRouter from "./routes/attendance";
import leaveRouter from "./routes/leave";
import payrollRouter from "./routes/payroll";
import paymentsRouter from "./routes/payments";
import billingRouter from "./routes/billing";
import statsRouter from "./routes/stats";
import activitiesRouter from "./routes/activities";
import dashboardRouter from "./routes/dashboard";
import reportsRouter from "./routes/reports";
import settingsRouter from "./routes/settings";
import searchRouter from "./routes/search";

const app = express();
const PORT = process.env.PORT || 4000;

// Security
app.use(helmet());
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);
app.use("/api", globalLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);

app.use("/api", (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  if (req.path === "/auth" || req.path.startsWith("/auth/") || req.path === "/health") return next();
  authMiddleware(req as import("./middleware/auth").AuthRequest, res, next);
});

app.use("/api/dashboard", dashboardRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/leave", leaveRouter);
app.use("/api/payroll", payrollRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/billing", billingRouter);
app.use("/api/stats", statsRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/search", searchRouter);

app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use(errorHandler);

async function seedAdmin() {
  try {
    const existing = await User.findOne({ email: "admin@molyweb.com" });
    if (existing) {
      existing.password = "password123";
      await existing.save();
      console.log("✓ Default admin password updated (admin@molyweb.com / password123)");
    } else {
      await User.create({
        email: "admin@molyweb.com",
        password: "password123",
        fullName: "Admin",
        role: "SUPER_ADMIN",
        isActive: true,
      });
      console.log("✓ Default admin user created (admin@molyweb.com / password123)");
    }
  } catch (error) {
    console.error("[Seed] Admin creation failed:", error);
  }
}

async function start(): Promise<void> {
  try {
    await db.$connect();
    console.log("✓ Connected to PostgreSQL");
    
    await seedAdmin();
    await getOrganizationSettings();
    console.log("✓ Database initialization complete");
    
    app.listen(PORT, () => {
      console.log(`\n🚀 MolyWeb API running at http://localhost:${PORT}`);
      console.log(`📝 API Health: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Login: http://localhost:${PORT}/api/auth/admin/login\n`);
    });
  } catch (error) {
    console.error("\n❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();

export default app;