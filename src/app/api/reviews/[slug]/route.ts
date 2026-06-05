import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { reviewImageFolder, saveImageUpload } from "@/lib/adminAssets";
import { addReviewToProduct, getProductBySlug } from "@/lib/products";
import { makeId, rateLimit, sanitizeText, clampRating } from "@/lib/security";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`review:${ip}`, 3, 30 * 60 * 1000)) {
    return NextResponse.json({ message: "Too many reviews. Please try again later." }, { status: 429 });
  }

  const product = await getProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ message: "Product not found." }, { status: 404 });
  }

  let body: FormData;
  try {
    body = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const name = sanitizeText(body.get("name"), 80);
  const text = sanitizeText(body.get("text"), 600);
  const rating = clampRating(body.get("rating"));

  if (!name || !text || rating < 1) {
    return NextResponse.json({ message: "Name, review text, and a rating (1–5) are required." }, { status: 400 });
  }

  const imageUrls: string[] = [];

  const imageFiles = body.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
  if (imageFiles.length > 3) {
    return NextResponse.json({ message: "Maximum 3 images allowed." }, { status: 400 });
  }

  if (imageFiles.length > 0) {
    const folder = reviewImageFolder(slug);

    for (const file of imageFiles) {
      try {
        const url = await saveImageUpload(file, folder);
        imageUrls.push(url);
      } catch (error) {
        return NextResponse.json(
          { message: error instanceof Error ? error.message : "Image upload failed." },
          { status: 400 }
        );
      }
    }
  }

  await addReviewToProduct(slug, {
    id: makeId("rev"),
    customerName: name,
    rating,
    text,
    images: imageUrls.length > 0 ? imageUrls : undefined,
    approved: false,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({
    message: "Thank you for your review! It will appear after approval."
  });
}
