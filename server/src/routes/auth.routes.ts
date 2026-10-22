import { Router } from "express";
import protect from "../middleware/authMiddleware";
import { forgot, login, logout, me, reset, signup } from "../controllers/auth.controller";

const router = Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot", forgot);
router.post("/reset/:token", reset);
router.get("/me", protect, me);
router.post("/logout", logout);

export default router;
