"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/products", label: "Shop", icon: "shopping_bag" },
  { href: "/about", label: "Why Us", icon: "verified" },
  { href: "/contact", label: "Contact", icon: "chat" },
  { href: "/admin", label: "Admin", icon: "star" }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {navItems.map((item) => {
        const current = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined}>
            <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
