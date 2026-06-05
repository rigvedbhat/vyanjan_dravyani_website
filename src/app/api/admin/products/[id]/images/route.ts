import { NextResponse } from "next/server";
import { deleteAsset, productImageFolder, saveImageUpload, useCaseImageFolder } from "@/lib/adminAssets";
import { requireAdminSession } from "@/lib/auth";
import { getAdminProductById, updateProduct } from "@/lib/products";
import { makeId, sanitizeText, sortByOrder } from "@/lib/security";

type ImageRouteProps = {
  params: Promise<{ id: string }>;
};

function getFile(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Image file is required.");
  }

  return file;
}

export async function POST(request: Request, { params }: ImageRouteProps) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const product = await getAdminProductById(id);
    if (!product) {
      throw new Error("Product not found.");
    }

    const formData = await request.formData();
    const kind = sanitizeText(formData.get("kind"), 20);
    const file = getFile(formData);

    if (kind === "useCase") {
      const imageUrl = await saveImageUpload(file, useCaseImageFolder(product.slug));
      const nextProduct = await updateProduct(id, {
        ...product,
        useCases: [
          ...product.useCases,
          {
            id: makeId("uc"),
            title: sanitizeText(formData.get("title"), 120),
            caption: sanitizeText(formData.get("caption"), 280),
            image: imageUrl,
            alt: sanitizeText(formData.get("alt"), 160) || sanitizeText(formData.get("title"), 120),
            order: product.useCases.length + 1
          }
        ]
      });
      return NextResponse.json({ product: nextProduct });
    }

    const imageUrl = await saveImageUpload(file, productImageFolder(product.slug));
    const image = {
      id: makeId("img"),
      filename: imageUrl,
      alt: sanitizeText(formData.get("alt"), 160) || product.name,
      order: product.galleryImages.length + 1
    };

    const nextProduct = await updateProduct(id, {
      ...product,
      coverImage: kind === "cover" ? imageUrl : product.coverImage || imageUrl,
      galleryImages: kind === "cover" ? [image, ...product.galleryImages] : [...product.galleryImages, image]
    });

    return NextResponse.json({ product: nextProduct });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload image.";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(request: Request, { params }: ImageRouteProps) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const product = await getAdminProductById(id);
    if (!product) {
      throw new Error("Product not found.");
    }

    const body = (await request.json()) as { imageType?: string; imageId?: string };
    if (body.imageType === "useCase") {
      const useCase = product.useCases.find((item) => item.id === body.imageId);
      if (!useCase) {
        throw new Error("Use case image not found.");
      }

      // Delete from Cloudinary if it's a cloud URL
      if (useCase.image.startsWith("http")) {
        await deleteAsset(useCase.image);
      }

      const nextUseCases = sortByOrder(
        product.useCases.filter((item) => item.id !== useCase.id)
      ).map((item, index) => ({ ...item, order: index + 1 }));
      const nextProduct = await updateProduct(id, { ...product, useCases: nextUseCases });
      return NextResponse.json({ product: nextProduct });
    }

    const image = product.galleryImages.find((item) => item.id === body.imageId);
    if (!image) {
      throw new Error("Gallery image not found.");
    }

    // Delete from Cloudinary if it's a cloud URL
    if (image.filename.startsWith("http")) {
      await deleteAsset(image.filename);
    }

    const nextGallery = sortByOrder(
      product.galleryImages.filter((item) => item.id !== image.id)
    ).map((item, index) => ({ ...item, order: index + 1 }));

    const nextProduct = await updateProduct(id, {
      ...product,
      coverImage:
        product.coverImage === image.filename ? nextGallery[0]?.filename ?? "" : product.coverImage,
      galleryImages: nextGallery
    });

    return NextResponse.json({ product: nextProduct });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete image.";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ message }, { status });
  }
}
