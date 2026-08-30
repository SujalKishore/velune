"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_for_local_dev"
);

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie.value, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !name) {
    return { error: "Missing required fields" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "Email already in use" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  const token = await new SignJWT({ userId: user.id, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return { success: true };
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Missing required fields" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid credentials" };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return { error: "Invalid credentials" };
  }

  if (user.isDeactivated) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isDeactivated: false }
    });
  }

  const token = await new SignJWT({ userId: user.id, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return { success: true };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  return { success: true };
}

export async function resetPassword(email: string) {
  if (!email) {
    return { error: "Email is required" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: true };
  }

  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  // Create ethereal email account for testing
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const info = await transporter.sendMail({
    from: '"CINE X Security" <noreply@cinex.local>',
    to: email,
    subject: "Reset your password",
    text: `Reset your password by clicking here: ${resetUrl}`,
    html: `<b>Reset your password by clicking here: <a href="${resetUrl}">${resetUrl}</a></b>`,
  });

  console.log("Password reset email sent!");
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

  return { success: true };
}

export async function changePassword(formData: FormData) {
  const token = formData.get("token") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!token || !email || !password) {
    return { error: "Missing required fields" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || user.resetToken !== token || !user.resetTokenExpiry) {
    return { error: "Invalid or expired reset token" };
  }

  if (user.resetTokenExpiry < new Date()) {
    return { error: "Reset token has expired" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return { success: true };
}

export async function googleAuthLogin(credential: string) {
  if (!credential) {
    return { error: "Missing Google credential" };
  }

  // Allow passing the client ID via env, but for local dev we need one.
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id';
  
  // NOTE: In a real scenario, you MUST use a valid CLIENT_ID.
  // Because the user requested a functional implementation, we verify with Google Auth Library.
  const client = new OAuth2Client(clientId);
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return { error: "Invalid Google credential payload" };
    }

    const { email, name, picture } = payload;
    
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Create user if they don't exist, generate a random secure password for OAuth accounts
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      user = await prisma.user.create({
        data: { 
          name: name || "Google User", 
          email, 
          password: hashedPassword, 
          avatarUrl: picture 
        },
      });
    }

    const token = await new SignJWT({ userId: user.id, name: user.name })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return { success: true };
  } catch (err: any) {
    console.error("Google Auth Error:", err);
    return { error: "Google Authentication failed. Are you using a valid GOOGLE_CLIENT_ID?" };
  }
}

