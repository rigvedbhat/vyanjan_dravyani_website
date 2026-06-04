import { NextResponse } from "next/server";
import { ensureProductAssetFolders } from "@/lib/adminAssets";
import { requireAdminSession } from "@/lib/auth";
import { createProduct, getProducts } from "@/lib/products";

export async function GET() {
  try {
    await requireAdminSession();
    return NextResponse.json({ products: await getProducts() });
  } catch {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = await request.json();
    const product = await createProduct(body);
    await ensureProductAssetFolders(product.slug);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create product.";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ message }, { status });
  }
}
