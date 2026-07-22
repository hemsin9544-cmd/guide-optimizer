// ============================================
// apps/api/src/index.ts (Updated with Crawler)
// ============================================
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  JWTService,
  createAuthRouter,
  createAuthMiddleware,
  AuthRequest,
} from "./auth";
import { createCrawlerRouter, createCrawlWorker } from "./crawler";
import { createAnalyzeRouter } from "./ai/ai-router";

// Load env vars FIRST
dotenv.config();

// ============================================
// DEBUG LOGGING
// ============================================
console.log("=== STARTUP DEBUG ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);
console.log("REDIS_URL exists:", !!process.env.REDIS_URL);
console.log("===================");

// Catch all uncaught errors
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  console.error("STACK:", err.stack);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION at:", promise, "reason:", reason);
});

// ============================================
// Database connection
// ============================================
const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) {
  console.error("ERROR: No DATABASE_URL set!");
  process.exit(1);
}
let usePublicUrl = false;
try {
  const url = new URL(connectionString);
  console.log("DB Host:", url.hostname);
  console.log("DB Port:", url.port);
  console.log("DB has sslmode:", url.searchParams.has("sslmode"));
  usePublicUrl = !url.hostname.endsWith(".railway.internal");
} catch (e) {
  console.log("Failed to parse DB URL");
}

// Private network (*.railway.internal) => no SSL
// Public URL => SSL required
const pool = new Pool({
  connectionString,
  ssl: usePublicUrl ? { rejectUnauthorized: false } : false,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const jwtService = new JWTService(process.env.JWT_SECRET || "fallback-secret");

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Auth routes (public)
app.use("/auth", createAuthRouter(prisma, jwtService));

// Auth middleware instance
const auth = createAuthMiddleware(jwtService);

// Public health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Protected routes (require JWT)
app.get("/api/me", auth, async (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

app.get("/api/projects", auth, async (req: AuthRequest, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.user!.userId },
  });
  res.json(projects);
});

// Test database connectivity
app.get("/test-db", async (req, res) => {
  try {
    console.log("TEST-DB: Attempting user.count()");
    const count = await prisma.user.count();
    console.log("TEST-DB: Success, count =", count);
    res.json({
      status: "ok",
      userCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("TEST-DB ERROR:", error);
    console.error("TEST-DB STACK:", error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Crawl routes (protected)
app.use("/api", createCrawlerRouter(prisma, jwtService));
app.use("/api", createAnalyzeRouter(prisma, jwtService));

// Start the background worker to process crawl jobs
const crawlWorker = createCrawlWorker(prisma);
console.log("🔧 Crawl worker started");

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
app.get("/debug-db-url", (req, res) => {
  const url = process.env.DATABASE_URL || "NOT SET";
  res.json({
    host: url.match(/@([^:]+):/)?.[1] || "unknown",
    port: url.match(/:(\d+)\//)?.[1] || "unknown",
    hasSslParam: url.includes("sslmode"),
  });
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API server running on http://0.0.0.0:${PORT}`);
});

export default app;
