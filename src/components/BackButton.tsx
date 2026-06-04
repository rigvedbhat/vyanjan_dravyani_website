"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackUrl?: string;
  label?: string;
};

export function BackButton({ fallbackUrl, label = "Back" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // If the browser history has pages, navigate back; otherwise go to the fallback URL
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else if (fallbackUrl) {
      router.push(fallbackUrl);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="back-button-container">
      <button onClick={handleBack} className="back-button" aria-label={label}>
        <span className="material-symbols-outlined" aria-hidden="true">
          arrow_back
        </span>
        {label}
      </button>
    </div>
  );
}
