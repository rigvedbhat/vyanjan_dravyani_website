type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  copy?: string;
};

export function SectionHeader({ eyebrow, title, copy }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="divider" aria-hidden="true">
        <span className="material-symbols-outlined">spa</span>
      </div>
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2 style={{ marginTop: eyebrow ? 14 : 0 }}>{title}</h2>
      {copy ? <p className="muted" style={{ marginTop: 12 }}>{copy}</p> : null}
    </div>
  );
}
