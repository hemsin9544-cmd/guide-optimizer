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
import { createCrawlerRouter } from "./crawler/crawler-router";
import { createCrawlWorker } from "./crawler/job-queue";

// Load env vars FIRST
dotenv.config();

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Create Prisma client WITH the adapter (required in Prisma 7)
const prisma = new PrismaClient({ adapter });

const jwtService = new JWTService(process.env.JWT_SECRET || "fallback-secret");

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - Allow frontend domain
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["http://localhost:5173", "https://guide-optimizer.vercel.app"];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Auth routes (public)
app.use("/auth", createAuthRouter(prisma, jwtService));

// Crawler routes (protected)
app.use("/api", createCrawlerRouter(prisma, jwtService));

// Auth middleware instance
const auth = createAuthMiddleware(jwtService);

// Public health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Protected routes
app.get("/api/me", auth, async (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

app.get("/api/projects", auth, async (req: AuthRequest, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.user!.userId },
  });
  res.json(projects);
});

// Start crawl worker
const crawlWorker = createCrawlWorker(prisma);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await crawlWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`🕷️  Crawl worker started`);
});

export default app;
