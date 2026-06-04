"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setPending(true);
    setStatus("");

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: formData.get("name"),
        phone: formData.get("phone"),
        message: formData.get("message")
      })
    });

    const result = (await response.json()) as { message?: string };
    setPending(false);
    setStatus(result.message ?? (response.ok ? "Message sent." : "Could not send message."));
    if (response.ok) {
      form.reset();
    }
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <div className="field">
        <label htmlFor="contact-name">Name</label>
        <input id="contact-name" name="name" type="text" autoComplete="name" maxLength={80} required />
      </div>
      <div className="field">
        <label htmlFor="contact-phone">Phone</label>
        <input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={20} required />
      </div>
      <div className="field">
        <label htmlFor="contact-message">Message</label>
        <textarea id="contact-message" name="message" maxLength={600} required />
      </div>
      <button className="button primary" type="submit" disabled={pending}>
        <span className="material-symbols-outlined" aria-hidden="true">send</span>
        {pending ? "Sending" : "Send Message"}
      </button>
      <p className="status-line" aria-live="polite">{status}</p>
    </form>
  );
}
