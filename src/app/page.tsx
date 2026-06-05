import Link from "next/link";
import { heroImagePath } from "@/lib/assets";
import { businessName, siteAssets, whatsappUrl } from "@/lib/site";
import { getFeaturedProducts, getVisibleProducts } from "@/lib/products";
import { ContactActions } from "@/components/ContactActions";
import { ContactForm } from "@/components/ContactForm";
import { FallbackImage } from "@/components/FallbackImage";
import { ProductCard } from "@/components/ProductCard";
import { PublicShell } from "@/components/PublicShell";
import { RatingStars } from "@/components/RatingStars";
import { SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

const reasons = [
  {
    icon: "home",
    title: "100% Homemade",
    copy: "Every batch is prepared in small quantities to preserve the authentic taste of a Maharashtrian household kitchen."
  },
  {
    icon: "menu_book",
    title: "Traditional Recipes",
    copy: "Passed down through generations, refined for consistent flavor and daily use."
  },
  {
    icon: "spa",
    title: "Freshly Ground",
    copy: "Spices are roasted and ground in careful batches for a fragrant, fresh finish."
  },
  {
    icon: "verified_user",
    title: "No Preservatives",
    copy: "Pure spice blends without artificial colors or unnecessary additives."
  }
];

export default async function HomePage() {
  const [featuredProducts, products] = await Promise.all([getFeaturedProducts(), getVisibleProducts()]);
  const reviews = products
    .flatMap((product) =>
      product.reviews
        .filter((review) => review.approved)
        .map((review) => ({ ...review, productName: product.name }))
    )
    .slice(0, 3);

  return (
    <PublicShell>
      <main>
        <section className="hero">
          <div className="hero-media" aria-hidden="true">
            <FallbackImage
              src={heroImagePath(siteAssets.hero)}
              fallbackSrc="/assets/hero/masala-hero.svg"
              alt=""
              width={1440}
              height={900}
            />
          </div>
          <div className="hero-content">
            <span className="eyebrow">
              <span className="material-symbols-outlined" aria-hidden="true">local_florist</span>
              Premium Quality
            </span>
            <h1 aria-label="Authentic Homemade Maharashtrian Masalas">
              <span>Authentic</span>
              <span>Homemade</span>
              <span>Maharashtrian</span>
              <span>Masalas</span>
            </h1>
            <p className="hero-copy">
              Experience the true taste of Maharashtra with hand-ground, traditionally prepared spice blends. No artificial preservatives, just pure flavor.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/products">
                Explore Products
                <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
              </Link>
              <a className="button secondary" href={whatsappUrl} target="_blank" rel="noreferrer">
                <span className="material-symbols-outlined" aria-hidden="true">chat</span>
                Order on WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="section" id="products">
          <div className="container">
            <SectionHeader
              title="Featured Products"
              copy="Small-batch masalas for everyday cooking, festive meals, and the flavors that make home feel close."
            />
            <div className="grid product-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="why-us">
          <div className="container">
            <SectionHeader title="The Essence of Our Masalas" copy="Crafted with care, preserving generations of culinary heritage." />
            <div className="grid features-grid">
              {reasons.map((reason) => (
                <article className="card feature-card" key={reason.title}>
                  <span className="feature-icon">
                    <span className="material-symbols-outlined" aria-hidden="true">{reason.icon}</span>
                  </span>
                  <div>
                    <h3>{reason.title}</h3>
                    <p className="muted" style={{ marginTop: 8 }}>{reason.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="reviews">
          <div className="container">
            <SectionHeader title="Customer Reviews" copy="Simple words from kitchens where these masalas are already part of the meal." />
            <div className="grid review-grid">
              {reviews.map((review) => (
                <article className="card review-card" key={review.id}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <strong>{review.customerName}</strong>
                    <RatingStars rating={review.rating} />
                  </div>
                  <p className="muted">{review.text}</p>
                  <small className="muted">{review.productName}</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="contact">
          <div className="container split">
            <div className="card contact-panel">
              <span className="eyebrow">Order Directly</span>
              <h2 style={{ marginTop: 14 }}>{businessName}</h2>
              <p className="muted" style={{ marginTop: 12 }}>
                Call or message to place an order, ask about availability, or discuss custom quantity requirements.
              </p>
              <ContactActions />
            </div>
            <div className="card contact-panel">
              <h2>Send an Inquiry</h2>
              <p className="muted" style={{ margin: "10px 0 18px" }}>
                Share what you need and the team will get back to you.
              </p>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
