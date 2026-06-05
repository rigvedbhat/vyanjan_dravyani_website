/**
 * Migration script: products.json → Firestore
 *
 * Reads the existing data/products.json and data/inquiries.json files
 * and uploads all documents to Firestore.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-firebase.ts
 *
 * Prerequisites:
 *   - .env.local must have FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *   - Firestore must be enabled in the Firebase console
 */

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import fs from "node:fs/promises";
import path from "node:path";

let db: Firestore;

async function loadEnvAndInit() {
  // Load .env.local manually (no dotenv dependency)
  const envContent = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }

  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    })
  });

  db = getFirestore(app);
}


interface ProductData {
  id: string;
  [key: string]: unknown;
}

interface InquiryData {
  id: string;
  [key: string]: unknown;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

async function migrateProducts() {
  const productsFile = path.join(process.cwd(), "data", "products.json");

  let products: ProductData[];
  try {
    products = await readJsonFile<ProductData[]>(productsFile);
  } catch {
    console.log("⚠️  No products.json found, skipping products migration.");
    return;
  }

  console.log(`📦 Migrating ${products.length} products to Firestore...`);

  const batch = db.batch();
  for (const product of products) {
    const { id, ...data } = product;
    batch.set(db.collection("products").doc(id), data);
    console.log(`   ✅ ${data.name ?? id}`);
  }

  await batch.commit();
  console.log(`✅ ${products.length} products migrated successfully!\n`);
}

async function migrateInquiries() {
  const inquiriesFile = path.join(process.cwd(), "data", "inquiries.json");

  let inquiries: InquiryData[];
  try {
    inquiries = await readJsonFile<InquiryData[]>(inquiriesFile);
  } catch {
    console.log("⚠️  No inquiries.json found, skipping inquiries migration.");
    return;
  }

  console.log(`📧 Migrating ${inquiries.length} inquiries to Firestore...`);

  const batch = db.batch();
  for (const inquiry of inquiries) {
    const { id, ...data } = inquiry;
    batch.set(db.collection("inquiries").doc(id), data);
  }

  await batch.commit();
  console.log(`✅ ${inquiries.length} inquiries migrated successfully!\n`);
}

async function verify() {
  console.log("🔍 Verifying migration...");

  const productsSnap = await db.collection("products").get();
  console.log(`   Products in Firestore: ${productsSnap.size}`);

  const inquiriesSnap = await db.collection("inquiries").get();
  console.log(`   Inquiries in Firestore: ${inquiriesSnap.size}`);

  console.log("\n🎉 Migration complete!");
  console.log("\n📋 Next steps:");
  console.log("   1. Set up a Cloudinary account at https://cloudinary.com");
  console.log("   2. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env.local");
  console.log("   3. Run `npm run dev` and test the admin dashboard");
  console.log("   4. Upload new images — they'll go to Cloudinary");
  console.log("   5. Existing images in public/assets/ will continue to work via local paths");
}

async function main() {
  await loadEnvAndInit();
  console.log("🚀 Starting Firebase migration...\n");

  await migrateProducts();
  await migrateInquiries();
  await verify();

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
