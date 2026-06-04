import Link from "next/link";
import { brandingImagePath } from "@/lib/assets";
import { brandTitle, siteAssets } from "@/lib/site";
import { FallbackImage } from "@/components/FallbackImage";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export function Header() {
  return (
    <header className="top-header">
      <Link className="brand-link" href="/" aria-label="Vyanjan Dravyani home">
        <FallbackImage
          className="brand-logo"
          src={brandingImagePath(siteAssets.logo)}
          fallbackSrc="/assets/branding/logo.svg"
          alt=""
          width={34}
          height={34}
        />
        <span className="brand-name">{brandTitle}</span>
      </Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link className="button primary" href="/contact">
          Order Now
        </Link>
      </nav>
      <Link className="icon-button" href="/contact" aria-label="Contact Vyanjan Dravyani">
        <span className="material-symbols-outlined" aria-hidden="true">chat</span>
      </Link>
    </header>
  );
}
