import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import { AppError } from "@/core/errors/index.js";
import { getEmailProvider, verifyEmailTemplate } from "@/integrations/email/index.js";
import { authRepository } from "./auth.repository.js";

const SALT_ROUNDS = 12;
const secret = new TextEncoder().encode(env.JWT_SECRET);

function signTokens(userId: string, email: string) {
  const now = Math.floor(Date.now() / 1000);

  const accessToken = new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt(now)
    .setExpirationTime(now + 15 * 60) // 15 min
    .sign(secret);

  const refreshToken = new SignJWT({ type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt(now)
    .setExpirationTime(now + 7 * 24 * 60 * 60) // 7 days
    .sign(secret);

  return Promise.all([accessToken, refreshToken]);
}

function signVerificationToken(userId: string, email: string) {
  return new SignJWT({ email, type: "email_verify" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

async function sendVerificationEmail(userId: string, email: string) {
  const emailProvider = getEmailProvider();
  if (!emailProvider) {
    logger.warn("no email provider configured; skipping verification email");
    return;
  }

  const token = await signVerificationToken(userId, email);
  const siteUrl = env.SITE_URL;
  const verifyUrl = `${siteUrl}/auth/verify?token=${token}`;
  const { subject, html } = verifyEmailTemplate({ verifyUrl });

  try {
    await emailProvider.sendHtml({ to: { email }, subject, html });
    logger.info({ userId }, "verification email sent");
  } catch (err) {
    logger.error({ err: String(err), userId }, "verification email failed");
  }
}

export const authService = {
  register: async (input: { email: string; password: string; handle?: string }) => {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) throw new AppError("Email already registered", 409);

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const profile = await authRepository.create({
      email: input.email,
      passwordHash,
      handle: input.handle,
    });

    const [accessToken, refreshToken] = await signTokens(profile.id, profile.email);

    sendVerificationEmail(profile.id, profile.email).catch(() => {});

    return { profile, accessToken, refreshToken };
  },

  login: async (input: { email: string; password: string }) => {
    const profile = await authRepository.findByEmail(input.email);
    if (!profile || !profile.passwordHash) {
      throw new AppError("Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(input.password, profile.passwordHash);
    if (!valid) throw new AppError("Invalid email or password", 401);

    if (!profile.emailVerified) {
      throw new AppError("Please verify your email before logging in", 403);
    }

    const [accessToken, refreshToken] = await signTokens(profile.id, profile.email);

    const { passwordHash: _, ...safe } = profile;
    return { profile: safe, accessToken, refreshToken };
  },

  refresh: async (userId: string) => {
    const profile = await authRepository.findById(userId);
    if (!profile) throw new AppError("User not found", 401);

    const [accessToken, refreshToken] = await signTokens(profile.id, profile.email);
    return { accessToken, refreshToken };
  },

  verifyEmail: async (token: string) => {
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.type !== "email_verify" || !payload.sub) {
        throw new AppError("Invalid verification token", 400);
      }
      await authRepository.markEmailVerified(payload.sub);
      return { verified: true };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Invalid or expired verification token", 400);
    }
  },

  serviceToken: async (serviceSecret: string) => {
    if (!env.SERVICE_TOKEN_SECRET) {
      throw new AppError("Service tokens not configured", 503);
    }
    if (serviceSecret !== env.SERVICE_TOKEN_SECRET) {
      throw new AppError("Invalid service secret", 401);
    }

    const profile = await authRepository.findByEmail("tradevantage.gg@gmail.com");
    if (!profile) throw new AppError("Service account not found", 500);

    const now = Math.floor(Date.now() / 1000);
    const accessToken = await new SignJWT({ email: profile.email })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(profile.id)
      .setIssuedAt(now)
      .setExpirationTime(now + 24 * 60 * 60)
      .sign(secret);

    return { accessToken };
  },

  resendVerification: async (userId: string) => {
    const profile = await authRepository.findById(userId);
    if (!profile) throw new AppError("User not found", 404);
    if (profile.emailVerified) throw new AppError("Email already verified", 400);

    await sendVerificationEmail(profile.id, profile.email);
    return { sent: true };
  },
};
