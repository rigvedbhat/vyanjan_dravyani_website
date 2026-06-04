import fs from "node:fs/promises";
import path from "node:path";
import { safeResolve, validateImageUpload } from "@/lib/security";

export function productAssetDir(slug: string) {
  return path.join(process.cwd(), "public", "assets", "products", slug);
}

export function useCaseAssetDir(slug: string) {
  return path.join(process.cwd(), "public", "assets", "use-cases", slug);
}

export async function ensureProductAssetFolders(slug: string) {
  await Promise.all([
    fs.mkdir(productAssetDir(slug), { recursive: true }),
    fs.mkdir(useCaseAssetDir(slug), { recursive: true })
  ]);
}

export async function saveImageUpload(file: File, targetDir: string) {
  const filename = validateImageUpload(file);
  await fs.mkdir(targetDir, { recursive: true });
  const target = safeResolve(targetDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(target, buffer);
  return filename;
}

export async function deleteAsset(targetDir: string, filename: string) {
  const target = safeResolve(targetDir, filename);
  try {
    await fs.unlink(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
