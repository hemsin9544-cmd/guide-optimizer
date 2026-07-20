import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { JWTService } from "./jwt-service";
import { createAuthMiddleware, AuthRequest } from "./auth-middleware";

export function createAuthRouter(prisma: PrismaClient, jwtService: JWTService) {
  const router = Router();
  const authMiddleware = createAuthMiddleware(jwtService);

  // Register
  router.post("/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      console.log("Register attempt:", email);

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: "User already exists" });
        return;
      }

      const hashedPassword = await jwtService.hashPassword(password);
      console.log("Password hashed, creating user...");

      const user = await prisma.user.create({
        data: { email, name, password: hashedPassword },
      });
      console.log("User created:", user.id);

      const token = jwtService.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (error: any) {
      console.error("REGISTRATION ERROR:", error);
      console.error("STACK:", error.stack);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: "Registration failed", details: error.message });
      }
    }
  });

  // Login
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.password) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const valid = await jwtService.comparePassword(password, user.password);
      if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const token = jwtService.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Me (get current user)
  router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  return router;
}
