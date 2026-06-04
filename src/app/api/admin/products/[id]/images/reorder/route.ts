import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { reorderProductImages } from "@/lib/products";

type ReorderRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: ReorderRouteProps) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json()) as { ids?: string[]; imageType?: "gallery" | "useCases" };
    if (!Array.isArray(body.ids) || !body.imageType) {
      throw new Error("Invalid reorder request.");
    }

    const product = await reorderProductImages(id, body.ids, body.imageType);
    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reorder images.";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ message }, { status });
  }
}
