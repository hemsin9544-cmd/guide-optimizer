import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export class JWTService {
  private secret: string;
  private expiresIn = "7d";

  constructor(secret: string) {
    this.secret = secret;
  }

  sign(payload: JWTPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): JWTPayload {
    return jwt.verify(token, this.secret) as JWTPayload;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
