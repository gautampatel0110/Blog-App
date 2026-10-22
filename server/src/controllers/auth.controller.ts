import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { CookieOptions, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import sendMail from "../utils/sendMail";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

function tokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export const signup: RequestHandler = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!name || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: "Password too short" });
      return;
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      res.status(409).json({ message: "User already exists" });
      return;
    }
    console.error("SIGNUP ERROR:", error);
    res.status(500).json({ message: "Signup failed" });
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!email || !password) {
      res.status(400).json({ message: "Missing credentials" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: user._id.toString() }, getJwtSecret(), { expiresIn: "7d" });
    res.cookie("token", token, tokenCookieOptions());
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
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const token = randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const clientUrl = (process.env.CLIENT_URL ?? "http://localhost:5173").replace(/\/$/, "");
    await sendMail({
      to: user.email,
      subject: "Reset your password",
      html: `<p>Use this link within 15 minutes to reset your password:</p><a href="${clientUrl}/reset/${token}">Reset password</a>`,
    });
    res.json({ message: "If the account exists, a reset email has been sent" });
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
      resetToken: req.params["token"],
      resetExpire: { $gt: new Date() },
    });
    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetExpire = null;
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

export const me: RequestHandler = (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  res.json({ message: "Authenticated", userId: req.user.id });
};
