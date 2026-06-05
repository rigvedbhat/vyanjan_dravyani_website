import { deleteFromCloudinary, publicIdFromUrl, uploadToCloudinary } from "@/lib/cloudinaryClient";
import { validateImageUpload } from "@/lib/security";

/**
 * Upload an image file to Cloudinary under the given folder.
 * Returns the secure URL of the uploaded image.
 */
export async function saveImageUpload(file: File, folder: string): Promise<string> {
  // Validate file type & size (reuse existing security layer)
  validateImageUpload(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadToCloudinary(buffer, folder);
  return url;
}

/**
 * Delete an image from Cloudinary by its URL.
 */
export async function deleteAsset(imageUrl: string): Promise<void> {
  const publicId = publicIdFromUrl(imageUrl);
  if (publicId) {
    await deleteFromCloudinary(publicId);
  }
}

/**
 * No-op for Cloudinary — folders are created implicitly on upload.
 */
export async function ensureProductAssetFolders(_slug: string): Promise<void> {
  // Cloudinary creates folder paths implicitly during upload.
}

/**
 * Build the Cloudinary folder path for product images.
 */
export function productImageFolder(slug: string): string {
  return `vyanjan/products/${slug}`;
}

/**
 * Build the Cloudinary folder path for use case images.
 */
export function useCaseImageFolder(slug: string): string {
  return `vyanjan/use-cases/${slug}`;
}

/**
 * Build the Cloudinary folder path for review images.
 */
export function reviewImageFolder(slug: string): string {
  return `vyanjan/products/${slug}/reviews`;
}
