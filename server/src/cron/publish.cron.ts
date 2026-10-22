import cron, { type ScheduledTask } from "node-cron";
import type { Server } from "socket.io";
import Page from "../models/Page";
import User from "../models/User";
import sendMail from "../utils/sendMail";
import { PAGE_PUBLISHED_EVENT } from "../socket/events";

export async function publishDuePages(io: Server): Promise<number> {
  const now = new Date();
  const duePages = await Page.find({ status: "Scheduled", publishedAt: { $lte: now } })
    .select("title slug publishedAt createdBy")
    .lean();
  let publishedCount = 0;

  for (const page of duePages) {
    try {
      const published = await Page.findOneAndUpdate(
        { _id: page._id, status: "Scheduled", publishedAt: { $lte: now } },
        { $set: { status: "Published" } },
        { new: true },
      ).select("title slug publishedAt createdBy");

      if (!published) continue;
      publishedCount += 1;

      const event = {
        pageId: published._id.toString(),
        title: published.title,
        slug: published.slug,
        publishedAt: published.publishedAt?.toISOString() ?? now.toISOString(),
      };
      io.emit(PAGE_PUBLISHED_EVENT, event);
      console.info(`Published scheduled page "${published.slug}"`);

      const author = await User.findById(published.createdBy).select("email").lean();
      if (author?.email) {
        const clientUrl = (process.env.CLIENT_URL ?? "http://localhost:5173").replace(/\/$/, "");
        await sendMail({
          to: author.email,
          subject: "Your blog is now live",
          html: `<h2>${published.title}</h2><p>Your blog has been successfully published.</p><a href="${clientUrl}/blog/${encodeURIComponent(published.slug)}">View Blog</a>`,
        });
      }
    } catch (error) {
      console.error(`Failed to finish publishing page ${page._id}:`, error);
    }
  }

  return publishedCount;
}

export function startPublishingCron(io: Server): ScheduledTask {
  const task = cron.schedule("* * * * *", async () => {
    try {
      const count = await publishDuePages(io);
      if (count === 0) {
        const [scheduledCount, nextPage] = await Promise.all([
          Page.countDocuments({ status: "Scheduled" }),
          Page.findOne({ status: "Scheduled", publishedAt: { $ne: null } })
            .sort({ publishedAt: 1 })
            .select("slug publishedAt")
            .lean(),
        ]);
        const nextPublishAt = nextPage?.publishedAt?.toISOString() ?? "none (missing publishedAt)";
        console.info(
          `Scheduled publishing check: published 0; ${scheduledCount} scheduled page(s); next publish at ${nextPublishAt}; server time ${new Date().toISOString()}`,
        );
      }
    } catch (error) {
      console.error("Scheduled publishing check failed:", error);
    }
  }, { noOverlap: true, timezone: process.env.CRON_TIMEZONE ?? "UTC" });

  console.info(`Scheduled publishing worker started (timezone: ${process.env.CRON_TIMEZONE ?? "UTC"})`);
  return task;
}
