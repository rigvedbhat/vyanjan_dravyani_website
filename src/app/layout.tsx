import type { Metadata } from "next";
import "@/app/globals.css";
import { businessName } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${businessName} | Homemade Maharashtrian Masalas`,
    template: `%s | ${businessName}`
  },
  description: "Homemade Maharashtrian masalas prepared in small batches with traditional recipes.",
  openGraph: {
    title: businessName,
    description: "Authentic homemade Maharashtrian masalas.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
