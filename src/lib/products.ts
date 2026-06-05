import fs from "node:fs/promises";
import path from "node:path";
import type { ContactInquiry, Product, ProductReview } from "@/types/product";
import { sanitizeProductInput, sortByOrder } from "@/lib/security";

const productsFile = path.join(process.cwd(), "data", "products.json");
const inquiriesFile = path.join(process.cwd(), "data", "inquiries.json");
const backupsDir = path.join(process.cwd(), "data", "backups");

// ── Write mutex ──
// Serializes all file writes so concurrent requests (two admin tabs,
// admin save + customer review submit) can never clobber each other.
// Each write waits for the previous one to finish before starting.
let writeChain = Promise.resolve();

function serializedWrite<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeChain.then(fn, fn); // run fn regardless of prior rejection
  writeChain = next.then(() => {}, () => {}); // swallow to keep chain alive
  return next;
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

async function writeJson<T>(filePath: string, value: T) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  // Write to a temp file first, then rename for atomic replacement.
  // This prevents a crash mid-write from corrupting the file.
  const tmpFile = `${filePath}.tmp`;
  await fs.writeFile(tmpFile, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tmpFile, filePath);
}

// ── Backup helper ──
// Called before destructive writes. Keeps last 10 timestamped copies.
const MAX_BACKUPS = 10;

async function backupProducts() {
  try {
    await fs.mkdir(backupsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupsDir, `products-${timestamp}.json`);
    await fs.copyFile(productsFile, backupFile);

    // Prune old backups beyond MAX_BACKUPS
    const files = (await fs.readdir(backupsDir))
      .filter((f) => f.startsWith("products-") && f.endsWith(".json"))
      .sort();
    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(0, files.length - MAX_BACKUPS);
      await Promise.all(toDelete.map((f) => fs.unlink(path.join(backupsDir, f)).catch(() => {})));
    }
  } catch {
    // Backup failure should never block an actual save
  }
}

export async function getProducts() {
  const products = await readJson<Product[]>(productsFile, []);
  return products.map((product) => sanitizeProductInput(product));
}

export async function getVisibleProducts() {
  const products = await getProducts();
  return products.filter((product) => product.visible);
}

export async function getFeaturedProducts() {
  const products = await getVisibleProducts();
  const featured = products.filter((product) => product.featured);
  return featured.length > 0 ? featured.slice(0, 3) : products.slice(0, 3);
}

export async function getProductBySlug(slug: string) {
  const products = await getVisibleProducts();
  return products.find((product) => product.slug === slug);
}

export async function getAdminProductById(id: string) {
  const products = await getProducts();
  return products.find((product) => product.id === id);
}

export async function saveProducts(products: Product[]) {
  return serializedWrite(async () => {
    await backupProducts();
    const cleanProducts = products.map((product) => sanitizeProductInput(product));
    await writeJson(productsFile, cleanProducts);
    return cleanProducts;
  });
}

export async function createProduct(payload: Partial<Product>) {
  return serializedWrite(async () => {
    const products = await getProducts();
    const product = sanitizeProductInput(payload);
    if (products.some((item) => item.slug === product.slug)) {
      throw new Error("A product with this slug already exists.");
    }

    const nextProducts = [...products, product];
    await writeJson(productsFile, nextProducts.map((p) => sanitizeProductInput(p)));
    return product;
  });
}

export async function updateProduct(id: string, payload: Partial<Product>) {
  return serializedWrite(async () => {
    await backupProducts();
    const products = await getProducts();
    const index = products.findIndex((product) => product.id === id);
    if (index === -1) {
      throw new Error("Product not found.");
    }

    const nextProduct = sanitizeProductInput(payload, products[index]);
    const duplicateSlug = products.some((product) => product.id !== id && product.slug === nextProduct.slug);
    if (duplicateSlug) {
      throw new Error("A product with this slug already exists.");
    }

    const nextProducts = [...products];
    nextProducts[index] = nextProduct;
    await writeJson(productsFile, nextProducts);
    return nextProduct;
  });
}

export async function deleteProduct(id: string) {
  return serializedWrite(async () => {
    await backupProducts();
    const products = await getProducts();
    const nextProducts = products.filter((product) => product.id !== id);
    if (nextProducts.length === products.length) {
      throw new Error("Product not found.");
    }

    await writeJson(productsFile, nextProducts);
  });
}

export async function reorderProductImages(id: string, ids: string[], imageType: "gallery" | "useCases") {
  const product = await getAdminProductById(id);
  if (!product) {
    throw new Error("Product not found.");
  }

  if (imageType === "gallery") {
    const sorted = [...product.galleryImages].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    return updateProduct(id, {
      ...product,
      galleryImages: sortByOrder(sorted.map((image, index) => ({ ...image, order: index + 1 })))
    });
  }

  const sorted = [...product.useCases].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return updateProduct(id, {
    ...product,
    useCases: sortByOrder(sorted.map((useCase, index) => ({ ...useCase, order: index + 1 })))
  });
}

export async function getInquiries() {
  return readJson<ContactInquiry[]>(inquiriesFile, []);
}

export async function addInquiry(inquiry: ContactInquiry) {
  return serializedWrite(async () => {
    const inquiries = await getInquiries();
    const nextInquiries = [inquiry, ...inquiries].slice(0, 200);
    await writeJson(inquiriesFile, nextInquiries);
    return inquiry;
  });
}

export async function addReviewToProduct(slug: string, review: ProductReview) {
  return serializedWrite(async () => {
    await backupProducts();
    const products = await getProducts();
    const index = products.findIndex((product) => product.slug === slug && product.visible);
    if (index === -1) {
      throw new Error("Product not found.");
    }

    const product = products[index];
    const nextProduct = sanitizeProductInput({
      ...product,
      reviews: [...product.reviews, review]
    });

    const nextProducts = [...products];
    nextProducts[index] = nextProduct;
    await writeJson(productsFile, nextProducts);
    return nextProduct;
  });
}
