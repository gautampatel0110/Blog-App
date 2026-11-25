import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import { MulterError } from "multer";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";
import mongoose from "mongoose";
import { Server as SocketServer } from "socket.io";
import connectDB from "./config/db";
import { startPublishingCron } from "./cron/publish.cron";
import authRoutes from "./routes/auth.routes";
import pageRoutes from "./routes/page.routes";
import publicRoutes from "./routes/public.routes";
import type { ScheduledTask } from "node-cron";

export const app = express();
export const httpServer = createServer(app);

const defaultOrigins = ["http://localhost:5173", "http://localhost:5174"];
const allowedOrigins = (process.env.CLIENT_ORIGINS ?? defaultOrigins.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const io = new SocketServer(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
});

// Azure App Service sits behind a proxy; trust it so rate limiting sees real client IPs.
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

/** Commit hash written by CI into dist/build-info.json; lets the pipeline confirm the new code is live. */
function readBuildCommit(): string {
  try {
    const info = JSON.parse(readFileSync(join(__dirname, "build-info.json"), "utf8")) as { commit?: string };
    return info.commit ?? "local";
  } catch {
    return "local";
  }
}
const buildCommit = readBuildCommit();

app.get("/api/health", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "degraded",
    database: connected ? "connected" : "disconnected",
    commit: buildCommit,
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/public", publicRoutes);

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "Not found" });
});

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Each file must be 10 MB or smaller"
      : error.code === "LIMIT_FILE_COUNT"
        ? "You can upload at most 10 files at a time"
        : error.message;
    res.status(400).json({ message });
    return;
  }
  if (error instanceof Error && error.message.startsWith("Unsupported file type")) {
    res.status(400).json({ message: error.message });
    return;
  }
  console.error("UNHANDLED ERROR:", error);
  res.status(500).json({ message: "Something went wrong" });
};
app.use(errorHandler);

let publishingTask: ScheduledTask | undefined;

async function startServer(): Promise<void> {
  await connectDB();
  publishingTask = startPublishingCron(io);
  const port = Number(process.env.PORT ?? 5000);
  httpServer.listen(port, () => console.info(`Server running on port ${port}`));
}

async function shutdown(signal: string): Promise<void> {
  console.info(`${signal} received; shutting down`);
  publishingTask?.stop();
  await new Promise<void>((resolve) => io.close(() => resolve()));
  await mongoose.disconnect();
}

process.once("SIGINT", () => { void shutdown("SIGINT").then(() => process.exit(0)); });
process.once("SIGTERM", () => { void shutdown("SIGTERM").then(() => process.exit(0)); });

void startServer().catch((error: unknown) => {
  console.error("Backend startup failed:", error);
  process.exitCode = 1;
});
