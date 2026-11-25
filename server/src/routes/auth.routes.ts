import { Router } from "express";
import protect from "../middleware/authMiddleware";
import { authLimiter } from "../middleware/rateLimit.middleware";
import { forgot, login, logout, me, resendVerification, reset, signup, verifyEmail } from "../controllers/auth.controller";

const router = Router();
router.post("/signup", authLimiter, signup);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.post("/login", authLimiter, login);
router.post("/forgot", authLimiter, forgot);
router.post("/reset/:token", authLimiter, reset);
router.get("/me", protect, me);
router.post("/logout", logout);

export default router;
