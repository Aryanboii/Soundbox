"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signUpSchema, requestPasswordResetSchema, resetPasswordSchema } from "@/lib/validation/auth";
import crypto from "crypto";

export async function signUp(input: unknown) {
  const { email, username, password } = signUpSchema.parse(input);

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    // Generic message — don't reveal which field collided (avoids
    // account enumeration).
    throw new Error("An account with that email or username already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: { email, username, passwordHash, displayName: username },
  });

  return { id: user.id, email: user.email, username: user.username };
}

export async function requestPasswordReset(input: unknown) {
  const { email } = requestPasswordResetSchema.parse(input);
  const user = await db.user.findUnique({ where: { email } });

  // Always return success regardless of whether the user exists —
  // prevents leaking which emails are registered.
  if (!user) return { ok: true };

  const token = crypto.randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min
    },
  });

  // TODO: wire to a transactional email provider (Resend/SES/Postmark).
  // Deliberately not implemented here — do not log tokens in production.
  console.log(`[dev only] Password reset token for ${email}: ${token}`);

  return { ok: true };
}

export async function resetPassword(input: unknown) {
  const { token, password } = resetPasswordSchema.parse(input);

  const resetToken = await db.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new Error("This reset link is invalid or has expired.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true };
}
