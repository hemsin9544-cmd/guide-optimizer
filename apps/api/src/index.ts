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
// Load env vars FIRST
dotenv.config();

// Create PostgreSQL connection pool
const connectionString =
  process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL || "";

// Check if we have a connection string
if (!connectionString) {
  console.error("ERROR: No DATABASE_URL or DATABASE_PUBLIC_URL set!");
  process.exit(1);
}

// Parse URL to check for SSL params
try {
  const url = new URL(connectionString);
  console.log("DB Host:", url.hostname);
  console.log("DB Port:", url.port);
  console.log("DB has sslmode:", url.searchParams.has("sslmode"));
} catch (e) {
  console.log("Failed to parse DB URL");
}

// Create pool
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Create Prisma client WITH the adapter (required in Prisma 7)
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
// Start server
// ... (imports and setup code)

// Remove this old line (around line 54):
// const PORT = 3001;

// ... (middleware, routes, etc.)

// Keep this at the bottom (around line 103):
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});

export default app;
