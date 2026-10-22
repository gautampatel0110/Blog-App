import { Router } from "express";
import { getBlogBySlug, getPublishedBlogs } from "../controllers/public.controller";

const router = Router();
router.get("/blogs", getPublishedBlogs);
router.get("/blogs/:slug", getBlogBySlug);

export default router;
