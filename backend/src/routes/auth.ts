import { Router, Request, Response } from "express";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import rateLimit from "express-rate-limit";
import User from "../models/User";
import LoginAudit from "../models/LoginAudit";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  authMiddleware,
  type AuthRequest,
  type TokenPayload,
} from "../middleware/auth";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: "Too many login attempts, please try again after 15 minutes" },
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function userResponse(user: any) {
  return {
    id: user._id || user.id,
    name: user.fullName || user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    provider: user.provider,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
}

// Google OAuth
router.post("/google", async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ error: "Google credential is required" });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google credential" });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (user) {
      user.googleId = user.googleId || googleId;
      user.avatar = user.avatar || picture;
      user.provider = "google";
      user.lastLogin = new Date();
    } else {
      user = await User.create({
        email: email.toLowerCase(),
        fullName: name || email.split("@")[0],
        googleId,
        avatar: picture,
        provider: "google",
        role: "EMPLOYEE",
        isActive: true,
        lastLogin: new Date(),
      });
    }

    const tokenPayload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user: userResponse(user),
    });
  } catch (err) {
    console.error("[Auth] Google OAuth error:", err);
    res.status(401).json({ error: "Google authentication failed" });
  }
});

// Admin Login
router.post("/admin/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Missing required fields: email, password" });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      await LoginAudit.create({ email: normalizedEmail, ipAddress: req.ip || "unknown", status: "failed", reason: "Account not found" });
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      await LoginAudit.create({ userId: user.id, email: normalizedEmail, ipAddress: req.ip || "unknown", status: "failed", reason: "Not an admin" });
      res.status(403).json({ error: "Access denied: Admins only" });
      return;
    }

    if (!user.isActive) {
      await LoginAudit.create({ userId: user.id, email: normalizedEmail, ipAddress: req.ip || "unknown", status: "failed", reason: "Account disabled" });
      res.status(403).json({ error: "Account disabled by administrator" });
      return;
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      await LoginAudit.create({ userId: user.id, email: normalizedEmail, ipAddress: req.ip || "unknown", status: "failed", reason: "Account locked" });
      res.status(403).json({ error: "Account is temporarily locked due to multiple failed login attempts" });
      return;
    }

    const isMatch = await user.comparePassword(password.trim());
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock for 15 mins
      }
      await user.save();
      await LoginAudit.create({ userId: user.id, email: normalizedEmail, ipAddress: req.ip || "unknown", status: "failed", reason: "Invalid password" });
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    
    const tokenPayload: TokenPayload = { id: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    user.refreshToken = refreshToken;

    await user.save();
    await LoginAudit.create({ userId: user.id, email: normalizedEmail, ipAddress: req.ip || "unknown", status: "success" });

    setTokenCookies(res, accessToken, refreshToken);
    res.json({ accessToken, refreshToken, user: userResponse(user) });
  } catch (err) {
    console.error("[Auth] Admin Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Employee Login
router.post("/employee/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Missing required fields: email, password" });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      await LoginAudit.create({ email: normalizedEmail, ipAddress: req.ip || "unknown", status: "failed", reason: "Employee account not found" });
      res.status(401).json({ error: "Employee account not found" });
      return;
    }
    
    if (user.role !== "EMPLOYEE") {
      await LoginAudit.create({ userId: user.id, email: normalizedEmail, ipAddress: req.ip || "unknown", status: "failed", reason: "Not an employee" });
      res.status(403).json({ error: "Access denied: Employees only" });
      return;
    }

    if (!user.isActive) {
      await LoginAudit.create({ userId: user.id, email: normalizedEmail, ipAddress: req.ip || "unknown", status: "failed", reason: "Account disabled" });
      res.status(403).json({ error: "Account disabled by administrator" });
      return;
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      await LoginAudit.create({ userId: user.id, email: normalizedEmail, ipAddress: req.ip || "unknown", status: "failed", reason: "Account locked" });
      res.status(403).json({ error: "Account is temporarily locked due to multiple failed login attempts" });
      return;
    }

    const isMatch = await user.comparePassword(password.trim());
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock for 15 mins
      }
      await user.save();
      await LoginAudit.create({ userId: user.id, email: normalizedEmail, ipAddress: req.ip || "unknown", status: "failed", reason: "Invalid password" });
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    
    const tokenPayload: TokenPayload = { id: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    user.refreshToken = refreshToken;

    await user.save();
    await LoginAudit.create({ userId: user.id, email: normalizedEmail, ipAddress: req.ip || "unknown", status: "success" });

    setTokenCookies(res, accessToken, refreshToken);
    res.json({ accessToken, refreshToken, user: userResponse(user) });
  } catch (err) {
    console.error("[Auth] Employee Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Refresh Token
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ error: "Refresh token revoked or invalid" });
      return;
    }

    const tokenPayload: TokenPayload = { id: user._id.toString(), email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    user.refreshToken = newRefreshToken;
    await user.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error("[Auth] Refresh error:", err);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// Logout
router.post("/logout", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.user!.id, { refreshToken: null });
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    res.json({ message: "Logged out successfully" });
  } catch {
    res.status(500).json({ error: "Logout failed" });
  }
});

// Get current user
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select("-password -refreshToken");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: userResponse(user) });
  } catch {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Get profile (alias for /me)
router.get("/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select("-password -refreshToken");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: userResponse(user) });
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Forgot Password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.json({ message: "If that email exists, a reset link has been sent." });
      return;
    }
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();
    console.log(`[Auth] Password reset token for ${email}: ${token}`);
    res.json({
      message: "If that email exists, a reset link has been sent.",
      ...(process.env.NODE_ENV !== "production" && { resetToken: token }),
    });
  } catch (err) {
    console.error("[Auth] Forgot password error:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// Reset Password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: "Token and new password are required" });
      return;
    }
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    console.error("[Auth] Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Change Password
router.post("/change-password", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current password and new password are required" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.provider === "google" && !user.password) {
      res.status(400).json({ error: "Google accounts use Google authentication. Set a password first." });
      return;
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("[Auth] Change password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

router.put("/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { fullName } = req.body;
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (fullName) user.fullName = fullName;
    await user.save();
    res.json({ user: userResponse(user) });
  } catch (err) {
    console.error("[Auth] Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;