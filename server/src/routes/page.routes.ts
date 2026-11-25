import { Router } from "express";
import { createPage, deletePage, getPage, getPages, getPageStats, schedulePage, updatePage } from "../controllers/page.controller";
import protect from "../middleware/authMiddleware";
import upload from "../middleware/upload.middleware";

const router = Router();
router.post("/", protect, upload.array("attachments"), createPage);
router.get("/", protect, getPages);
router.get("/stats", protect, getPageStats);
router.get("/:id", protect, getPage);
router.put("/:id", protect, upload.array("attachments"), updatePage);
router.delete("/:id", protect, deletePage);
router.put("/:id/schedule", protect, schedulePage);

export default router;
