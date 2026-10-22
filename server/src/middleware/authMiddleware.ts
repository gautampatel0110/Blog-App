import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

const protect: RequestHandler = (req, res, next) => {
  const token = req.cookies?.token as string | undefined;
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ message: "Authentication is not configured" });
    return;
  }
  if (!token) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string" || typeof decoded["id"] !== "string") {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }
    req.user = { id: (decoded as JwtPayload)["id"] as string };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default protect;
