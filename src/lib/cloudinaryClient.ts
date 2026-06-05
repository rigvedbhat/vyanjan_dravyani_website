import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export { cloudinary };

/**
 * Upload a buffer to Cloudinary and return the secure URL.
 * @param buffer The file buffer to upload
 * @param folder The Cloudinary folder path, e.g. "vyanjan/products/goda-masala"
 * @param publicId Optional public ID for the image (without extension)
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      folder,
      resource_type: "image",
      overwrite: true
    };

    if (publicId) {
      options.public_id = publicId;
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(new Error(error.message));
      } else if (result) {
        resolve(result.secure_url);
      } else {
        reject(new Error("Upload failed."));
      }
    });

    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by its public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

/**
 * Derive Cloudinary public ID from a secure URL.
 * e.g., "https://res.cloudinary.com/xxx/image/upload/v123/vyanjan/products/slug/file.jpg"
 * → "vyanjan/products/slug/file"
 */
export function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
  return match?.[1] ?? null;
}
