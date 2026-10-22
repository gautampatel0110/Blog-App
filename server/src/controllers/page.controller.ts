import { isValidObjectId, Types, type FilterQuery } from "mongoose";
import type { RequestHandler } from "express";
import cloudinary from "../config/cloudinary";
import Page, { PAGE_STATUSES, type PageAttachment, type PageRecord } from "../models/Page";
import User from "../models/User";

function uploadedFiles(req: Parameters<RequestHandler>[0]): Express.Multer.File[] {
  return Array.isArray(req.files) ? req.files : [];
}

function isPageStatus(value: unknown): value is PageRecord["status"] {
  return typeof value === "string" && PAGE_STATUSES.includes(value as PageRecord["status"]);
}

function publicIdFromAttachment(value: string): string {
  if (!value.includes("res.cloudinary.com")) return value;
  const segments = new URL(value).pathname.split("/").filter(Boolean);
  const uploadIndex = segments.indexOf("upload");
  const path = (uploadIndex >= 0 ? segments.slice(uploadIndex + 1) : segments).filter(
    (segment) => !/^v\d+$/.test(segment),
  );
  const last = path.at(-1);
  if (last) path[path.length - 1] = last.replace(/\.[^.]+$/, "");
  return path.join("/");
}

function normalizeKeepAttachments(value: unknown, current: PageAttachment[]): Set<string> {
  if (value === undefined) return new Set(current.map(({ publicId }) => publicId));
  const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  return new Set(values.filter((item): item is string => typeof item === "string").map(publicIdFromAttachment));
}

async function removeCloudinaryAssets(publicIds: string[]): Promise<void> {
  await Promise.allSettled(
    publicIds.map(async (publicId) => {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
      if (result.result !== "ok" && result.result !== "not found") {
        console.warn(`Cloudinary did not remove ${publicId}: ${result.result}`);
      }
    }),
  );
}

export const createPage: RequestHandler = async (req, res) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const files = uploadedFiles(req);
    const attachments: PageAttachment[] = files.map((file) => ({
      url: file.path,
      publicId: file.filename,
      type: file.mimetype,
    }));

    const page = await Page.create({
      title: req.body.title,
      subTitle: req.body.subTitle,
      slug: req.body.slug,
      body: req.body.body,
      author: typeof req.body.author === "string" ? req.body.author.trim() : "",
      showAuthor: req.body.showAuthor !== "false" && req.body.showAuthor !== false,
      status: isPageStatus(req.body.status) ? req.body.status : "Draft",
      publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : null,
      attachments,
      createdBy: req.user.id,
    });
    res.status(201).json(page);
  } catch (error) {
    console.error("CREATE PAGE ERROR:", error);
    res.status(500).json({ message: "Create page failed" });
  }
};

export const updatePage: RequestHandler = async (req, res) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    if (!isValidObjectId(req.params["id"])) {
      res.status(400).json({ message: "Invalid page id" });
      return;
    }
    const page = await Page.findById(req.params["id"]);
    if (!page) {
      res.status(404).json({ message: "Page not found" });
      return;
    }

    const previousPublicIds = page.attachments.map(({ publicId }) => publicId);
    const keepIds = normalizeKeepAttachments(req.body.keepAttachments, page.attachments);
    const keptAttachments = page.attachments.filter(({ publicId }) => keepIds.has(publicId));
    const newAttachments = uploadedFiles(req).map((file): PageAttachment => ({
      url: file.path,
      publicId: file.filename,
      type: file.mimetype,
    }));
    const incomingStatus = req.body.status;
    if (incomingStatus !== undefined && !isPageStatus(incomingStatus)) {
      res.status(400).json({ message: "Invalid page status" });
      return;
    }

    const status = (incomingStatus ?? page.status) as PageRecord["status"];
    const publishedAt = status === "Draft"
      ? null
      : status === "Published" && (!page.publishedAt || page.publishedAt > new Date())
        ? new Date()
        : page.publishedAt;

    page.title = req.body.title ?? page.title;
    page.subTitle = req.body.subTitle ?? page.subTitle;
    page.slug = req.body.slug ?? page.slug;
    page.body = req.body.body ?? page.body;
    page.author = typeof req.body.author === "string" ? req.body.author.trim() : page.author;
    if (req.body.showAuthor !== undefined) {
      page.showAuthor = req.body.showAuthor === true || req.body.showAuthor === "true";
    }
    page.status = status;
    page.publishedAt = publishedAt;
    page.modifiedBy = new Types.ObjectId(req.user.id);
    page.attachments = [...keptAttachments, ...newAttachments];
    await page.save();

    const removedIds = previousPublicIds.filter((publicId) => !keepIds.has(publicId));
    const updatedPage = await Page.findById(page._id)
      .populate("createdBy", "name")
      .populate("modifiedBy", "name");
    res.json(updatedPage);
    await removeCloudinaryAssets(removedIds);
  } catch (error) {
    console.error("UPDATE PAGE ERROR:", error);
    res.status(500).json({ message: "Update failed" });
  }
};

export const getPages: RequestHandler = async (req, res) => {
  try {
    const searchValue = req.query["search"];
    const statusValue = req.query["status"];
    const authorValue = req.query["author"];
    const search = typeof searchValue === "string" ? searchValue.trim() : "";
    const status = typeof statusValue === "string" ? statusValue : "All";
    const author = typeof authorValue === "string" ? authorValue : "All";
    const requestedPage = Number(req.query["page"]) || 1;
    const requestedLimit = Number(req.query["limit"]) || 10;
    const pageNumber = Math.max(1, Math.floor(requestedPage));
    const limit = Math.min(100, Math.max(1, Math.floor(requestedLimit)));
    const query: FilterQuery<PageRecord> = {};

    if (search) query.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (status !== "All") {
      if (!isPageStatus(status)) {
        res.status(400).json({ message: "Invalid page status filter" });
        return;
      }
      query.status = status;
    }
    if (author !== "All") {
      const matchingUsers = await User.find({ name: author }).distinct("_id");
      query.createdBy = { $in: matchingUsers };
    }

    const skip = (pageNumber - 1) * limit;
    const [pages, total] = await Promise.all([
      Page.find(query)
        .populate("createdBy", "name")
        .populate("modifiedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Page.countDocuments(query),
    ]);

    res.json({ data: pages, pagination: { total, page: pageNumber, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    console.error("GET PAGES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch pages" });
  }
};

export const getPage: RequestHandler = async (req, res) => {
  try {
    if (!isValidObjectId(req.params["id"])) {
      res.status(400).json({ message: "Invalid page id" });
      return;
    }
    const page = await Page.findById(req.params["id"])
      .populate("createdBy", "name")
      .populate("modifiedBy", "name");
    if (!page) {
      res.status(404).json({ message: "Page not found" });
      return;
    }
    res.json(page);
  } catch (error) {
    console.error("GET PAGE ERROR:", error);
    res.status(500).json({ message: "Failed to fetch page" });
  }
};

export const deletePage: RequestHandler = async (req, res) => {
  try {
    if (!isValidObjectId(req.params["id"])) {
      res.status(400).json({ message: "Invalid page id" });
      return;
    }
    const page = await Page.findById(req.params["id"]);
    if (!page) {
      res.status(404).json({ message: "Page not found" });
      return;
    }
    await Page.findByIdAndDelete(req.params["id"]);
    res.json({ message: "Page deleted successfully" });
    await removeCloudinaryAssets(page.attachments.map(({ publicId }) => publicId));
  } catch (error) {
    console.error("DELETE PAGE ERROR:", error);
    res.status(500).json({ message: "Failed to delete page" });
  }
};

export const schedulePage: RequestHandler = async (req, res) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    if (!isValidObjectId(req.params["id"])) {
      res.status(400).json({ message: "Invalid page id" });
      return;
    }
    const publishAt = req.body.publishAt;
    let date: Date | null = null;
    if (publishAt !== null && publishAt !== undefined && publishAt !== "") {
      date = new Date(publishAt);
      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
        res.status(400).json({ message: "Publish date must be in the future" });
        return;
      }
    }

    const page = await Page.findByIdAndUpdate(
      req.params["id"],
      { publishedAt: date, status: date ? "Scheduled" : "Draft", modifiedBy: req.user.id },
      { new: true, runValidators: true },
    ).populate("createdBy", "name").populate("modifiedBy", "name");
    if (!page) {
      res.status(404).json({ message: "Page not found" });
      return;
    }
    res.json(page);
  } catch (error) {
    console.error("SCHEDULE PAGE ERROR:", error);
    res.status(500).json({ message: "Failed to schedule page" });
  }
};
