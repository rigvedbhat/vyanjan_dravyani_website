import Link from "next/link";
import { businessName, contactNumber } from "@/lib/site";
import { ContactActions } from "@/components/ContactActions";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div>
          <strong className="serif" style={{ color: "var(--primary)" }}>{businessName}</strong>
          <p>Homemade Maharashtrian masalas, prepared in small batches.</p>
          <p>Contact: {contactNumber}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="button ghost" href="/admin">Admin</Link>
          <ContactActions className="contact-actions" />
        </div>
      </div>
    </footer>
  );
}
