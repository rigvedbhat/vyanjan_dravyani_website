"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setStatus("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password")
      })
    });

    const result = (await response.json()) as { message?: string };
    setPending(false);

    if (response.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }

    setStatus(result.message ?? "Login failed.");
  }

  return (
    <form className="card contact-panel form-grid" onSubmit={submit}>
      <div>
        <span className="eyebrow">Protected Area</span>
        <h1 style={{ marginTop: 14 }}>Admin Login</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          Sign in to manage products, images, reviews, and visibility.
        </p>
      </div>
      {!configured ? (
        <p className="status-line" role="alert">
          Admin environment variables are not configured yet.
        </p>
      ) : null}
      <div className="field">
        <label htmlFor="admin-username">Username</label>
        <input id="admin-username" name="username" autoComplete="username" required disabled={!configured || pending} />
      </div>
      <div className="field">
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={!configured || pending}
        />
      </div>
      <button className="button primary" type="submit" disabled={!configured || pending}>
        <span className="material-symbols-outlined" aria-hidden="true">lock_open</span>
        {pending ? "Signing In" : "Sign In"}
      </button>
      <p className="status-line" aria-live="polite">{status}</p>
    </form>
  );
}
