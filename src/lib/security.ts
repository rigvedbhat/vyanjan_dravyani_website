import path from "node:path";
import { randomBytes } from "node:crypto";
import type { Product, ProductImage, ProductReview, ProductUseCase } from "@/types/product";

const controlChars = /[\u0000-\u001f\u007f]/g;
const filenameChars = /[^a-zA-Z0-9._-]/g;

export function sanitizeText(value: unknown, maxLength = 1000) {
  return String(value ?? "")
    .replace(controlChars, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function slugify(value: unknown) {
  return sanitizeText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function sanitizeFilename(value: unknown) {
  const cleaned = path.basename(String(value ?? "")).replace(filenameChars, "-").slice(0, 120);
  return cleaned || `image-${Date.now()}`;
}

export function clampRating(value: unknown) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) {
    return 0;
  }

  return Math.min(5, Math.max(0, Math.round(rating)));
}

export function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
}

export function sortByOrder<T extends { order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order);
}

function sanitizeImage(image: Partial<ProductImage>, index: number): ProductImage {
  return {
    id: sanitizeText(image.id, 120) || makeId("img"),
    filename: sanitizeFilename(image.filename),
    alt: sanitizeText(image.alt, 160),
    order: Number.isFinite(Number(image.order)) ? Number(image.order) : index + 1
  };
}

function sanitizeUseCase(useCase: Partial<ProductUseCase>, index: number): ProductUseCase {
  return {
    id: sanitizeText(useCase.id, 120) || makeId("uc"),
    title: sanitizeText(useCase.title, 120),
    caption: sanitizeText(useCase.caption, 280),
    image: sanitizeFilename(useCase.image),
    alt: sanitizeText(useCase.alt, 160),
    order: Number.isFinite(Number(useCase.order)) ? Number(useCase.order) : index + 1
  };
}

function sanitizeReview(review: Partial<ProductReview>): ProductReview {
  return {
    id: sanitizeText(review.id, 120) || makeId("rev"),
    customerName: sanitizeText(review.customerName, 80),
    rating: clampRating(review.rating),
    text: sanitizeText(review.text, 600),
    approved: Boolean(review.approved),
    createdAt: sanitizeText(review.createdAt, 80) || new Date().toISOString()
  };
}

export function sanitizeProductInput(payload: Partial<Product>, fallback?: Product): Product {
  const name = sanitizeText(payload.name ?? fallback?.name, 120);
  const slug = slugify(payload.slug ?? fallback?.slug ?? name);
  if (!name || !slug) {
    throw new Error("Product name and slug are required.");
  }

  const specifications: Record<string, string> = {};
  const rawSpecs = payload.specifications ?? fallback?.specifications ?? {};
  for (const [key, value] of Object.entries(rawSpecs)) {
    const cleanKey = sanitizeText(key, 80);
    const cleanValue = sanitizeText(value, 240);
    if (cleanKey && cleanValue) {
      specifications[cleanKey] = cleanValue;
    }
  }

  const galleryImages = (payload.galleryImages ?? fallback?.galleryImages ?? []).map(sanitizeImage);
  const useCases = (payload.useCases ?? fallback?.useCases ?? []).map(sanitizeUseCase);
  const reviews = (payload.reviews ?? fallback?.reviews ?? []).map(sanitizeReview);
  const approvedReviews = reviews.filter((review) => review.approved && review.rating > 0);
  const rating =
    approvedReviews.length > 0
      ? Number(
          (
            approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length
          ).toFixed(1)
        )
      : clampRating(payload.rating ?? fallback?.rating);

  return {
    id: sanitizeText(payload.id ?? fallback?.id, 120) || makeId("prod"),
    name,
    slug,
    description: sanitizeText(payload.description ?? fallback?.description, 1200),
    specifications,
    coverImage: sanitizeFilename(payload.coverImage ?? fallback?.coverImage ?? ""),
    galleryImages: sortByOrder(galleryImages).map((image, index) => ({ ...image, order: index + 1 })),
    useCases: sortByOrder(useCases).map((useCase, index) => ({ ...useCase, order: index + 1 })),
    reviews,
    rating,
    visible: payload.visible ?? fallback?.visible ?? true,
    featured: payload.featured ?? fallback?.featured ?? false,
    badge: sanitizeText(payload.badge ?? fallback?.badge, 80) || undefined
  };
}

export function safeResolve(baseDir: string, filename: string) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, sanitizeFilename(filename));
  if (!resolvedTarget.startsWith(`${resolvedBase}${path.sep}`)) {
    throw new Error("Invalid file path.");
  }

  return resolvedTarget;
}

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"]
]);

export function validateImageUpload(file: File) {
  if (!file || file.size <= 0) {
    throw new Error("Please choose an image file.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const extension = allowedTypes.get(file.type);
  if (!extension) {
    throw new Error("Only JPG, PNG, WEBP, and GIF uploads are allowed.");
  }

  const originalName = sanitizeFilename(file.name).replace(/\.[^.]+$/, "");
  return `${originalName || "image"}-${Date.now()}.${extension}`;
}

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  return true;
}
