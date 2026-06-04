import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { attachSessionCookie, createSessionToken, isAuthConfigured, verifyCredentials } from "@/lib/auth";
import { rateLimit, sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ message: "Too many login attempts. Try again later." }, { status: 429 });
  }

  if (!isAuthConfigured()) {
    return NextResponse.json({ message: "Admin credentials are not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const username = sanitizeText(body?.username, 120);
  const password = String(body?.password ?? "");

  if (!verifyCredentials(username, password)) {
    return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ message: "Logged in." });
  attachSessionCookie(response, createSessionToken(username));
  return response;
}
