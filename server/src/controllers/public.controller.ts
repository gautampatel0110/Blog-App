import type { RequestHandler } from "express";
import Page from "../models/Page";

export const getPublishedBlogs: RequestHandler = async (_req, res) => {
  try {
    const blogs = await Page.find({ status: "Published", publishedAt: { $lte: new Date() } })
      .select("title subTitle slug author showAuthor attachments publishedAt")
      .sort({ publishedAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.error("GET PUBLISHED BLOGS ERROR:", error);
    res.status(500).json({ message: "Failed to load blogs" });
  }
};

export const getBlogBySlug: RequestHandler = async (req, res) => {
  try {
    const blog = await Page.findOne({
      slug: req.params["slug"],
      status: "Published",
      publishedAt: { $lte: new Date() },
    }).populate("createdBy", "name");
    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }
    res.json(blog);
  } catch (error) {
    console.error("GET BLOG BY SLUG ERROR:", error);
    res.status(500).json({ message: "Failed to load blog" });
  }
};
