import fs from "node:fs/promises";
import path from "node:path";
import type { ContactInquiry, Product, ProductReview } from "@/types/product";
import { sanitizeProductInput, sortByOrder } from "@/lib/security";

const productsFile = path.join(process.cwd(), "data", "products.json");
const inquiriesFile = path.join(process.cwd(), "data", "inquiries.json");

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
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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
  const cleanProducts = products.map((product) => sanitizeProductInput(product));
  await writeJson(productsFile, cleanProducts);
  return cleanProducts;
}

export async function createProduct(payload: Partial<Product>) {
  const products = await getProducts();
  const product = sanitizeProductInput(payload);
  if (products.some((item) => item.slug === product.slug)) {
    throw new Error("A product with this slug already exists.");
  }

  const nextProducts = [...products, product];
  await saveProducts(nextProducts);
  return product;
}

export async function updateProduct(id: string, payload: Partial<Product>) {
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
  await saveProducts(nextProducts);
  return nextProduct;
}

export async function deleteProduct(id: string) {
  const products = await getProducts();
  const nextProducts = products.filter((product) => product.id !== id);
  if (nextProducts.length === products.length) {
    throw new Error("Product not found.");
  }

  await saveProducts(nextProducts);
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
  const inquiries = await getInquiries();
  const nextInquiries = [inquiry, ...inquiries].slice(0, 200);
  await writeJson(inquiriesFile, nextInquiries);
  return inquiry;
}

export async function addReviewToProduct(slug: string, review: ProductReview) {
  const products = await getProducts();
  const index = products.findIndex((product) => product.slug === slug && product.visible);
  if (index === -1) {
    throw new Error("Product not found.");
  }

  const product = products[index];
  const nextProduct = {
    ...product,
    reviews: [...product.reviews, review]
  };

  const nextProducts = [...products];
  nextProducts[index] = nextProduct;
  await saveProducts(nextProducts);
  return nextProduct;
}
