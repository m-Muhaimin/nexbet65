import { NextRequest, NextResponse } from "next/server";

import { avatarFor, isValidPassword, isValidUsername } from "@/lib/accounts";
import { queryWithRetry } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string; ref?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  if (!isValidUsername(username)) {
    return NextResponse.json(
      { error: "Username must be 3-20 characters (letters, numbers, _ or .)" },
      { status: 400 }
    );
  }
  if (!isValidPassword(body.password ?? "")) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }
  const refCode = body.ref?.trim() ?? "";

  try {
    const user = await queryWithRetry(() =>
      prisma.$transaction(async (tx) => {
        const existing = await tx.winUser.findUnique({ where: { username } });
        if (existing) {
          const err = new Error("That username is already registered");
          (err as { code?: string }).code = "P2002";
          throw err;
        }

        // Bind the referral tree. The referral code is the referrer's username
        // (case-insensitive). Invalid/unknown codes are silently ignored rather
        // than blocking signup; self-referral is impossible (this user doesn't
        // exist yet at lookup time).
        let referredById: string | undefined;
        if (refCode) {
          const referrer = await tx.winUser.findFirst({
            where: {
              OR: [
                { username: refCode },
                { username: { equals: refCode, mode: "insensitive" } },
              ],
            },
            select: { id: true },
          });
          referredById = referrer?.id;
        }

        return tx.winUser.create({
          data: {
            username,
            passwordHash: hashPassword(body.password as string),
            avatar: avatarFor(username),
            referredById,
          },
        });
      })
    );

    await setSessionCookie({
      username: user.username,
      avatar: user.avatar,
      memberSince: user.memberSince.toISOString(),
    });

    return NextResponse.json({ ok: true, user: { username: user.username } });
  } catch (err) {
    if (
      (err as { code?: string }).code === "P2002" ||
      (err as Error).message === "That username is already registered"
    ) {
      return NextResponse.json(
        { error: "That username is already registered" },
        { status: 409 }
      );
    }
    console.error("[register] failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Registration failed, please try again" },
      { status: 500 }
    );
  }
}
