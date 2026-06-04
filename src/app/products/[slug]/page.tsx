import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_PRODUCT_IMAGE, DEFAULT_USE_CASE_IMAGE, galleryImagePath, productCoverPath, useCaseImagePath } from "@/lib/assets";
import { getProductBySlug } from "@/lib/products";
import { whatsappUrl } from "@/lib/site";
import { ContactActions } from "@/components/ContactActions";
import { FallbackImage } from "@/components/FallbackImage";
import { PublicShell } from "@/components/PublicShell";
import { RatingStars } from "@/components/RatingStars";
import { SectionHeader } from "@/components/SectionHeader";
import { BackButton } from "@/components/BackButton";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found"
    };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [productCoverPath(product)]
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const gallery = product.galleryImages.length > 0 ? product.galleryImages : [];
  const reviews = product.reviews.filter((review) => review.approved);

  return (
    <PublicShell>
      <main>
        <section className="section compact">
          <div className="container">
            <BackButton fallbackUrl="/products" label="Back to Products" />
          </div>
          <div className="container product-detail">
            <div className="detail-gallery">
              <div className="card detail-cover">
                <FallbackImage
                  src={productCoverPath(product)}
                  fallbackSrc={DEFAULT_PRODUCT_IMAGE}
                  alt={product.name}
                  width={900}
                  height={900}
                />
              </div>
              {gallery.length > 1 ? (
                <div className="thumb-row" aria-label={`${product.name} gallery`}>
                  {gallery.map((image) => (
                    <div className="thumb" key={image.id}>
                      <FallbackImage
                        src={galleryImagePath(product, image)}
                        fallbackSrc={DEFAULT_PRODUCT_IMAGE}
                        alt={image.alt}
                        width={220}
                        height={220}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="detail-copy">
              <div>
                {product.badge ? <span className="badge">{product.badge}</span> : null}
                <h1 style={{ marginTop: product.badge ? 12 : 0 }}>{product.name}</h1>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
                  <RatingStars rating={product.rating} />
                  <span className="muted">{product.rating.toFixed(1)} ({reviews.length} reviews)</span>
                </div>
              </div>
              <p className="muted" style={{ fontSize: "1.08rem" }}>{product.description}</p>

              <div className="spec-grid">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div className="spec-item" key={key}>
                    <span>{key}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>

              <div className="contact-actions" style={{ marginTop: 0 }}>
                <a className="button primary" href={whatsappUrl} target="_blank" rel="noreferrer">
                  <span className="material-symbols-outlined" aria-hidden="true">chat</span>
                  Order on WhatsApp
                </a>
                <a className="button secondary" href="/contact">
                  Ask a Question
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <SectionHeader title="Perfect For" />
            <div className="grid use-case-grid">
              {product.useCases.map((useCase) => (
                <article className="card use-case-card" key={useCase.id}>
                  <div className="use-case-media">
                    <FallbackImage
                      src={useCaseImagePath(product, useCase)}
                      fallbackSrc={DEFAULT_USE_CASE_IMAGE}
                      alt={useCase.alt}
                      width={620}
                      height={430}
                    />
                  </div>
                  <div className="use-case-body">
                    <h3>{useCase.title}</h3>
                    <p className="muted">{useCase.caption}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <SectionHeader title="Customer Reviews" />
            <div className="grid review-grid">
              {reviews.map((review) => (
                <article className="card review-card" key={review.id}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <strong>{review.customerName}</strong>
                    <RatingStars rating={review.rating} />
                  </div>
                  <p className="muted">{review.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <div className="mobile-sticky-cta">
        <a className="button primary" href={whatsappUrl} target="_blank" rel="noreferrer">
          <span className="material-symbols-outlined" aria-hidden="true">chat</span>
          Order on WhatsApp
        </a>
      </div>
    </PublicShell>
  );
}
