import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { JWTService, createAuthRouter, createAuthMiddleware } from "./auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const jwtService = new JWTService(process.env.JWT_SECRET!);

// Add auth routes
app.use("/auth", createAuthRouter(prisma, jwtService));

// Protect routes
const auth = createAuthMiddleware(jwtService);
app.get("/api/protected", auth, (req: AuthRequest, res) => {
  res.json({ message: "Hello", user: req.user });
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/me", auth, async (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

app.get("/api/projects", auth, async (req: AuthRequest, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.user!.userId },
  });
  res.json(projects);
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.json({ message: "Guide Optimizer API", version: "1.0.0" });
});

export default app;
