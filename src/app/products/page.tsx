import type { Metadata } from "next";
import { getVisibleProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { PublicShell } from "@/components/PublicShell";
import { SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse homemade Maharashtrian masalas from Vyanjan Dravyani."
};

export default async function ProductsPage() {
  const products = await getVisibleProducts();

  return (
    <PublicShell>
      <main className="section">
        <div className="container">
          <SectionHeader
            eyebrow="Shop Masalas"
            title="Products"
            copy="Choose from traditional Maharashtrian blends, warming tea masala, turmeric, and bright finishing spices."
          />
          <div className="grid product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
