
import { sendEmail } from './email';
import { storage } from '../storage';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';

export async function sendVerificationEmail(userId: string, email: string) {
  const token = crypto.randomBytes(32).toString('hex');
  
  await storage.db
    .update(users)
    .set({ verificationToken: token })
    .where(eq(users.id, userId));

  const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Verify your email',
    text: `Please verify your email by clicking: ${verificationUrl}`
  });
}

export async function verifyEmail(token: string) {
  const user = await storage.db
    .query.users.findFirst({
      where: eq(users.verificationToken, token)
    });

  if (!user) {
    throw new Error('Invalid verification token');
  }

  await storage.db
    .update(users)
    .set({ 
      isVerified: true,
      verificationToken: null 
    })
    .where(eq(users.id, user.id));

  return user;
}

export async function sendPasswordReset(email: string) {
  const user = await storage.db
    .query.users.findFirst({
      where: eq(users.email, email)
    });

  if (!user) {
    return; // Don't reveal if email exists
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // 1 hour expiry

  await storage.db
    .update(users)
    .set({ 
      resetToken: token,
      resetTokenExpiry: expiry
    })
    .where(eq(users.id, user.id));

  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Reset your password',
    text: `Reset your password by clicking: ${resetUrl}\nThis link expires in 1 hour.`
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await storage.db
    .query.users.findFirst({
      where: eq(users.resetToken, token)
    });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    throw new Error('Invalid or expired reset token');
  }

  await storage.db
    .update(users)
    .set({ 
      password: newPassword,
      resetToken: null,
      resetTokenExpiry: null
    })
    .where(eq(users.id, user.id));
}
