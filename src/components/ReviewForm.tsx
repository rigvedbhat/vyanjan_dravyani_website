"use client";

import { FormEvent, useRef, useState } from "react";

type ReviewFormProps = {
  slug: string;
};

export function ReviewForm({ slug }: ReviewFormProps) {
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");
  const [pending, setPending] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleFileChange() {
    const files = fileRef.current?.files;
    if (!files) {
      setPreviews([]);
      return;
    }

    const urls: string[] = [];
    const limit = Math.min(files.length, 3);
    for (let i = 0; i < limit; i++) {
      urls.push(URL.createObjectURL(files[i]));
    }
    setPreviews(urls);
  }

  function removePreview(index: number) {
    setPreviews((current) => current.filter((_, i) => i !== index));
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("rating", String(rating));

    setPending(true);
    setStatus("");
    setStatusType("");

    try {
      const response = await fetch(`/api/reviews/${slug}`, {
        method: "POST",
        body: formData
      });

      const result = (await response.json()) as { message?: string };
      const message = result.message ?? (response.ok ? "Review submitted!" : "Could not submit review.");

      if (response.ok) {
        setStatusType("success");
        setStatus(message);
        form.reset();
        setRating(5);
        setPreviews([]);
        setTimeout(() => {
          setStatus("");
          setStatusType("");
        }, 6000);
      } else {
        setStatusType("error");
        setStatus(message);
      }
    } catch {
      setStatusType("error");
      setStatus("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <div className="review-form-wrapper">
      <div className="review-form-header">
        <span className="material-symbols-outlined" aria-hidden="true">edit_note</span>
        <div>
          <h3>Share Your Experience</h3>
          <p className="muted">Your review will appear after approval.</p>
        </div>
      </div>

      <form className="form-grid review-form" onSubmit={submit} ref={formRef}>
        <div className="review-form-row">
          <div className="field">
            <label htmlFor={`review-name-${slug}`}>Your Name <span className="required-mark">*</span></label>
            <input
              id={`review-name-${slug}`}
              name="name"
              type="text"
              autoComplete="name"
              maxLength={80}
              placeholder="e.g. Priya S."
              required
            />
          </div>
          <div className="field">
            <label id={`rating-label-${slug}`}>Rating <span className="required-mark">*</span></label>
            <div
              className="star-selector"
              role="radiogroup"
              aria-labelledby={`rating-label-${slug}`}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= displayRating ? "active" : ""}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  aria-checked={star === rating}
                  role="radio"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {star <= displayRating ? "star" : "star_border"}
                  </span>
                </button>
              ))}
              <span className="star-label muted">{displayRating}/5</span>
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor={`review-text-${slug}`}>Your Review <span className="required-mark">*</span></label>
          <textarea
            id={`review-text-${slug}`}
            name="text"
            maxLength={600}
            rows={4}
            placeholder="Tell others about your experience with this masala..."
            required
          />
        </div>

        <div className="field">
          <label htmlFor={`review-images-${slug}`}>
            Add Photos
            <span className="muted" style={{ fontWeight: 400, fontSize: "0.85rem" }}> (optional, max 3)</span>
          </label>
          <input
            id={`review-images-${slug}`}
            ref={fileRef}
            name="images"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            onChange={handleFileChange}
          />
          {previews.length > 0 && (
            <div className="review-previews">
              {previews.map((url, index) => (
                <div className="review-preview-item" key={url}>
                  <img src={url} alt={`Preview ${index + 1}`} />
                  <button
                    className="preview-remove"
                    type="button"
                    onClick={() => removePreview(index)}
                    aria-label="Remove image"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="button primary" type="submit" disabled={pending}>
          <span className="material-symbols-outlined" aria-hidden="true">send</span>
          {pending ? "Submitting…" : "Submit Review"}
        </button>

        {status && (
          <p className={`status-line ${statusType}`} aria-live="polite">{status}</p>
        )}
      </form>
    </div>
  );
}
