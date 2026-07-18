import { Request, Response, NextFunction } from "express";
import { JWTService } from "./jwt-service";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export function createAuthMiddleware(jwtService: JWTService) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized - No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = jwtService.verify(token);
      req.user = payload;
      next();
    } catch (error) {
      res.status(401).json({ error: "Unauthorized - Invalid token" });
    }
  };
}
