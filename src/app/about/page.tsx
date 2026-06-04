import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";
import { SectionHeader } from "@/components/SectionHeader";
import { BackButton } from "@/components/BackButton";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Vyanjan Dravyani and its homemade Maharashtrian masalas."
};

export default function AboutPage() {
  return (
    <PublicShell>
      <main className="section">
        <div className="container">
          <BackButton fallbackUrl="/" label="Back to Home" />
          <SectionHeader
            eyebrow="Our Kitchen"
            title="Homemade With Maharashtrian Memory"
            copy="Vyanjan Dravyani is built around the comfort of familiar flavors, small-batch preparation, and recipes that belong at the center of everyday meals."
          />
          <div className="split">
            <article className="card story-panel">
              <h2>Our Promise</h2>
              <p className="muted" style={{ marginTop: 12 }}>
                Every blend is made with care, using ingredients chosen for aroma, color, and balance. The result is masala that feels personal: fresh enough for daily cooking and special enough for festive recipes.
              </p>
            </article>
            <article className="card story-panel">
              <h2>Why It Matters</h2>
              <p className="muted" style={{ marginTop: 12 }}>
                Maharashtrian food carries warmth, patience, and a quiet complexity. Our masalas keep that character intact with traditional combinations, careful roasting, and no unnecessary additives.
              </p>
            </article>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
