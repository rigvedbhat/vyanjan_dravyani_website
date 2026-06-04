import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { addInquiry } from "@/lib/products";
import { makeId, rateLimit, sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ message: "Too many messages. Please try again later." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const name = sanitizeText(body.name, 80);
  const phone = sanitizeText(body.phone, 24);
  const message = sanitizeText(body.message, 600);

  if (!name || !phone || !message) {
    return NextResponse.json({ message: "Name, phone, and message are required." }, { status: 400 });
  }

  await addInquiry({
    id: makeId("inq"),
    name,
    phone,
    message,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({ message: "Thanks. We received your message." });
}
