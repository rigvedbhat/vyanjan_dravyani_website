import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";
import type { ContactInquiry, Product, ProductReview } from "@/types/product";
import { sanitizeProductInput, sortByOrder } from "@/lib/security";

const productsCol = db.collection("products");
const inquiriesCol = db.collection("inquiries");

// ── Helpers ──

function docToProduct(doc: FirebaseFirestore.DocumentSnapshot): Product | null {
  if (!doc.exists) return null;
  const data = doc.data() as Omit<Product, "id">;
  return sanitizeProductInput({ ...data, id: doc.id });
}

// ── Read operations ──

export async function getProducts(): Promise<Product[]> {
  const snapshot = await productsCol.get();
  return snapshot.docs
    .map(docToProduct)
    .filter((product): product is Product => product !== null);
}

export async function getVisibleProducts(): Promise<Product[]> {
  const snapshot = await productsCol.where("visible", "==", true).get();
  return snapshot.docs
    .map(docToProduct)
    .filter((product): product is Product => product !== null);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getVisibleProducts();
  const featured = products.filter((product) => product.featured);
  return featured.length > 0 ? featured.slice(0, 3) : products.slice(0, 3);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const snapshot = await productsCol
    .where("slug", "==", slug)
    .where("visible", "==", true)
    .limit(1)
    .get();

  if (snapshot.empty) return undefined;
  return docToProduct(snapshot.docs[0]) ?? undefined;
}

export async function getAdminProductById(id: string): Promise<Product | undefined> {
  const doc = await productsCol.doc(id).get();
  return docToProduct(doc) ?? undefined;
}

// ── Write operations ──

export async function saveProducts(products: Product[]): Promise<Product[]> {
  const batch = db.batch();
  const cleanProducts = products.map((product) => sanitizeProductInput(product));

  for (const product of cleanProducts) {
    const { id, ...data } = product;
    batch.set(productsCol.doc(id), data);
  }

  await batch.commit();
  return cleanProducts;
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const product = sanitizeProductInput(payload);

  // Check slug uniqueness
  const existing = await productsCol.where("slug", "==", product.slug).limit(1).get();
  if (!existing.empty) {
    throw new Error("A product with this slug already exists.");
  }

  const { id, ...data } = product;
  await productsCol.doc(id).set(data);
  return product;
}

export async function updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  const doc = await productsCol.doc(id).get();
  if (!doc.exists) {
    throw new Error("Product not found.");
  }

  const current = docToProduct(doc);
  const nextProduct = sanitizeProductInput(payload, current ?? undefined);

  // Check slug uniqueness (exclude self)
  const slugCheck = await productsCol.where("slug", "==", nextProduct.slug).limit(2).get();
  const duplicateSlug = slugCheck.docs.some((d) => d.id !== id);
  if (duplicateSlug) {
    throw new Error("A product with this slug already exists.");
  }

  const { id: _id, ...data } = nextProduct;
  await productsCol.doc(id).set(data);
  return nextProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  const doc = await productsCol.doc(id).get();
  if (!doc.exists) {
    throw new Error("Product not found.");
  }

  await productsCol.doc(id).delete();
}

export async function reorderProductImages(
  id: string,
  ids: string[],
  imageType: "gallery" | "useCases"
): Promise<Product> {
  const product = await getAdminProductById(id);
  if (!product) {
    throw new Error("Product not found.");
  }

  if (imageType === "gallery") {
    const sorted = [...product.galleryImages].sort(
      (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)
    );
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

// ── Inquiries ──

export async function getInquiries(): Promise<ContactInquiry[]> {
  const snapshot = await inquiriesCol.orderBy("createdAt", "desc").limit(200).get();
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<ContactInquiry, "id">;
    return { ...data, id: doc.id } as ContactInquiry;
  });
}

export async function addInquiry(inquiry: ContactInquiry): Promise<ContactInquiry> {
  const { id, ...data } = inquiry;
  await inquiriesCol.doc(id).set(data);
  return inquiry;
}

// ── Reviews ──

export async function addReviewToProduct(slug: string, review: ProductReview): Promise<Product> {
  const snapshot = await productsCol
    .where("slug", "==", slug)
    .where("visible", "==", true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error("Product not found.");
  }

  const doc = snapshot.docs[0];
  const product = docToProduct(doc);
  if (!product) {
    throw new Error("Product not found.");
  }

  const nextProduct = sanitizeProductInput({
    ...product,
    reviews: [...product.reviews, review]
  });

  const { id: _id, ...data } = nextProduct;
  await productsCol.doc(doc.id).set(data);
  return nextProduct;
}
