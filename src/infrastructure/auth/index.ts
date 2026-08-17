import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { IHasher, ITokenService, ISessionService, TokenPayload } from "@/application/ports";

const COOKIE_NAME = "auth_token";

// === Bcrypt Hasher ===
export class BcryptHasher implements IHasher {
  private readonly rounds = 12;

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.rounds);
  }

  async compare(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
}

// === JWT Token Service ===
export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: string = "7d";

  constructor() {
    this.secret = process.env.JWT_SECRET || "v8club-dev-secret-change-in-production";
  }

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  verify(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.secret) as TokenPayload;
    } catch {
      return null;
    }
  }
}

// === Cookie Session Service ===
export class CookieSessionService implements ISessionService {
  async set(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  }

  async clear(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  }

  async get(): Promise<TokenPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const tokenService = new JwtTokenService();
    return tokenService.verify(token);
  }
}
