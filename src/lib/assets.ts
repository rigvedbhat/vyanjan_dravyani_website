import type { Product, ProductImage, ProductUseCase } from "@/types/product";

// Default fallback images — these stay in the local public/ folder
// since they ship with the deployment bundle and never change.
export const DEFAULT_PRODUCT_IMAGE = "/assets/products/default-cover.svg";
export const DEFAULT_USE_CASE_IMAGE = "/assets/use-cases/default.svg";

/**
 * Product images are now stored as full Cloudinary URLs in the database.
 * If the coverImage starts with "http", it's already a full URL.
 * Otherwise, fall back to the local asset path for legacy/migrated data.
 */
export function productCoverPath(product: Product): string {
  if (!product.coverImage) {
    return DEFAULT_PRODUCT_IMAGE;
  }

  if (product.coverImage.startsWith("http")) {
    return product.coverImage;
  }

  // Legacy: local path for images not yet migrated
  return `/assets/products/${encodeURIComponent(product.slug)}/${encodeURIComponent(product.coverImage)}`;
}

export function galleryImagePath(product: Product, image: ProductImage): string {
  if (!image.filename) {
    return DEFAULT_PRODUCT_IMAGE;
  }

  if (image.filename.startsWith("http")) {
    return image.filename;
  }

  return `/assets/products/${encodeURIComponent(product.slug)}/${encodeURIComponent(image.filename)}`;
}

export function useCaseImagePath(product: Product, useCase: ProductUseCase): string {
  if (!useCase.image || useCase.image === "default.svg") {
    return DEFAULT_USE_CASE_IMAGE;
  }

  if (useCase.image.startsWith("http")) {
    return useCase.image;
  }

  return `/assets/use-cases/${encodeURIComponent(product.slug)}/${encodeURIComponent(useCase.image)}`;
}

export function heroImagePath(filename: string): string {
  if (filename.startsWith("http")) {
    return filename;
  }

  return `/assets/hero/${encodeURIComponent(filename)}`;
}

export function brandingImagePath(filename: string): string {
  if (filename.startsWith("http")) {
    return filename;
  }

  return `/assets/branding/${encodeURIComponent(filename)}`;
}

export function reviewImagePath(slug: string, filename: string): string {
  if (filename.startsWith("http")) {
    return filename;
  }

  return `/assets/products/${encodeURIComponent(slug)}/reviews/${encodeURIComponent(filename)}`;
}
