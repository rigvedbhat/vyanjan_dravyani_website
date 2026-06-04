import { NextResponse } from "next/server";
import { ensureProductAssetFolders } from "@/lib/adminAssets";
import { requireAdminSession } from "@/lib/auth";
import { deleteProduct, updateProduct } from "@/lib/products";

type ProductRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: ProductRouteProps) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = await request.json();
    const product = await updateProduct(id, body);
    await ensureProductAssetFolders(product.slug);
    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update product.";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: ProductRouteProps) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await deleteProduct(id);
    return NextResponse.json({ message: "Product deleted." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete product.";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ message }, { status });
  }
}
