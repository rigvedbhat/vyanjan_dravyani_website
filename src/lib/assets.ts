import type { Product, ProductImage, ProductUseCase } from "@/types/product";

export const DEFAULT_PRODUCT_IMAGE = "/assets/products/default-cover.svg";
export const DEFAULT_USE_CASE_IMAGE = "/assets/use-cases/default.svg";

export function productAssetPath(slug: string, filename?: string) {
  if (!filename) {
    return DEFAULT_PRODUCT_IMAGE;
  }

  return `/assets/products/${encodeURIComponent(slug)}/${encodeURIComponent(filename)}`;
}

export function productCoverPath(product: Product) {
  return productAssetPath(product.slug, product.coverImage);
}

export function galleryImagePath(product: Product, image: ProductImage) {
  return productAssetPath(product.slug, image.filename);
}

export function useCaseImagePath(product: Product, useCase: ProductUseCase) {
  if (!useCase.image || useCase.image === "default.svg") {
    return DEFAULT_USE_CASE_IMAGE;
  }

  return `/assets/use-cases/${encodeURIComponent(product.slug)}/${encodeURIComponent(useCase.image)}`;
}

export function heroImagePath(filename: string) {
  return `/assets/hero/${encodeURIComponent(filename)}`;
}

export function brandingImagePath(filename: string) {
  return `/assets/branding/${encodeURIComponent(filename)}`;
}
