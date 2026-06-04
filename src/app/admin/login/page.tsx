import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession, isAuthConfigured } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="admin-page">
      <div className="container" style={{ maxWidth: 560 }}>
        <AdminLoginForm configured={isAuthConfigured()} />
      </div>
    </main>
  );
}
