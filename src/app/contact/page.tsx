import type { Metadata } from "next";
import { businessName, contactNumber } from "@/lib/site";
import { ContactActions } from "@/components/ContactActions";
import { ContactForm } from "@/components/ContactForm";
import { PublicShell } from "@/components/PublicShell";
import { SectionHeader } from "@/components/SectionHeader";
import { BackButton } from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Vyanjan Dravyani to order homemade Maharashtrian masalas."
};

export default function ContactPage() {
  return (
    <PublicShell>
      <main className="section">
        <div className="container">
          <BackButton fallbackUrl="/" label="Back to Home" />
          <SectionHeader
            eyebrow="Order or Ask"
            title="Contact"
            copy="Call, WhatsApp, or send a quick inquiry for availability and orders."
          />
          <div className="split">
            <section className="card contact-panel">
              <h2>{businessName}</h2>
              <p className="muted" style={{ marginTop: 12 }}>Phone: {contactNumber}</p>
              <ContactActions />
            </section>
            <section className="card contact-panel">
              <h2>Send Message</h2>
              <p className="muted" style={{ margin: "10px 0 18px" }}>Tell us which products you are interested in.</p>
              <ContactForm />
            </section>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
