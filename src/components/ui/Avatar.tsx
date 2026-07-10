// SVG servito con <img>: passare l'avatar di default da next/image richiederebbe
// `dangerouslyAllowSVG` in next.config, che non vogliamo abilitare per un asset
// decorativo. Le foto caricate dagli utenti sono JPG/PNG/WebP e restano piccole
// (max 2 MB), quindi non perdiamo ottimizzazioni significative.
export default function Avatar({
  src,
  alt,
  size = 40,
  className = "",
}: {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? "/default-avatar.svg"}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-full object-cover border border-white/10 bg-surface-card ${className}`}
    />
  );
}
