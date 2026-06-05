import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { deleteInquiry } from "@/lib/products";

type InquiryRouteProps = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: InquiryRouteProps) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await deleteInquiry(id);
    return NextResponse.json({ message: "Inquiry deleted." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete inquiry.";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ message }, { status });
  }
}
