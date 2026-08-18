import { NextRequest, NextResponse } from "next/server";

import { isValidUsername } from "@/lib/accounts";
import { queryWithRetry, prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  if (!isValidUsername(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    const user = await queryWithRetry(() =>
      prisma.winUser.findUnique({ where: { username } })
    );
    if (!user || !verifyPassword(body.password ?? "", (user as any).passwordHash)) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    await setSessionCookie({
      username: (user as any).username,
      avatar: (user as any).avatar,
      memberSince: (user as any).memberSince.toISOString(),
    });

    return NextResponse.json({ ok: true, user: { username: (user as any).username } });
  } catch (err) {
    console.error("[signin] failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Sign in failed, please try again" },
      { status: 500 }
    );
  }
}
