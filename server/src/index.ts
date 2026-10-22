import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
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

app.use(cors({ origin: allowedOrigins, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: "connected" });
});
app.use("/api/auth", authRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/public", publicRoutes);

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
