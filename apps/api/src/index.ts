import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import {
  JWTService,
  createAuthRouter,
  createAuthMiddleware,
  AuthRequest,
} from "./auth";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const jwtService = new JWTService(process.env.JWT_SECRET || "fallback-secret");

const PORT = process.env.PORT || 3001;

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});

export default app;
