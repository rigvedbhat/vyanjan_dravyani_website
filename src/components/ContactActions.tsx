import { callUrl, contactNumber, whatsappUrl } from "@/lib/site";

type ContactActionsProps = {
  className?: string;
};

export function ContactActions({ className = "contact-actions" }: ContactActionsProps) {
  return (
    <div className={className}>
      <a className="button primary" href={callUrl}>
        <span className="material-symbols-outlined" aria-hidden="true">call</span>
        Call {contactNumber}
      </a>
      <a className="button secondary" href={whatsappUrl} target="_blank" rel="noreferrer">
        <span className="material-symbols-outlined" aria-hidden="true">chat</span>
        WhatsApp
      </a>
    </div>
  );
}
