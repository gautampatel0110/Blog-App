import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { CookieOptions, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { HydratedDocument } from "mongoose";
import User, { type UserRecord } from "../models/User";
import sendMail, { isMailConfigured } from "../utils/sendMail";
import { passwordResetEmail, verificationEmail } from "../utils/emailTemplates";

const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_SECONDS = 60;
const RESET_MINUTES = 15;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FORGOT_RESPONSE = { message: "If an account exists for that email, a reset link has been sent" };

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

function clientUrl(): string {
  return (process.env.CLIENT_URL ?? "http://localhost:5173").replace(/\/$/, "");
}

/** Codes and reset tokens are stored hashed so a database leak cannot be used to take over accounts. */
function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function secretsMatch(plain: string, hashed: string): boolean {
  const a = Buffer.from(hashSecret(plain), "hex");
  const b = Buffer.from(hashed, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function readEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function tokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    // Frontend and backend live on different domains in production (Static Web Apps + App Service),
    // so the auth cookie must be sent cross-site, which requires SameSite=None + Secure.
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
  };
}

/** Creates a fresh code, stores its hash on the user and emails it. Returns whether the email went out. */
async function issueVerificationCode(user: HydratedDocument<UserRecord>): Promise<boolean> {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  user.verifyOtp = hashSecret(code);
  user.verifyOtpExpire = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
  user.verifyOtpAttempts = 0;
  user.verifyOtpSentAt = new Date();
  await user.save();

  if (!isMailConfigured() && process.env.NODE_ENV !== "production") {
    // Local development without SMTP: print the code so sign-up can still be tested.
    console.info(`[dev] Verification code for ${user.email}: ${code}`);
    return true;
  }
  return sendMail({ to: user.email, ...verificationEmail(user.name, code, OTP_MINUTES) });
}

export const signup: RequestHandler = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim().replace(/\s+/g, " ") : "";
    const email = readEmail(req.body.email);
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!name || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      res.status(400).json({ message: "Please enter a valid email address" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing && existing.emailVerified !== false) {
      res.status(409).json({ message: "An account with this email already exists. Please log in." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Someone who signed up but never verified can simply sign up again; we refresh their details.
    const user = existing ?? new User({ email });
    user.name = name;
    user.password = hashedPassword;
    user.emailVerified = false;

    const emailSent = await issueVerificationCode(user);
    res.status(201).json({
      message: emailSent
        ? "Account created. We sent a 6-digit code to your email."
        : "Account created, but we couldn't send the code. Use “Resend code” to try again.",
      email,
      emailSent,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      res.status(409).json({ message: "An account with this email already exists. Please log in." });
      return;
    }
    console.error("SIGNUP ERROR:", error);
    res.status(500).json({ message: "Signup failed" });
  }
};

export const verifyEmail: RequestHandler = async (req, res) => {
  try {
    const email = readEmail(req.body.email);
    const code = typeof req.body.code === "string" ? req.body.code.trim() : "";
    if (!email || !/^\d{6}$/.test(code)) {
      res.status(400).json({ message: "Enter the 6-digit code from your email" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid or expired code" });
      return;
    }
    if (user.emailVerified !== false) {
      res.json({ message: "Your email is already verified. Please log in." });
      return;
    }
    if (!user.verifyOtp || !user.verifyOtpExpire || user.verifyOtpExpire < new Date()) {
      res.status(400).json({ message: "This code has expired. Request a new one." });
      return;
    }
    if (user.verifyOtpAttempts >= OTP_MAX_ATTEMPTS) {
      res.status(429).json({ message: "Too many wrong attempts. Request a new code." });
      return;
    }
    if (!secretsMatch(code, user.verifyOtp)) {
      user.verifyOtpAttempts += 1;
      await user.save();
      const left = OTP_MAX_ATTEMPTS - user.verifyOtpAttempts;
      res.status(400).json({ message: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong attempts. Request a new code." });
      return;
    }

    user.emailVerified = true;
    user.verifyOtp = null;
    user.verifyOtpExpire = null;
    user.verifyOtpAttempts = 0;
    await user.save();
    res.json({ message: "Email verified! You can now log in." });
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const resendVerification: RequestHandler = async (req, res) => {
  try {
    const email = readEmail(req.body.email);
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    const user = await User.findOne({ email });
    // Same answer whether or not the account exists, so emails cannot be probed.
    if (!user || user.emailVerified !== false) {
      res.json({ message: "If that account needs verification, a new code has been sent." });
      return;
    }
    const sinceLast = user.verifyOtpSentAt ? (Date.now() - user.verifyOtpSentAt.getTime()) / 1000 : Infinity;
    if (sinceLast < OTP_RESEND_SECONDS) {
      res.status(429).json({ message: `Please wait ${Math.ceil(OTP_RESEND_SECONDS - sinceLast)} seconds before requesting another code.` });
      return;
    }
    const sent = await issueVerificationCode(user);
    if (!sent) {
      res.status(502).json({ message: "We couldn't send the email right now. Please try again shortly." });
      return;
    }
    res.json({ message: "A new code has been sent to your email." });
  } catch (error) {
    console.error("RESEND VERIFICATION ERROR:", error);
    res.status(500).json({ message: "Could not resend the code" });
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const email = readEmail(req.body.email);
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!email || !password) {
      res.status(400).json({ message: "Missing credentials" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    if (user.emailVerified === false) {
      res.status(403).json({ message: "Please verify your email before logging in.", code: "EMAIL_NOT_VERIFIED", email });
      return;
    }

    const token = jwt.sign({ id: user._id.toString() }, getJwtSecret(), { expiresIn: "7d" });
    res.cookie("token", token, { ...tokenCookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({
      message: "Login successful",
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

export const forgot: RequestHandler = async (req, res) => {
  try {
    const email = readEmail(req.body.email);
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    const user = await User.findOne({ email });
    // Always answer the same way so the endpoint cannot be used to discover registered emails.
    if (!user) {
      res.json(FORGOT_RESPONSE);
      return;
    }

    const token = randomBytes(32).toString("hex");
    user.resetToken = hashSecret(token);
    user.resetExpire = new Date(Date.now() + RESET_MINUTES * 60 * 1000);
    await user.save();

    await sendMail({ to: user.email, ...passwordResetEmail(user.name, `${clientUrl()}/reset/${token}`, RESET_MINUTES) });
    res.json(FORGOT_RESPONSE);
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: "Forgot password failed" });
  }
};

export const reset: RequestHandler = async (req, res) => {
  try {
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const user = await User.findOne({
      resetToken: hashSecret(String(req.params["token"] ?? "")),
      resetExpire: { $gt: new Date() },
    });
    if (!user) {
      res.status(400).json({ message: "This reset link is invalid or has expired" });
      return;
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetExpire = null;
    // Receiving the reset email proves the user owns the address.
    if (user.emailVerified === false) user.emailVerified = true;
    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Reset failed" });
  }
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie("token", tokenCookieOptions());
  res.json({ message: "Logged out successfully" });
};

export const me: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const user = await User.findById(req.user.id).select("name email").lean();
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    res.json({ user: { id: req.user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("ME ERROR:", error);
    res.status(500).json({ message: "Failed to load user" });
  }
};
